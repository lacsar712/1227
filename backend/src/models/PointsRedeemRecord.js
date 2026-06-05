const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointsRedeemRecord = sequelize.define(
  'PointsRedeemRecord',
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
    points_product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    product_type: {
      type: DataTypes.ENUM('coupon', 'virtual', 'physical'),
      allowNull: false
    },
    points_spent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'completed'
    },
    coupon_code: {
      type: DataTypes.STRING(50)
    },
    expiry_date: {
      type: DataTypes.DATE
    },
    delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  { tableName: 'points_redeem_records' }
);

module.exports = PointsRedeemRecord;
