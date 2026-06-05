const express = require('express');
const { Notification } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, is_read } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };
    if (type) where.type = type;
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        unread_count: unreadCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    logger.error('Get notifications error:', err);
    res.status(500).json({ code: 500, message: '获取通知失败' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });

    res.json({ code: 0, data: { unread_count: count } });
  } catch (err) {
    logger.error('Get unread count error:', err);
    res.status(500).json({ code: 500, message: '获取未读数量失败' });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notification) {
      return res.status(404).json({ code: 404, message: '通知不存在' });
    }
    await notification.update({ is_read: true });
    res.json({ code: 0, data: notification, message: '标记已读成功' });
  } catch (err) {
    logger.error('Mark notification read error:', err);
    res.status(500).json({ code: 500, message: '标记已读失败' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ code: 0, message: '全部标记已读成功' });
  } catch (err) {
    logger.error('Mark all notifications read error:', err);
    res.status(500).json({ code: 500, message: '全部标记已读失败' });
  }
});

module.exports = router;
