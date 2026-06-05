const express = require('express');
const { body } = require('express-validator');
const { Address } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const list = await Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC']]
    });
    res.json({ code: 0, data: list });
  } catch (err) {
    logger.error('Get addresses error:', err);
    res.status(500).json({ code: 500, message: '获取地址失败' });
  }
});

router.post(
  '/',
  [
    body('receiver').trim().notEmpty().withMessage('收货人不能为空'),
    body('phone').trim().notEmpty().withMessage('手机号不能为空'),
    body('province').trim().notEmpty().withMessage('省份不能为空'),
    body('city').trim().notEmpty().withMessage('城市不能为空'),
    body('district').trim().notEmpty().withMessage('区县不能为空'),
    body('detail').trim().notEmpty().withMessage('详细地址不能为空'),
    body('is_default').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const { receiver, phone, province, city, district, detail, is_default } = req.body;
      if (is_default) {
        await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
      }
      const addr = await Address.create({
        user_id: req.user.id,
        receiver,
        phone,
        province,
        city,
        district,
        detail,
        is_default: !!is_default
      });
      res.json({ code: 0, data: addr });
    } catch (err) {
      logger.error('Create address error:', err);
      res.status(500).json({ code: 500, message: '添加地址失败' });
    }
  }
);

router.put(
  '/:id',
  [
    body('receiver').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('province').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('district').optional().trim().notEmpty(),
    body('detail').optional().trim().notEmpty(),
    body('is_default').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const addr = await Address.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!addr) {
        return res.status(404).json({ code: 404, message: '地址不存在' });
      }
      const upd = req.body;
      if (upd.is_default) {
        await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
      }
      await addr.update(upd);
      res.json({ code: 0, data: addr });
    } catch (err) {
      logger.error('Update address error:', err);
      res.status(500).json({ code: 500, message: '更新地址失败' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Address.destroy({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!deleted) {
      return res.status(404).json({ code: 404, message: '地址不存在' });
    }
    res.json({ code: 0, message: '已删除' });
  } catch (err) {
    logger.error('Delete address error:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.put('/:id/default', async (req, res) => {
  try {
    const addr = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!addr) {
      return res.status(404).json({ code: 404, message: '地址不存在' });
    }
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    await addr.update({ is_default: true });
    res.json({ code: 0, data: addr });
  } catch (err) {
    logger.error('Set default address error:', err);
    res.status(500).json({ code: 500, message: '设置失败' });
  }
});

module.exports = router;
