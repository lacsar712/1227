const express = require('express');
const { body } = require('express-validator');
const { Cart, CartItem, Product } = require('../models');
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

router.get('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const items = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock'] }]
    });
    const list = items
      .filter((i) => i.Product)
      .map((i) => ({
        id: i.id,
        product_id: i.product_id,
        quantity: i.quantity,
        product: i.Product
      }));
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
    body('quantity').optional().isInt({ min: 1 }).withMessage('数量至少为1')
  ],
  validate,
  async (req, res) => {
    try {
      const { product_id, quantity = 1 } = req.body;
      const product = await Product.findByPk(product_id);
      if (!product || product.status !== 'active') {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ code: 400, message: '库存不足' });
      }
      const cart = await getOrCreateCart(req.user.id);
      let item = await CartItem.findOne({ where: { cart_id: cart.id, product_id } });
      if (item) {
        const newQty = item.quantity + quantity;
        if (product.stock < newQty) {
          return res.status(400).json({ code: 400, message: '库存不足' });
        }
        item.quantity = newQty;
        await item.save();
      } else {
        item = await CartItem.create({ cart_id: cart.id, product_id, quantity });
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
      if (item.Product.stock < quantity) {
        return res.status(400).json({ code: 400, message: '库存不足' });
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
