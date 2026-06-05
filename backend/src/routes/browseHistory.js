const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');
const { BrowseHistory, Product } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

const MAX_HISTORY = 50;

router.get('/', async (req, res) => {
  try {
    const history = await BrowseHistory.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'image', 'stock', 'status', 'description']
        }
      ],
      order: [['viewed_at', 'DESC']],
      limit: MAX_HISTORY
    });

    const list = history
      .filter((h) => h.Product)
      .map((h) => ({
        id: h.id,
        product_id: h.product_id,
        viewed_at: h.viewed_at,
        product: h.Product
      }));

    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get browse history error:', err);
    res.status(500).json({ code: 500, message: '获取浏览历史失败' });
  }
});

router.post(
  '/add',
  [body('product_id').isInt().withMessage('商品ID无效')],
  validate,
  async (req, res) => {
    try {
      const { product_id } = req.body;
      const product = await Product.findByPk(product_id);
      if (!product || product.status !== 'active') {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }

      const existing = await BrowseHistory.findOne({
        where: { user_id: req.user.id, product_id }
      });

      if (existing) {
        existing.viewed_at = new Date();
        await existing.save();
      } else {
        const count = await BrowseHistory.count({ where: { user_id: req.user.id } });
        if (count >= MAX_HISTORY) {
          const oldest = await BrowseHistory.findOne({
            where: { user_id: req.user.id },
            order: [['viewed_at', 'ASC']]
          });
          if (oldest) {
            await oldest.destroy();
          }
        }
        await BrowseHistory.create({ user_id: req.user.id, product_id });
      }

      res.json({ code: 0, message: '已记录浏览' });
    } catch (err) {
      logger.error('Add browse history error:', err);
      res.status(500).json({ code: 500, message: '记录失败' });
    }
  }
);

router.delete('/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const deleted = await BrowseHistory.destroy({
      where: { user_id: req.user.id, product_id: productId }
    });
    if (!deleted) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    res.json({ code: 0, message: '已移除' });
  } catch (err) {
    logger.error('Delete browse history error:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.delete('/', async (req, res) => {
  try {
    await BrowseHistory.destroy({ where: { user_id: req.user.id } });
    res.json({ code: 0, message: '已清空浏览历史' });
  } catch (err) {
    logger.error('Clear browse history error:', err);
    res.status(500).json({ code: 500, message: '清空失败' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ code: 0, message: '无数据同步' });
    }

    for (const item of items.slice(-MAX_HISTORY)) {
      const { product_id, viewed_at } = item;
      if (!product_id) continue;

      const existing = await BrowseHistory.findOne({
        where: { user_id: req.user.id, product_id }
      });

      if (existing) {
        const itemDate = new Date(viewed_at);
        if (itemDate > new Date(existing.viewed_at)) {
          existing.viewed_at = itemDate;
          await existing.save();
        }
      } else {
        await BrowseHistory.create({
          user_id: req.user.id,
          product_id,
          viewed_at: viewed_at || new Date()
        });
      }
    }

    const count = await BrowseHistory.count({ where: { user_id: req.user.id } });
    if (count > MAX_HISTORY) {
      const excess = count - MAX_HISTORY;
      const oldest = await BrowseHistory.findAll({
        where: { user_id: req.user.id },
        order: [['viewed_at', 'ASC']],
        limit: excess
      });
      const ids = oldest.map((o) => o.id);
      await BrowseHistory.destroy({ where: { id: { [Op.in]: ids } } });
    }

    res.json({ code: 0, message: '同步成功' });
  } catch (err) {
    logger.error('Sync browse history error:', err);
    res.status(500).json({ code: 500, message: '同步失败' });
  }
});

module.exports = router;
