const express = require('express');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const checkInService = require('../utils/checkInService');

const router = express.Router();
router.use(auth);

router.get('/status', async (req, res) => {
  try {
    const { year, month } = req.query;
    const data = await checkInService.getCheckInStatus(
      req.user.id,
      year ? parseInt(year, 10) : undefined,
      month !== undefined ? parseInt(month, 10) : undefined
    );
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get check-in status error:', err);
    res.status(500).json({ code: 500, message: '获取签到状态失败' });
  }
});

router.post('/check-in', async (req, res) => {
  try {
    const result = await checkInService.performCheckIn(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.error,
        data: result.data
      });
    }

    res.json({
      code: 0,
      data: result.data,
      message: result.message
    });
  } catch (err) {
    logger.error('Check-in error:', err);
    res.status(500).json({ code: 500, message: '签到失败' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const data = await checkInService.getCheckInHistory(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get check-in history error:', err);
    res.status(500).json({ code: 500, message: '获取签到历史失败' });
  }
});

router.get('/rewards', (req, res) => {
  try {
    res.json({
      code: 0,
      data: {
        rewards: checkInService.CHECK_IN_REWARDS
      }
    });
  } catch (err) {
    logger.error('Get check-in rewards error:', err);
    res.status(500).json({ code: 500, message: '获取签到奖励失败' });
  }
});

module.exports = router;
