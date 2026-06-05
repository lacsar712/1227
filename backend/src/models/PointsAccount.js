const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointsAccount = sequelize.define(
  'PointsAccount',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  { tableName: 'points_accounts' }
);

module.exports = PointsAccount;
