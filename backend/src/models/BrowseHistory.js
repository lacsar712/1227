const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BrowseHistory = sequelize.define(
  'BrowseHistory',
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'browse_history',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id']
      },
      {
        fields: ['user_id', 'viewed_at']
      }
    ]
  }
);

module.exports = BrowseHistory;
