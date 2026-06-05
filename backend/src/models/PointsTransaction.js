const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointsTransaction = sequelize.define(
  'PointsTransaction',
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
      type: DataTypes.ENUM('earn', 'spend', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    source_type: {
      type: DataTypes.ENUM('register', 'order', 'redeem', 'refund', 'admin'),
      allowNull: false
    },
    source_id: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING(500)
    }
  },
  { tableName: 'points_transactions' }
);

module.exports = PointsTransaction;
