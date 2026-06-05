const express = require('express');
const { body } = require('express-validator');
const { PointsProduct } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const pointsService = require('../utils/pointsService');

const router = express.Router();
router.use(auth);

router.get('/account', async (req, res) => {
  try {
    const account = await pointsService.getAccount(req.user.id);
    res.json({ code: 0, data: account });
  } catch (err) {
    logger.error('Get points account error:', err);
    res.status(500).json({ code: 500, message: '获取积分账户失败' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await pointsService.getTransactions(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get points transactions error:', err);
    res.status(500).json({ code: 500, message: '获取积分流水失败' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { type } = req.query;
    const where = { status: 'active' };
    if (type) where.type = type;

    const products = await PointsProduct.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'DESC']]
    });

    res.json({ code: 0, data: products });
  } catch (err) {
    logger.error('Get points products error:', err);
    res.status(500).json({ code: 500, message: '获取兑换商品失败' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await PointsProduct.findOne({
      where: { id: req.params.id, status: 'active' }
    });

    if (!product) {
      return res.status(404).json({ code: 404, message: '兑换商品不存在' });
    }

    res.json({ code: 0, data: product });
  } catch (err) {
    logger.error('Get points product detail error:', err);
    res.status(500).json({ code: 500, message: '获取商品详情失败' });
  }
});

router.post(
  '/redeem',
  [body('product_id').isInt().withMessage('请选择兑换商品')],
  validate,
  async (req, res) => {
    try {
      const { product_id } = req.body;
      const result = await pointsService.redeemProduct(req.user.id, product_id);

      if (!result.success) {
        return res.status(400).json({
          code: 400,
          message: result.error,
          data: { balance: result.balance }
        });
      }

      res.json({
        code: 0,
        data: result,
        message: '兑换成功'
      });
    } catch (err) {
      logger.error('Redeem product error:', err);
      res.status(500).json({ code: 500, message: '兑换失败' });
    }
  }
);

router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await pointsService.getRedeemRecords(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get redeem records error:', err);
    res.status(500).json({ code: 500, message: '获取兑换记录失败' });
  }
});

module.exports = router;
