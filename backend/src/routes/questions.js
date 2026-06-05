const express = require('express');
const { Question, User, Product } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }

    const { count, rows } = await Question.findAndCountAll({
      where: { product_id: productId },
      include: [
        { model: User, attributes: ['id', 'username', 'nickname', 'avatar'] }
      ],
      order: [
        ['status', 'ASC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit, 10),
      offset
    });

    const list = rows.map((q) => {
      const question = q.toJSON();
      return {
        id: question.id,
        content: question.content,
        answer: question.answer,
        status: question.status,
        answered_at: question.answered_at,
        created_at: question.created_at,
        user: {
          id: question.User.id,
          nickname: question.User.nickname || question.User.username,
          avatar: question.User.avatar
        }
      };
    });

    res.json({
      code: 0,
      data: {
        list,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    logger.error('Get questions error:', err);
    res.status(500).json({ code: 500, message: '获取问答列表失败' });
  }
});

router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '问题内容不能为空' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ code: 400, message: '问题内容不能超过500字' });
    }

    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }

    const question = await Question.create({
      product_id: productId,
      user_id: req.user.id,
      content: content.trim()
    });

    const result = await Question.findByPk(question.id, {
      include: [{ model: User, attributes: ['id', 'username', 'nickname', 'avatar'] }]
    });

    const questionData = result.toJSON();
    const response = {
      id: questionData.id,
      content: questionData.content,
      answer: questionData.answer,
      status: questionData.status,
      answered_at: questionData.answered_at,
      created_at: questionData.created_at,
      user: {
        id: questionData.User.id,
        nickname: questionData.User.nickname || questionData.User.username,
        avatar: questionData.User.avatar
      }
    };

    res.json({ code: 0, data: response });
  } catch (err) {
    logger.error('Create question error:', err);
    res.status(500).json({ code: 500, message: '提交问题失败' });
  }
});

router.put('/:id/answer', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ code: 400, message: '回复内容不能为空' });
    }

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ code: 404, message: '问题不存在' });
    }

    question.answer = answer.trim();
    question.status = 'answered';
    question.answered_at = new Date();
    await question.save();

    res.json({ code: 0, data: { message: '回复成功' } });
  } catch (err) {
    logger.error('Answer question error:', err);
    res.status(500).json({ code: 500, message: '回复失败' });
  }
});

module.exports = router;
