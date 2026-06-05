const { Op } = require('sequelize');
const { CheckInRecord, sequelize } = require('../models');
const pointsService = require('./pointsService');
const logger = require('./logger');

const CHECK_IN_REWARDS = [
  { day: 1, type: 'points', amount: 10, description: '第1天签到奖励' },
  { day: 2, type: 'points', amount: 15, description: '第2天签到奖励' },
  { day: 3, type: 'points', amount: 20, description: '第3天签到奖励' },
  { day: 4, type: 'points', amount: 25, description: '第4天签到奖励' },
  { day: 5, type: 'points', amount: 30, description: '第5天签到奖励' },
  { day: 6, type: 'points', amount: 40, description: '第6天签到奖励' },
  { day: 7, type: 'points', amount: 50, description: '连续7天签到大奖' }
];

function getReward(consecutiveDays) {
  const dayInCycle = ((consecutiveDays - 1) % 7) + 1;
  const reward = CHECK_IN_REWARDS.find(r => r.day === dayInCycle) || CHECK_IN_REWARDS[0];
  const isSpecialDay = consecutiveDays % 7 === 0;
  return {
    ...reward,
    consecutiveDays,
    dayInCycle,
    isSpecialDay
  };
}

function getTodayRewardPreview(consecutiveDays) {
  const nextDay = consecutiveDays + 1;
  return getReward(nextDay);
}

async function getCheckInStatus(userId, year, month) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const lastRecord = await CheckInRecord.findOne({
    where: { user_id: userId },
    order: [['check_in_date', 'DESC']]
  });

  let consecutiveDays = 0;
  let checkedInToday = false;

  if (lastRecord) {
    const lastDate = new Date(lastRecord.check_in_date);
    const todayDate = new Date(todayStr);
    const diffTime = todayDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      consecutiveDays = lastRecord.consecutive_days;
      checkedInToday = true;
    } else if (diffDays === 1) {
      consecutiveDays = lastRecord.consecutive_days;
    } else {
      consecutiveDays = 0;
    }
  }

  const queryYear = year || today.getFullYear();
  const queryMonth = month !== undefined ? month : today.getMonth();

  const startDate = new Date(queryYear, queryMonth, 1);
  const endDate = new Date(queryYear, queryMonth + 1, 0);

  const monthRecords = await CheckInRecord.findAll({
    where: {
      user_id: userId,
      check_in_date: {
        [Op.between]: [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ]
      }
    },
    order: [['check_in_date', 'ASC']]
  });

  const checkedDates = monthRecords.map(r => ({
    date: r.check_in_date,
    consecutive_days: r.consecutive_days,
    reward_type: r.reward_type,
    reward_amount: r.reward_amount
  }));

  const todayReward = checkedInToday ? null : getTodayRewardPreview(consecutiveDays);

  return {
    checked_in_today: checkedInToday,
    consecutive_days: consecutiveDays,
    today_reward: todayReward,
    month_records: checkedDates,
    year: queryYear,
    month: queryMonth
  };
}

async function performCheckIn(userId) {
  const t = await sequelize.transaction();

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const existingRecord = await CheckInRecord.findOne({
      where: {
        user_id: userId,
        check_in_date: todayStr
      },
      transaction: t
    });

    if (existingRecord) {
      await t.rollback();
      return {
        success: false,
        error: '今日已签到',
        data: {
          checked_in_today: true,
          consecutive_days: existingRecord.consecutive_days
        }
      };
    }

    const lastRecord = await CheckInRecord.findOne({
      where: { user_id: userId },
      order: [['check_in_date', 'DESC']],
      transaction: t
    });

    let consecutiveDays = 1;

    if (lastRecord) {
      const lastDate = new Date(lastRecord.check_in_date);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate - lastDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveDays = lastRecord.consecutive_days + 1;
      } else if (diffDays > 1) {
        consecutiveDays = 1;
      } else if (diffDays === 0) {
        await t.rollback();
        return {
          success: false,
          error: '今日已签到',
          data: {
            checked_in_today: true,
            consecutive_days: lastRecord.consecutive_days
          }
        };
      }
    }

    const reward = getReward(consecutiveDays);
    let rewardResult = null;

    if (reward.type === 'points') {
      rewardResult = await pointsService.addPoints(
        userId,
        reward.amount,
        'check_in',
        null,
        `${reward.description} +${reward.amount}积分`,
        t
      );
    }

    const checkInRecord = await CheckInRecord.create(
      {
        user_id: userId,
        check_in_date: todayStr,
        consecutive_days: consecutiveDays,
        reward_type: reward.type,
        reward_amount: reward.amount
      },
      { transaction: t }
    );

    await t.commit();

    return {
      success: true,
      data: {
        record: checkInRecord,
        reward: {
          type: reward.type,
          amount: reward.amount,
          description: reward.description,
          consecutive_days: consecutiveDays,
          is_special: reward.isSpecialDay
        },
        balance: rewardResult?.balance || 0,
        message: `签到成功！${reward.description}`
      }
    };
  } catch (err) {
    await t.rollback();
    logger.error('Check in error:', err);
    throw err;
  }
}

async function getCheckInHistory(userId, page = 1, limit = 30) {
  const offset = (page - 1) * limit;
  const { count, rows } = await CheckInRecord.findAndCountAll({
    where: { user_id: userId },
    order: [['check_in_date', 'DESC']],
    limit,
    offset
  });

  return {
    list: rows,
    total: count,
    page,
    limit
  };
}

module.exports = {
  CHECK_IN_REWARDS,
  getReward,
  getTodayRewardPreview,
  getCheckInStatus,
  performCheckIn,
  getCheckInHistory
};
