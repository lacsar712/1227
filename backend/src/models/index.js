const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Brand = require('./Brand');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Address = require('./Address');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Notification = require('./Notification');
const FlashSale = require('./FlashSale');
const Question = require('./Question');
const PointsAccount = require('./PointsAccount');
const PointsTransaction = require('./PointsTransaction');
const PointsProduct = require('./PointsProduct');
const PointsRedeemRecord = require('./PointsRedeemRecord');

User.hasMany(Address, { foreignKey: 'user_id' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Cart, { foreignKey: 'user_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Brand.hasMany(Product, { foreignKey: 'brand_id' });
Product.belongsTo(Brand, { foreignKey: 'brand_id' });

Product.hasMany(FlashSale, { foreignKey: 'product_id' });
FlashSale.belongsTo(Product, { foreignKey: 'product_id' });

Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });
CartItem.belongsTo(FlashSale, { foreignKey: 'flash_sale_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'OrderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
OrderItem.belongsTo(FlashSale, { foreignKey: 'flash_sale_id' });
Order.belongsTo(Address, { foreignKey: 'address_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Question, { foreignKey: 'user_id' });
Question.belongsTo(User, { foreignKey: 'user_id', attributes: ['id', 'username', 'nickname', 'avatar'] });

Product.hasMany(Question, { foreignKey: 'product_id' });
Question.belongsTo(Product, { foreignKey: 'product_id' });

User.hasOne(PointsAccount, { foreignKey: 'user_id' });
PointsAccount.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PointsTransaction, { foreignKey: 'user_id' });
PointsTransaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PointsRedeemRecord, { foreignKey: 'user_id' });
PointsRedeemRecord.belongsTo(User, { foreignKey: 'user_id' });

PointsProduct.hasMany(PointsRedeemRecord, { foreignKey: 'points_product_id' });
PointsRedeemRecord.belongsTo(PointsProduct, { foreignKey: 'points_product_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Brand,
  Product,
  Cart,
  CartItem,
  Address,
  Order,
  OrderItem,
  Notification,
  FlashSale,
  Question,
  PointsAccount,
  PointsTransaction,
  PointsProduct,
  PointsRedeemRecord
};
