const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productImage: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  hooks: {
    // ✅ Исправленные хуки - работают как beforeCreate, так и beforeUpdate
    beforeCreate: (orderItem, options) => {
      console.log('🧮 Расчет totalPrice для нового OrderItem...');
      if (orderItem.price && orderItem.quantity) {
        orderItem.totalPrice = parseFloat(orderItem.price) * orderItem.quantity;
        console.log(`💰 totalPrice: ${orderItem.price} × ${orderItem.quantity} = ${orderItem.totalPrice}`);
      }
    },
    
    beforeUpdate: (orderItem, options) => {
      console.log('🧮 Пересчет totalPrice для OrderItem...');
      if (orderItem.price && orderItem.quantity) {
        orderItem.totalPrice = parseFloat(orderItem.price) * orderItem.quantity;
        console.log(`💰 новый totalPrice: ${orderItem.price} × ${orderItem.quantity} = ${orderItem.totalPrice}`);
      }
    },
    
    beforeSave: (orderItem, options) => {
      console.log('🧮 beforeSave: проверка totalPrice...');
      // Если totalPrice не установлен, рассчитываем его
      if (!orderItem.totalPrice && orderItem.price && orderItem.quantity) {
        orderItem.totalPrice = parseFloat(orderItem.price) * orderItem.quantity;
        console.log(`💰 beforeSave totalPrice: ${orderItem.price} × ${orderItem.quantity} = ${orderItem.totalPrice}`);
      }
    }
  }
});

module.exports = OrderItem;