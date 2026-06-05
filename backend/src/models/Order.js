const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    order_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    address_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('alipay', 'wechat', 'bank'),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    remark: {
      type: DataTypes.STRING(500)
    }
  },
  { tableName: 'orders' }
);

module.exports = Order;
