const express = require('express');
const { body } = require('express-validator');
const {
  Refund,
  Order,
  OrderItem,
  Product
} = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notificationService');

const router = express.Router();
router.use(auth);

const generateRefundNo = () => {
  return 'R' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8);
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await Refund.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (err) {
    logger.error('Get refunds error:', err);
    res.status(500).json({ code: 500, message: '获取售后列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const refund = await Refund.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Order, attributes: ['id', 'order_no', 'total_amount', 'status'] },
        { model: OrderItem, attributes: ['id', 'price', 'quantity', 'subtotal'] },
        { model: Product, attributes: ['id', 'name', 'image'] }
      ]
    });
    if (!refund) {
      return res.status(404).json({ code: 404, message: '售后单不存在' });
    }
    res.json({ code: 0, data: refund });
  } catch (err) {
    logger.error('Get refund detail error:', err);
    res.status(500).json({ code: 500, message: '获取售后详情失败' });
  }
});

router.get('/order/:orderId/applicable-items', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, user_id: req.user.id, status: 'completed' },
      include: [{ model: OrderItem, as: 'OrderItems' }]
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在或未完成' });
    }

    const items = await Promise.all(
      order.OrderItems.map(async (item) => {
        const existingRefund = await Refund.findOne({
          where: {
            order_item_id: item.id,
            status: ['pending', 'approved', 'completed']
          }
        });
        return {
          ...item.toJSON(),
          has_refund: !!existingRefund
        };
      })
    );

    res.json({
      code: 0,
      data: {
        order: { id: order.id, order_no: order.order_no, total_amount: order.total_amount },
        items
      }
    });
  } catch (err) {
    logger.error('Get applicable items error:', err);
    res.status(500).json({ code: 500, message: '获取可申请商品失败' });
  }
});

router.post(
  '/apply',
  [
    body('order_id').isInt().withMessage('订单ID无效'),
    body('order_item_id').isInt().withMessage('商品项ID无效'),
    body('type').isIn(['return', 'exchange']).withMessage('请选择售后类型'),
    body('reason').isLength({ min: 2, max: 500 }).withMessage('请填写售后原因（2-500字）'),
    body('description').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { order_id, order_item_id, type, reason, description } = req.body;

      const order = await Order.findOne({
        where: { id: order_id, user_id: req.user.id, status: 'completed' },
        include: [{ model: OrderItem, as: 'OrderItems' }]
      });
      if (!order) {
        return res.status(400).json({ code: 400, message: '订单不存在或未完成' });
      }

      const orderItem = order.OrderItems.find((oi) => oi.id === order_item_id);
      if (!orderItem) {
        return res.status(400).json({ code: 400, message: '商品不在该订单中' });
      }

      const existingRefund = await Refund.findOne({
        where: {
          order_item_id,
          status: ['pending', 'approved', 'completed']
        }
      });
      if (existingRefund) {
        return res.status(400).json({ code: 400, message: '该商品已申请售后' });
      }

      const amount = parseFloat(orderItem.price) * parseInt(orderItem.quantity);

      const refund = await Refund.create({
        user_id: req.user.id,
        order_id,
        order_item_id,
        product_id: orderItem.product_id,
        refund_no: generateRefundNo(),
        type,
        product_name: orderItem.product_name,
        product_image: orderItem.product_image,
        price: orderItem.price,
        quantity: orderItem.quantity,
        amount,
        reason,
        description: description || null
      });

      await createNotification(
        req.user.id,
        'refund_applied',
        refund.id,
        'refund',
        { refundNo: refund.refund_no, productName: refund.product_name }
      );

      res.json({ code: 0, data: refund, message: '售后申请提交成功' });
    } catch (err) {
      logger.error('Apply refund error:', err);
      res.status(500).json({ code: 500, message: '提交售后申请失败' });
    }
  }
);

router.post('/:id/cancel', async (req, res) => {
  try {
    const refund = await Refund.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!refund) {
      return res.status(404).json({ code: 404, message: '售后单不存在' });
    }
    if (refund.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '仅待处理的售后申请可取消' });
    }

    await refund.update({ status: 'cancelled' });

    await createNotification(
      req.user.id,
      'refund_cancelled',
      refund.id,
      'refund',
      { refundNo: refund.refund_no }
    );

    res.json({ code: 0, message: '售后申请已取消' });
  } catch (err) {
    logger.error('Cancel refund error:', err);
    res.status(500).json({ code: 500, message: '取消售后申请失败' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const refund = await Refund.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!refund) {
      return res.status(404).json({ code: 404, message: '售后单不存在' });
    }
    if (refund.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '仅待处理的售后申请可审核' });
    }

    await refund.update({ status: 'approved', processed_at: new Date() });

    await createNotification(
      req.user.id,
      'refund_approved',
      refund.id,
      'refund',
      { refundNo: refund.refund_no }
    );

    res.json({ code: 0, data: refund, message: '售后审核通过' });
  } catch (err) {
    logger.error('Approve refund error:', err);
    res.status(500).json({ code: 500, message: '审核失败' });
  }
});

router.post(
  '/:id/reject',
  [body('reject_reason').isLength({ min: 2, max: 500 }).withMessage('请填写拒绝原因（2-500字）')],
  validate,
  async (req, res) => {
    try {
      const { reject_reason } = req.body;
      const refund = await Refund.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!refund) {
        return res.status(404).json({ code: 404, message: '售后单不存在' });
      }
      if (refund.status !== 'pending') {
        return res.status(400).json({ code: 400, message: '仅待处理的售后申请可审核' });
      }

      await refund.update({ status: 'rejected', reject_reason, processed_at: new Date() });

      await createNotification(
        req.user.id,
        'refund_rejected',
        refund.id,
        'refund',
        { refundNo: refund.refund_no, rejectReason: reject_reason }
      );

      res.json({ code: 0, data: refund, message: '售后已拒绝' });
    } catch (err) {
      logger.error('Reject refund error:', err);
      res.status(500).json({ code: 500, message: '拒绝失败' });
    }
  }
);

router.post('/:id/complete', async (req, res) => {
  try {
    const refund = await Refund.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!refund) {
      return res.status(404).json({ code: 404, message: '售后单不存在' });
    }
    if (refund.status !== 'approved') {
      return res.status(400).json({ code: 400, message: '仅已通过的售后申请可完成' });
    }

    await refund.update({ status: 'completed', processed_at: new Date() });

    await createNotification(
      req.user.id,
      'refund_completed',
      refund.id,
      'refund',
      { refundNo: refund.refund_no }
    );

    res.json({ code: 0, message: '售后已完成' });
  } catch (err) {
    logger.error('Complete refund error:', err);
    res.status(500).json({ code: 500, message: '完成售后失败' });
  }
});

module.exports = router;
