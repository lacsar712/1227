const express = require('express');
const { Category } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Category.findAll({
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'name', 'slug', 'image', 'sort_order']
    });
    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get categories error:', err);
    res.status(500).json({ code: 500, message: '获取分类失败' });
  }
});

module.exports = router;
