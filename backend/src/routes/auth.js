const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const { User } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2, max: 20 }).withMessage('用户名2-20字符'),
    body('email').isEmail().withMessage('邮箱格式无效'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('nickname').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password, nickname } = req.body;
      const existUser = await User.findOne({ where: { username } });
      if (existUser) {
        return res.status(400).json({ code: 400, message: '用户名已存在' });
      }
      const existEmail = await User.findOne({ where: { email } });
      if (existEmail) {
        return res.status(400).json({ code: 400, message: '邮箱已被注册' });
      }
      const user = await User.create({ username, email, password, nickname: nickname || username });
      const token = generateToken(user.id);
      res.json({
        code: 0,
        data: {
          token,
          user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname }
        }
      });
    } catch (err) {
      logger.error('Register error:', err);
      res.status(500).json({ code: 500, message: '注册失败' });
    }
  }
);

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  validate,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(400).json({ code: 400, message: '用户名或密码错误' });
      }
      const valid = await user.validatePassword(password);
      if (!valid) {
        return res.status(400).json({ code: 400, message: '用户名或密码错误' });
      }
      const token = generateToken(user.id);
      res.json({
        code: 0,
        data: {
          token,
          user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname }
        }
      });
    } catch (err) {
      logger.error('Login error:', err);
      res.status(500).json({ code: 500, message: '登录失败' });
    }
  }
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('邮箱格式无效')],
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.json({ code: 0, message: '如果该邮箱已注册，将收到重置链接' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      user.reset_token = token;
      user.reset_token_expires = new Date(Date.now() + 3600000);
      await user.save();
      res.json({ code: 0, message: '如果该邮箱已注册，将收到重置链接', data: { token } });
    } catch (err) {
      logger.error('Forgot password error:', err);
      res.status(500).json({ code: 500, message: '操作失败' });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('重置令牌无效'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位')
  ],
  validate,
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const user = await User.findOne({
        where: { reset_token: token }
      });
      if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
        return res.status(400).json({ code: 400, message: '重置链接已过期，请重新申请' });
      }
      user.password = password;
      user.reset_token = null;
      user.reset_token_expires = null;
      await user.save();
      res.json({ code: 0, message: '密码已重置' });
    } catch (err) {
      logger.error('Reset password error:', err);
      res.status(500).json({ code: 500, message: '重置失败' });
    }
  }
);

router.get('/me', auth, async (req, res) => {
  try {
    const u = req.user;
    res.json({
      code: 0,
      data: { id: u.id, username: u.username, email: u.email, nickname: u.nickname, phone: u.phone }
    });
  } catch (err) {
    logger.error('Get me error:', err);
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

module.exports = router;
