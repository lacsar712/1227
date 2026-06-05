const express = require('express');
const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      keyword = '',
      category_id,
      sort = 'newest',
      min_price,
      max_price
    } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { status: 'active' };

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (category_id) where.category_id = category_id;
    if (min_price) where.price = { ...where.price, [Op.gte]: parseFloat(min_price) };
    if (max_price) where.price = { ...where.price, [Op.lte]: parseFloat(max_price) };

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'sales') order = [['sales_count', 'DESC']];
    else if (sort === 'newest') order = [['created_at', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
      order,
      limit: parseInt(limit, 10),
      offset,
      attributes: [
        'id',
        'name',
        'slug',
        'price',
        'original_price',
        'image',
        'stock',
        'sales_count',
        'category_id'
      ]
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    logger.error('Get products error:', err);
    res.status(500).json({ code: 500, message: '获取商品失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }]
    });
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    res.json({ code: 0, data: product });
  } catch (err) {
    logger.error('Get product detail error:', err);
    res.status(500).json({ code: 500, message: '获取商品详情失败' });
  }
});

module.exports = router;
