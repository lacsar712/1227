const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');
const { FlashSale, Product } = require('../models');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

const getActiveFlashSale = async (productId, flashSaleId = null, requireStock = true) => {
  const now = new Date();
  const where = {
    product_id: productId,
    status: 'active',
    start_time: { [Op.lte]: now },
    end_time: { [Op.gt]: now }
  };
  if (requireStock) {
    where.stock = { [Op.gt]: 0 };
  }
  if (flashSaleId) {
    where.id = flashSaleId;
  }
  return await FlashSale.findOne({ where });
};

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const { type = 'all' } = req.query;

    let where = { status: 'active' };

    if (type === 'ongoing') {
      where.start_time = { [Op.lte]: now };
      where.end_time = { [Op.gt]: now };
    } else if (type === 'upcoming') {
      where.start_time = { [Op.gt]: now };
      where.end_time = { [Op.gt]: now };
    }

    const { rows } = await FlashSale.findAndCountAll({
      where,
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'original_price', 'image', 'stock']
      }],
      order: [['start_time', 'ASC']]
    });

    const ongoing = [];
    const upcoming = [];
    const soldOut = [];

    rows.forEach((fs) => {
      const item = {
        id: fs.id,
        name: fs.name,
        product_id: fs.product_id,
        sale_price: parseFloat(fs.sale_price),
        original_price: fs.Product ? parseFloat(fs.Product.price) : 0,
        original_product_price: fs.Product ? parseFloat(fs.Product.original_price || fs.Product.price) : 0,
        stock: fs.stock,
        original_stock: fs.original_stock,
        start_time: fs.start_time,
        end_time: fs.end_time,
        product: fs.Product
      };

      const startTime = new Date(fs.start_time);
      const endTime = new Date(fs.end_time);

      if (startTime <= now && endTime > now) {
        if (fs.stock > 0) {
          ongoing.push(item);
        } else {
          soldOut.push(item);
        }
      } else if (startTime > now) {
        upcoming.push(item);
      }
    });

    res.json({
      code: 0,
      data: { ongoing, sold_out: soldOut, upcoming }
    });
  } catch (err) {
    logger.error('Get flash sales error:', err);
    res.status(500).json({ code: 500, message: '获取秒杀活动失败' });
  }
});

router.get('/home', async (req, res) => {
  try {
    const now = new Date();
    const { limit = 4 } = req.query;

    const { rows } = await FlashSale.findAndCountAll({
      where: {
        status: 'active',
        start_time: { [Op.lte]: now },
        end_time: { [Op.gt]: now }
      },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'original_price', 'image', 'stock']
      }],
      order: [
        ['stock', 'DESC'],
        ['start_time', 'ASC']
      ],
      limit: parseInt(limit, 10)
    });

    const list = rows.map((fs) => ({
      id: fs.id,
      name: fs.name,
      product_id: fs.product_id,
      sale_price: parseFloat(fs.sale_price),
      original_price: fs.Product ? parseFloat(fs.Product.price) : 0,
      stock: fs.stock,
      original_stock: fs.original_stock,
      start_time: fs.start_time,
      end_time: fs.end_time,
      product: fs.Product
    }));

    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get home flash sales error:', err);
    res.status(500).json({ code: 500, message: '获取秒杀活动失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const flashSale = await FlashSale.findByPk(req.params.id, {
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'original_price', 'image', 'stock', 'description']
      }]
    });

    if (!flashSale) {
      return res.status(404).json({ code: 404, message: '秒杀活动不存在' });
    }

    const now = new Date();
    const startTime = new Date(flashSale.start_time);
    const endTime = new Date(flashSale.end_time);

    let saleStatus = 'upcoming';
    if (startTime <= now && endTime > now) {
      saleStatus = flashSale.stock > 0 ? 'ongoing' : 'sold_out';
    } else if (endTime <= now) {
      saleStatus = 'ended';
    }

    res.json({
      code: 0,
      data: {
        ...flashSale.toJSON(),
        sale_price: parseFloat(flashSale.sale_price),
        sale_status: saleStatus,
        product: flashSale.Product
      }
    });
  } catch (err) {
    logger.error('Get flash sale detail error:', err);
    res.status(500).json({ code: 500, message: '获取秒杀活动详情失败' });
  }
});

