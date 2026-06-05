const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CheckInRecord = sequelize.define(
  'CheckInRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      index: true
    },
    check_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    consecutive_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    reward_type: {
      type: DataTypes.ENUM('points', 'coupon'),
      allowNull: false,
      defaultValue: 'points'
    },
    reward_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'check_in_records',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'check_in_date']
      }
    ]
  }
);

module.exports = CheckInRecord;
