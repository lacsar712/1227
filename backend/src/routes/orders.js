const express = require('express');
const { body } = require('express-validator');
const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Address,
  Product
} = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

const generateOrderNo = () => {
  return 'O' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8);
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Address, attributes: ['receiver', 'phone', 'province', 'city', 'district', 'detail'] },
        { model: OrderItem, as: 'OrderItems' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (err) {
    logger.error('Get orders error:', err);
    res.status(500).json({ code: 500, message: '获取订单失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Address },
        { model: OrderItem, as: 'OrderItems' }
      ]
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({ code: 0, data: order });
  } catch (err) {
    logger.error('Get order detail error:', err);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
});

router.post(
  '/create',
  [
    body('address_id').isInt().withMessage('请选择收货地址'),
    body('payment_method').isIn(['alipay', 'wechat', 'bank']).withMessage('请选择支付方式'),
    body('remark').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { address_id, payment_method, remark } = req.body;
      const address = await Address.findOne({
        where: { id: address_id, user_id: req.user.id }
      });
      if (!address) {
        return res.status(400).json({ code: 400, message: '收货地址无效' });
      }

      let cart = await Cart.findOne({ where: { user_id: req.user.id } });
      if (!cart) {
        return res.status(400).json({ code: 400, message: '购物车为空' });
      }
      const cartItems = await CartItem.findAll({
        where: { cart_id: cart.id },
        include: [Product]
      });
      if (!cartItems.length) {
        return res.status(400).json({ code: 400, message: '购物车为空' });
      }

      const items = [];
      let totalAmount = 0;
      for (const ci of cartItems) {
        if (!ci.Product) continue;
        const product = ci.Product;
        const qty = Math.min(ci.quantity, product.stock);
        if (qty <= 0) {
          return res.status(400).json({ code: 400, message: `商品 ${product.name} 库存不足` });
        }
        const price = parseFloat(product.price);
        const subtotal = price * qty;
        totalAmount += subtotal;
        items.push({
          product_id: product.id,
          product_name: product.name,
          product_image: product.image,
          price,
          quantity: qty,
          subtotal
        });
      }

      const order = await Order.create({
        user_id: req.user.id,
        order_no: generateOrderNo(),
        address_id,
        total_amount: totalAmount,
        payment_method,
        remark: remark || null
      });

      for (const it of items) {
        await OrderItem.create({
          order_id: order.id,
          ...it
        });
      }

      for (const ci of cartItems) {
        const product = ci.Product;
        if (product) {
          await product.update({
            stock: product.stock - (items.find((i) => i.product_id === product.id)?.quantity || 0),
            sales_count: product.sales_count + (items.find((i) => i.product_id === product.id)?.quantity || 0)
          });
        }
      }
      await CartItem.destroy({ where: { cart_id: cart.id } });

      const created = await Order.findByPk(order.id, {
        include: [Address, { model: OrderItem, as: 'OrderItems' }]
      });
      res.json({ code: 0, data: created, message: '订单创建成功' });
    } catch (err) {
      logger.error('Create order error:', err);
      res.status(500).json({ code: 500, message: '创建订单失败' });
    }
  }
);

router.post('/:id/pay', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ code: 400, message: '订单已支付' });
    }
    await order.update({ payment_status: 'paid', status: 'paid' });
    res.json({ code: 0, data: order, message: '支付成功' });
  } catch (err) {
    logger.error('Pay order error:', err);
    res.status(500).json({ code: 500, message: '支付失败' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'pending' && order.status !== 'paid') {
      return res.status(400).json({ code: 400, message: '订单无法取消' });
    }
    await order.update({ status: 'cancelled' });
    if (order.payment_status === 'paid') {
      const orderItems = await OrderItem.findAll({ where: { order_id: order.id } });
      for (const oi of orderItems) {
        const p = await Product.findByPk(oi.product_id);
        if (p) {
          await p.update({
            stock: p.stock + oi.quantity,
            sales_count: Math.max(0, p.sales_count - oi.quantity)
          });
        }
      }
    }
    res.json({ code: 0, message: '订单已取消' });
  } catch (err) {
    logger.error('Cancel order error:', err);
    res.status(500).json({ code: 500, message: '取消失败' });
  }
});

module.exports = router;
