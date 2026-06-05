const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define(
  'Address',
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
    receiver: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  { tableName: 'addresses' }
);

module.exports = Address;