router.get('/product/:productId/active', async (req, res) => {
  try {
    const flashSale = await getActiveFlashSale(req.params.productId);
    if (!flashSale) {
      return res.json({ code: 0, data: null });
    }

    const product = await Product.findByPk(req.params.productId, {
      attributes: ['id', 'name', 'price', 'original_price', 'image']
    });

    res.json({
      code: 0,
      data: {
        id: flashSale.id,
        name: flashSale.name,
        sale_price: parseFloat(flashSale.sale_price),
        original_price: product ? parseFloat(product.price) : 0,
        stock: flashSale.stock,
        original_stock: flashSale.original_stock,
        start_time: flashSale.start_time,
        end_time: flashSale.end_time
      }
    });
  } catch (err) {
    logger.error('Get product active flash sale error:', err);
    res.status(500).json({ code: 500, message: '获取秒杀活动失败' });
  }
});

router.post(
  '/',
  [
    body('product_id').isInt().withMessage('商品ID无效'),
    body('name').isLength({ min: 1, max: 200 }).withMessage('活动名称不能为空'),
    body('sale_price').isFloat({ min: 0.01 }).withMessage('秒杀价格无效'),
    body('original_stock').isInt({ min: 1 }).withMessage('秒杀库存至少为1'),
    body('start_time').isISO8601().withMessage('开始时间无效'),
    body('end_time').isISO8601().withMessage('结束时间无效')
  ],
  validate,
  async (req, res) => {
    try {
      const { product_id, name, sale_price, original_stock, start_time, end_time } = req.body;

      const product = await Product.findByPk(product_id);
      if (!product || product.status !== 'active') {
        return res.status(400).json({ code: 400, message: '商品不存在或已下架' });
      }

      if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ code: 400, message: '开始时间必须早于结束时间' });
      }

      if (parseFloat(sale_price) >= parseFloat(product.price)) {
        return res.status(400).json({ code: 400, message: '秒杀价格必须低于商品原价' });
      }

      const flashSale = await FlashSale.create({
        product_id,
        name,
        sale_price,
        original_stock,
        stock: original_stock,
        start_time,
        end_time,
        status: 'active'
      });

      res.json({ code: 0, data: flashSale, message: '秒杀活动创建成功' });
    } catch (err) {
      logger.error('Create flash sale error:', err);
      res.status(500).json({ code: 500, message: '创建秒杀活动失败' });
    }
  }
);

router.put(
  '/:id',
  [
    body('name').optional().isLength({ min: 1, max: 200 }).withMessage('活动名称不能为空'),
    body('sale_price').optional().isFloat({ min: 0.01 }).withMessage('秒杀价格无效'),
    body('original_stock').optional().isInt({ min: 1 }).withMessage('秒杀库存至少为1'),
    body('start_time').optional().isISO8601().withMessage('开始时间无效'),
    body('end_time').optional().isISO8601().withMessage('结束时间无效'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('状态无效')
  ],
  validate,
  async (req, res) => {
    try {
      const flashSale = await FlashSale.findByPk(req.params.id);
      if (!flashSale) {
        return res.status(404).json({ code: 404, message: '秒杀活动不存在' });
      }

      const { name, sale_price, original_stock, start_time, end_time, status } = req.body;

      if (start_time && end_time && new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ code: 400, message: '开始时间必须早于结束时间' });
      }

      if (sale_price) {
        const product = await Product.findByPk(flashSale.product_id);
        if (parseFloat(sale_price) >= parseFloat(product.price)) {
          return res.status(400).json({ code: 400, message: '秒杀价格必须低于商品原价' });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (sale_price !== undefined) updateData.sale_price = sale_price;
      if (original_stock !== undefined) {
        updateData.original_stock = original_stock;
        const sold = flashSale.original_stock - flashSale.stock;
        updateData.stock = Math.max(0, original_stock - sold);
      }
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (status !== undefined) updateData.status = status;

      await flashSale.update(updateData);

      res.json({ code: 0, data: flashSale, message: '秒杀活动更新成功' });
    } catch (err) {
      logger.error('Update flash sale error:', err);
      res.status(500).json({ code: 500, message: '更新秒杀活动失败' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const flashSale = await FlashSale.findByPk(req.params.id);
    if (!flashSale) {
      return res.status(404).json({ code: 404, message: '秒杀活动不存在' });
    }

    await flashSale.destroy();
    res.json({ code: 0, message: '秒杀活动删除成功' });
  } catch (err) {
    logger.error('Delete flash sale error:', err);
    res.status(500).json({ code: 500, message: '删除秒杀活动失败' });
  }
});

module.exports = { router, getActiveFlashSale };
