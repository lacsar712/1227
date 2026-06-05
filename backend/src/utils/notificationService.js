const { Notification } = require('../models');

const notificationTemplates = {
  order_paid: {
    title: '支付成功',
    content: (orderNo, amount) => `您的订单 ${orderNo} 已支付成功，金额 ¥${amount}，我们将尽快为您发货。`
  },
  order_shipped: {
    title: '发货提醒',
    content: (orderNo) => `您的订单 ${orderNo} 已发货，请注意查收。`
  },
  order_cancelled: {
    title: '订单取消',
    content: (orderNo) => `您的订单 ${orderNo} 已取消。`
  },
  order_completed: {
    title: '订单完成',
    content: (orderNo) => `您的订单 ${orderNo} 已完成，感谢您的购买！`
  },
  after_sale: {
    title: '售后进度更新',
    content: (orderNo, status) => `您的订单 ${orderNo} 售后状态已更新为：${status}。`
  },
  system: {
    title: '系统通知',
    content: (message) => message
  }
};

async function createNotification(userId, type, relatedId, relatedType, extra = {}) {
  try {
    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    let content;
    switch (type) {
      case 'order_paid':
        content = template.content(extra.orderNo, extra.amount);
        break;
      case 'order_shipped':
        content = template.content(extra.orderNo);
        break;
      case 'order_cancelled':
        content = template.content(extra.orderNo);
        break;
      case 'order_completed':
        content = template.content(extra.orderNo);
        break;
      case 'after_sale':
        content = template.content(extra.orderNo, extra.status);
        break;
      case 'system':
        content = template.content(extra.message);
        break;
      default:
        content = template.content();
    }

    const notification = await Notification.create({
      user_id: userId,
      type,
      title: template.title,
      content,
      related_type: relatedType,
      related_id: relatedId,
      is_read: false,
      extra
    });

    return notification;
  } catch (err) {
    console.error('Create notification error:', err);
    throw err;
  }
}

module.exports = {
  createNotification
};
