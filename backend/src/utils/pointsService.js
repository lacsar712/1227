const { PointsAccount, PointsTransaction, PointsProduct, PointsRedeemRecord, sequelize } = require('../models');
const logger = require('./logger');

const CONFIG = {
  REGISTER_BONUS: 100,
  ORDER_EARN_RATE: 0.1,
  ORDER_MIN_POINTS: 1
};

async function getOrCreateAccount(userId) {
  let account = await PointsAccount.findOne({ where: { user_id: userId } });
  if (!account) {
    account = await PointsAccount.create({
      user_id: userId,
      balance: 0,
      total_earned: 0,
      total_spent: 0
    });
  }
  return account;
}

async function addPoints(userId, amount, sourceType, sourceId = null, description = '') {
  if (amount <= 0) throw new Error('积分数量必须大于0');

  const t = await sequelize.transaction();
  try {
    const account = await getOrCreateAccount(userId);

    const newBalance = account.balance + amount;
    await account.update(
      {
        balance: newBalance,
        total_earned: account.total_earned + amount
      },
      { transaction: t }
    );

    await PointsTransaction.create(
      {
        user_id: userId,
        type: 'earn',
        amount,
        balance_after: newBalance,
        source_type: sourceType,
        source_id: sourceId,
        description
      },
      { transaction: t }
    );

    await t.commit();
    return { success: true, balance: newBalance, added: amount };
  } catch (err) {
    await t.rollback();
    logger.error('Add points error:', err);
    throw err;
  }
}

async function deductPoints(userId, amount, sourceType, sourceId = null, description = '', externalTransaction = null) {
  if (amount <= 0) throw new Error('积分数量必须大于0');

  const t = externalTransaction || await sequelize.transaction();
  try {
    const account = await PointsAccount.findOne({
      where: { user_id: userId },
      transaction: t,
      lock: true
    });

    if (!account) {
      if (!externalTransaction) await t.rollback();
      return { success: false, error: '积分账户不存在', balance: 0 };
    }

    if (account.balance < amount) {
      if (!externalTransaction) await t.rollback();
      return { success: false, error: '积分不足', balance: account.balance };
    }

    const newBalance = account.balance - amount;
    await account.update(
      {
        balance: newBalance,
        total_spent: account.total_spent + amount
      },
      { transaction: t }
    );

    const transaction = await PointsTransaction.create(
      {
        user_id: userId,
        type: 'spend',
        amount,
        balance_after: newBalance,
        source_type: sourceType,
        source_id: sourceId,
        description
      },
      { transaction: t }
    );

    if (!externalTransaction) await t.commit();
    return { success: true, balance: newBalance, deducted: amount, transactionId: transaction.id };
  } catch (err) {
    if (!externalTransaction) await t.rollback();
    logger.error('Deduct points error:', err);
    throw err;
  }
}

async function getAccount(userId) {
  const account = await getOrCreateAccount(userId);
  return {
    balance: account.balance,
    total_earned: account.total_earned,
    total_spent: account.total_spent,
    created_at: account.created_at,
    updated_at: account.updated_at
  };
}

async function getTransactions(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { count, rows } = await PointsTransaction.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
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

function calculateOrderPoints(orderAmount) {
  const amount = parseFloat(orderAmount) || 0;
  const points = Math.floor(amount * CONFIG.ORDER_EARN_RATE);
  return Math.max(points, CONFIG.ORDER_MIN_POINTS);
}

async function processRegisterBonus(userId) {
  const existingTransaction = await PointsTransaction.findOne({
    where: {
      user_id: userId,
      source_type: 'register',
      type: 'earn'
    }
  });

  if (existingTransaction) {
    return { success: false, error: '注册奖励已发放', alreadyProcessed: true };
  }

  return await addPoints(
    userId,
    CONFIG.REGISTER_BONUS,
    'register',
    null,
    `新用户注册奖励 ${CONFIG.REGISTER_BONUS} 积分`
  );
}

async function processOrderComplete(userId, orderId, orderAmount) {
  const points = calculateOrderPoints(orderAmount);
  if (points <= 0) return { success: true, points: 0 };

  return await addPoints(
    userId,
    points,
    'order',
    orderId,
    `订单完成奖励 ${points} 积分（订单金额 ¥${orderAmount}）`
  );
}

async function redeemProduct(userId, pointsProductId) {
  const t = await sequelize.transaction();
  try {
    const product = await PointsProduct.findOne({
      where: { id: pointsProductId, status: 'active' },
      lock: true,
      transaction: t
    });

    if (!product) {
      await t.rollback();
      return { success: false, error: '兑换商品不存在或已下架' };
    }

    if (product.stock <= 0) {
      await t.rollback();
      return { success: false, error: '商品库存不足' };
    }

    const account = await getOrCreateAccount(userId);
    if (account.balance < product.points_required) {
      await t.rollback();
      return { success: false, error: '积分不足', balance: account.balance };
    }

    const deductResult = await deductPoints(
      userId,
      product.points_required,
      'redeem',
      null,
      `兑换「${product.name}」消耗 ${product.points_required} 积分`,
      t
    );

    if (!deductResult.success) {
      await t.rollback();
      return deductResult;
    }

    await product.update(
      {
        stock: product.stock - 1,
        sold_count: product.sold_count + 1
      },
      { transaction: t }
    );

    let couponCode = null;
    let expiryDate = null;
    if (product.type === 'coupon') {
      couponCode = product.coupon_code || `COUPON${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      if (product.expiry_days) {
        expiryDate = new Date(Date.now() + product.expiry_days * 24 * 60 * 60 * 1000);
      }
    }

    const redeemRecord = await PointsRedeemRecord.create(
      {
        user_id: userId,
        points_product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        points_spent: product.points_required,
        status: 'completed',
        coupon_code: couponCode,
        expiry_date: expiryDate,
        delivered: product.type === 'coupon' || product.type === 'virtual'
      },
      { transaction: t }
    );

    await PointsTransaction.update(
      { source_id: redeemRecord.id },
      { where: { id: deductResult.transactionId }, transaction: t }
    );

    await t.commit();

    return {
      success: true,
      balance: deductResult.balance,
      record: redeemRecord,
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        coupon_code: couponCode,
        expiry_date: expiryDate
      }
    };
  } catch (err) {
    await t.rollback();
    logger.error('Redeem product error:', err);
    throw err;
  }
}

async function getRedeemRecords(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { count, rows } = await PointsRedeemRecord.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: PointsProduct,
        attributes: ['id', 'name', 'image', 'type', 'points_required']
      }
    ],
    order: [['created_at', 'DESC']],
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
  CONFIG,
  getOrCreateAccount,
  addPoints,
  deductPoints,
  getAccount,
  getTransactions,
  calculateOrderPoints,
  processRegisterBonus,
  processOrderComplete,
  redeemProduct,
  getRedeemRecords
};
