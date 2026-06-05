const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define(
  'Notification',
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
    type: {
      type: DataTypes.ENUM('order_paid', 'order_shipped', 'order_cancelled', 'order_completed', 'after_sale', 'system', 'refund_applied', 'refund_approved', 'refund_rejected', 'refund_completed', 'refund_cancelled'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    related_type: {
      type: DataTypes.ENUM('order', 'product', 'system', 'refund'),
      allowNull: true
    },
    related_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    extra: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  { tableName: 'notifications' }
);

module.exports = Notification;
