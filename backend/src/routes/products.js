const express = require('express');
const { Op } = require('sequelize');
const { Product, Category, Brand, FlashSale } = require('../models');
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
  return await FlashSale.findOne({
    where,
    attributes: ['id', 'name', 'sale_price', 'stock', 'original_stock', 'start_time', 'end_time']
  });
};

const enrichProductWithFlashSale = async (product) => {
  const p = product.toJSON ? product.toJSON() : { ...product };
  const flashSale = await getActiveFlashSale(p.id, null, false);
  if (flashSale) {
    p.flash_sale = {
      id: flashSale.id,
      name: flashSale.name,
      sale_price: parseFloat(flashSale.sale_price),
      stock: flashSale.stock,
      original_stock: flashSale.original_stock,
      start_time: flashSale.start_time,
      end_time: flashSale.end_time
    };
    p.display_price = parseFloat(flashSale.sale_price);
    p.original_display_price = parseFloat(p.price);
  } else {
    p.flash_sale = null;
    p.display_price = parseFloat(p.price);
    p.original_display_price = p.original_price ? parseFloat(p.original_price) : null;
  }
  return p;
};

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      keyword = '',
      category_id,
      brand_id,
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
    if (brand_id) where.brand_id = brand_id;
    if (min_price) where.price = { ...where.price, [Op.gte]: parseFloat(min_price) };
    if (max_price) where.price = { ...where.price, [Op.lte]: parseFloat(max_price) };

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'sales') order = [['sales_count', 'DESC']];
    else if (sort === 'newest') order = [['created_at', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: Brand, attributes: ['id', 'name', 'slug', 'logo'] }
      ],
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
        'category_id',
        'brand_id'
      ]
    });

    const list = [];
    for (const p of rows) {
      list.push(await enrichProductWithFlashSale(p));
    }

    res.json({
      code: 0,
      data: {
        list,
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
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: Brand, attributes: ['id', 'name', 'slug', 'logo', 'description'] }
      ]
    });
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }

    const enriched = await enrichProductWithFlashSale(product);
    res.json({ code: 0, data: enriched });
  } catch (err) {
    logger.error('Get product detail error:', err);
    res.status(500).json({ code: 500, message: '获取商品详情失败' });
  }
});

module.exports = router;
