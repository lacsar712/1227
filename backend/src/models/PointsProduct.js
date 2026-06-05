const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointsProduct = sequelize.define(
  'PointsProduct',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500)
    },
    type: {
      type: DataTypes.ENUM('coupon', 'virtual', 'physical'),
      allowNull: false,
      defaultValue: 'coupon'
    },
    points_required: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    original_value: {
      type: DataTypes.DECIMAL(10, 2)
    },
    image: {
      type: DataTypes.STRING(500)
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    sold_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    coupon_code: {
      type: DataTypes.STRING(50)
    },
    discount_type: {
      type: DataTypes.ENUM('fixed', 'percentage')
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2)
    },
    expiry_days: {
      type: DataTypes.INTEGER
    }
  },
  { tableName: 'points_products' }
);

module.exports = PointsProduct;
