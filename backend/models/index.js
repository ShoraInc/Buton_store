const sequelize = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Favorite = require('./Favorite');
const OrderItem = require('./OrderItem');
const Order = require('./Order');

// Связи между моделями
// User - Cart (один пользователь может иметь одну активную корзину)
User.hasOne(Cart, { foreignKey: 'userId', as: 'activeCart' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Cart - CartItems (в корзине много товаров)
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// Product - CartItems (товар может быть в разных корзинах)
Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// User - Favorites (пользователь может лайкать много товаров)
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

// Product - Favorites (товар может быть в избранном у многих)
Product.hasMany(Favorite, { foreignKey: 'productId', as: 'likes' });
Favorite.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders'
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ✅ Связи Order - OrderItem (один заказ - много позиций)
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

// ✅ Связи Product - OrderItem (один товар может быть в разных заказах)
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});


module.exports = {
  sequelize,
  User,
  Product,
  Cart,
  CartItem,
  Favorite,
  Order,
  OrderItem
};
