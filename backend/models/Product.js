const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Комбо', 'Сборные букеты', 'Композиции', 'Розы', 'Комнатные растения', 'Сладости', 'Игрушки']]
    }
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  inStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isNew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isReady: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isBudget: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  hooks: {
    beforeSave: (product) => {
      // Автоматически устанавливаем скидку
      if (product.discountPrice && product.discountPrice < product.price) {
        product.hasDiscount = true;
      }
    }
  }
});

module.exports = Product;