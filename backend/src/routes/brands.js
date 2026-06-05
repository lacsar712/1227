const express = require('express');
const { Op } = require('sequelize');
const { Brand, Product, Category, FlashSale } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

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
  return await FlashSale.findOne({
    where,
    attributes: ['id', 'name', 'sale_price', 'stock', 'original_stock', 'start_time', 'end_time']
  });
};

const enrichProductWithFlashSale = async (product) => {
  const p = product.toJSON ? product.toJSON() : { ...product };
  const flashSale = await getActiveFlashSale(p.id);
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
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await Brand.findAndCountAll({
      where: { status: 'active' },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
      attributes: [
        'id',
        'name',
        'slug',
        'logo',
        'description',
        'country',
        'established_year',
        'sort_order'
      ]
    });

    const list = [];
    for (const brand of rows) {
      const brandJson = brand.toJSON();
      const productCount = await Product.count({
        where: { brand_id: brand.id, status: 'active' }
      });
      brandJson.product_count = productCount;
      list.push(brandJson);
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
    logger.error('Get brands error:', err);
    res.status(500).json({ code: 500, message: '获取品牌列表失败' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const list = await Brand.findAll({
      where: { status: 'active' },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'slug', 'logo', 'sort_order']
    });
    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get all brands error:', err);
    res.status(500).json({ code: 500, message: '获取品牌列表失败' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const brand = await Brand.findOne({
      where: { slug: req.params.slug, status: 'active' },
      attributes: [
        'id',
        'name',
        'slug',
        'logo',
        'description',
        'story',
        'website',
        'country',
        'established_year'
      ]
    });

    if (!brand) {
      return res.status(404).json({ code: 404, message: '品牌不存在' });
    }

    const brandJson = brand.toJSON();
    const productCount = await Product.count({
      where: { brand_id: brand.id, status: 'active' }
    });
    brandJson.product_count = productCount;

    res.json({ code: 0, data: brandJson });
  } catch (err) {
    logger.error('Get brand detail error:', err);
    res.status(500).json({ code: 500, message: '获取品牌详情失败' });
  }
});

router.get('/:slug/products', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'newest' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const brand = await Brand.findOne({
      where: { slug: req.params.slug, status: 'active' },
      attributes: ['id']
    });

    if (!brand) {
      return res.status(404).json({ code: 404, message: '品牌不存在' });
    }

    const where = { status: 'active', brand_id: brand.id };

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
    logger.error('Get brand products error:', err);
    res.status(500).json({ code: 500, message: '获取品牌商品失败' });
  }
});

module.exports = router;
