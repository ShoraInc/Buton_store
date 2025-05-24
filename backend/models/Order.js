const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'confirmed', 'delivering', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipientName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipientPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isGift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  giftMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    // ✅ Исправленный хук beforeCreate
    beforeCreate: async (order, options) => {
      try {
        console.log('🏷️ Генерация номера заказа...');
        
        // Генерируем уникальный номер заказа
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        
        // Попытка создать уникальный номер с несколькими попытками
        let attempts = 0;
        let orderNumber;
        let isUnique = false;
        
        while (!isUnique && attempts < 10) {
          const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          orderNumber = `ORD-${dateStr}-${randomNum}`;
          
          // Проверяем уникальность
          const existingOrder = await Order.findOne({
            where: { orderNumber },
            transaction: options.transaction
          });
          
          if (!existingOrder) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (!isUnique) {
          // Если не удалось создать уникальный номер, используем timestamp
          orderNumber = `ORD-${dateStr}-${Date.now().toString().slice(-6)}`;
        }
        
        order.orderNumber = orderNumber;
        console.log('✅ Номер заказа сгенерирован:', orderNumber);
        
      } catch (error) {
        console.error('❌ Ошибка генерации номера заказа:', error);
        // Fallback номер
        order.orderNumber = `ORD-${Date.now()}`;
      }
    }
  }
});

module.exports = Order;