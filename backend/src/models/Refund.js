const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Refund = sequelize.define(
  'Refund',
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
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    order_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    refund_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('return', 'exchange'),
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    product_image: {
      type: DataTypes.STRING(500)
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    reject_reason: {
      type: DataTypes.STRING(500)
    },
    processed_at: {
      type: DataTypes.DATE
    }
  },
  { tableName: 'refunds' }
);

module.exports = Refund;
