const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define(
  'Brand',
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
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    logo: {
      type: DataTypes.STRING(500)
    },
    description: {
      type: DataTypes.TEXT
    },
    story: {
      type: DataTypes.TEXT
    },
    website: {
      type: DataTypes.STRING(500)
    },
    country: {
      type: DataTypes.STRING(50)
    },
    established_year: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  { tableName: 'brands' }
);

module.exports = Brand;
