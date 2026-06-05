const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    image: {
      type: DataTypes.STRING(500)
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  { tableName: 'categories' }
);

module.exports = Category;
