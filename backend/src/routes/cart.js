const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');
const { Cart, CartItem, Product, FlashSale } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) {
    cart = await Cart.create({ user_id: userId });
  }
  return cart;
};

const getActiveFlashSale = async (productId, flashSaleId = null) => {
  const now = new Date();
  const where = {
    product_id: productId,
    status: 'active',
    start_time: { [Op.lte]: now },
    end_time: { [Op.gt]: now },
    stock: { [Op.gt]: 0 }
  };
  if (flashSaleId) {
    where.id = flashSaleId;
  }
  return await FlashSale.findOne({ where });
};

const getFlashSaleForCartItem = async (cartItem) => {
  if (!cartItem.flash_sale_id) return null;
  const fs = await FlashSale.findByPk(cartItem.flash_sale_id);
  if (!fs) return null;
  const now = new Date();
  const startTime = new Date(fs.start_time);
  const endTime = new Date(fs.end_time);
  if (startTime <= now && endTime > now && fs.stock > 0) {
    return {
      id: fs.id,
      name: fs.name,
      sale_price: parseFloat(fs.sale_price),
      stock: fs.stock,
      start_time: fs.start_time,
      end_time: fs.end_time
    };
  }
  return null;
};

router.get('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const items = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock'] }]
    });

    const list = [];
    for (const i of items) {
      if (!i.Product) continue;
      const flashSale = await getFlashSaleForCartItem(i);
      const item = {
        id: i.id,
        product_id: i.product_id,
        flash_sale_id: i.flash_sale_id,
        quantity: i.quantity,
        product: i.Product,
        flash_sale: flashSale,
        is_flash_sale_expired: i.flash_sale_id && !flashSale
      };
      if (flashSale) {
        item.effective_price = flashSale.sale_price;
      } else {
        item.effective_price = parseFloat(i.Product.price);
      }
      list.push(item);
    }

    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get cart error:', err);
    res.status(500).json({ code: 500, message: '获取购物车失败' });
  }
});

router.post(
  '/add',
  [
    body('product_id').isInt().withMessage('商品ID无效'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('数量至少为1'),
    body('flash_sale_id').optional().isInt().withMessage('秒杀活动ID无效')
  ],
  validate,
  async (req, res) => {
    try {
      const { product_id, quantity = 1, flash_sale_id } = req.body;
      const product = await Product.findByPk(product_id);
      if (!product || product.status !== 'active') {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      let flashSale = null;
      if (flash_sale_id) {
        flashSale = await FlashSale.findByPk(flash_sale_id);
        if (!flashSale || flashSale.product_id !== product_id) {
          return res.status(400).json({ code: 400, message: '秒杀活动无效' });
        }
        const now = new Date();
        const startTime = new Date(flashSale.start_time);
        const endTime = new Date(flashSale.end_time);
        if (startTime > now) {
          return res.status(400).json({ code: 400, message: '秒杀活动尚未开始' });
        }
        if (endTime <= now) {
          return res.status(400).json({ code: 400, message: '秒杀活动已结束' });
        }
        if (flashSale.stock <= 0) {
          return res.status(400).json({ code: 400, message: '秒杀商品已售罄' });
        }
        if (flashSale.stock < quantity) {
          return res.status(400).json({ code: 400, message: '秒杀库存不足' });
        }
      } else {
        flashSale = await getActiveFlashSale(product_id);
      }

      if (product.stock < quantity) {
        return res.status(400).json({ code: 400, message: '库存不足' });
      }

      const cart = await getOrCreateCart(req.user.id);

      const whereClause = { cart_id: cart.id, product_id };
      if (flashSale) {
        whereClause.flash_sale_id = flashSale.id;
      } else {
        whereClause.flash_sale_id = null;
      }

      let item = await CartItem.findOne({ where: whereClause });
      if (item) {
        const newQty = item.quantity + quantity;
        if (flashSale) {
          if (flashSale.stock < newQty) {
            return res.status(400).json({ code: 400, message: '秒杀库存不足' });
          }
        } else {
          if (product.stock < newQty) {
            return res.status(400).json({ code: 400, message: '库存不足' });
          }
        }
        item.quantity = newQty;
        await item.save();
      } else {
        item = await CartItem.create({
          cart_id: cart.id,
          product_id,
          flash_sale_id: flashSale ? flashSale.id : null,
          quantity
        });
      }
      res.json({ code: 0, data: item, message: '已加入购物车' });
    } catch (err) {
      logger.error('Add cart error:', err);
      res.status(500).json({ code: 500, message: '添加失败' });
    }
  }
);

router.put(
  '/:id/quantity',
  [body('quantity').isInt({ min: 1 }).withMessage('数量至少为1')],
  validate,
  async (req, res) => {
    try {
      const cart = await getOrCreateCart(req.user.id);
      const item = await CartItem.findOne({
        where: { id: req.params.id, cart_id: cart.id },
        include: [Product]
      });
      if (!item) {
        return res.status(404).json({ code: 404, message: '购物车项不存在' });
      }
      const { quantity } = req.body;

      if (item.flash_sale_id) {
        const flashSale = await getFlashSaleForCartItem(item);
        if (!flashSale) {
          return res.status(400).json({ code: 400, message: '秒杀活动已结束或已售罄' });
        }
        if (flashSale.stock < quantity) {
          return res.status(400).json({ code: 400, message: '秒杀库存不足' });
        }
      } else {
        if (item.Product.stock < quantity) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
      }

      item.quantity = quantity;
      await item.save();
      res.json({ code: 0, data: item });
    } catch (err) {
      logger.error('Update cart quantity error:', err);
      res.status(500).json({ code: 500, message: '更新失败' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const deleted = await CartItem.destroy({
      where: { id: req.params.id, cart_id: cart.id }
    });
    if (!deleted) {
      return res.status(404).json({ code: 404, message: '购物车项不存在' });
    }
    res.json({ code: 0, message: '已移除' });
  } catch (err) {
    logger.error('Delete cart item error:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await CartItem.destroy({ where: { cart_id: cart.id } });
    res.json({ code: 0, message: '已清空购物车' });
  } catch (err) {
    logger.error('Clear cart error:', err);
    res.status(500).json({ code: 500, message: '清空失败' });
  }
});

module.exports = router;
