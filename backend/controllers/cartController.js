const { Cart, CartItem, Product, User } = require('../models');

const cartController = {
  // Получить корзину пользователя
  getCart: async (req, res) => {
    try {
      let cart = await Cart.findOne({
        where: { 
          userId: req.user.id,
          status: 'active'
        },
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                attributes: ['id', 'name', 'price', 'discountPrice', 'images', 'inStock']
              }
            ]
          }
        ]
      });

      if (!cart) {
        cart = await Cart.create({ userId: req.user.id });
        cart.items = [];
      }

      // Подсчитываем общую сумму
      const totalAmount = cart.items.reduce((sum, item) => {
        const price = item.Product.discountPrice || item.Product.price;
        return sum + (parseFloat(price) * item.quantity);
      }, 0);

      res.json({
        cart: {
          ...cart.toJSON(),
          totalAmount,
          itemsCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Добавить товар в корзину
  addToCart: async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;

      // Проверяем товар
      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      if (product.inStock < quantity) {
        return res.status(400).json({ message: 'Недостаточно товара на складе' });
      }

      // Находим или создаем корзину
      let cart = await Cart.findOne({
        where: { 
          userId: req.user.id,
          status: 'active'
        }
      });

      if (!cart) {
        cart = await Cart.create({ userId: req.user.id });
      }

      // Проверяем, есть ли товар уже в корзине
      let cartItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId
        }
      });

      const currentPrice = product.discountPrice || product.price;

      if (cartItem) {
        // Обновляем количество
        cartItem.quantity += quantity;
        cartItem.priceAtTime = currentPrice;
        await cartItem.save();
      } else {
        // Создаем новый элемент корзины
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          quantity,
          priceAtTime: currentPrice
        });
      }

      res.json({
        message: 'Товар добавлен в корзину',
        cartItem
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Обновить количество товара в корзине
  updateCartItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return res.status(400).json({ message: 'Количество должно быть больше 0' });
      }

      const cartItem = await CartItem.findOne({
        where: { id: itemId },
        include: [
          {
            model: Cart,
            where: { userId: req.user.id }
          },
          {
            model: Product
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({ message: 'Элемент корзины не найден' });
      }

      if (cartItem.Product.inStock < quantity) {
        return res.status(400).json({ message: 'Недостаточно товара на складе' });
      }

      cartItem.quantity = quantity;
      await cartItem.save();

      res.json({
        message: 'Количество обновлено',
        cartItem
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Удалить товар из корзины
  removeFromCart: async (req, res) => {
    try {
      const { itemId } = req.params;

      const cartItem = await CartItem.findOne({
        where: { id: itemId },
        include: [
          {
            model: Cart,
            where: { userId: req.user.id }
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({ message: 'Элемент корзины не найден' });
      }

      await cartItem.destroy();

      res.json({ message: 'Товар удален из корзины' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Очистить корзину
  clearCart: async (req, res) => {
    try {
      const cart = await Cart.findOne({
        where: { 
          userId: req.user.id,
          status: 'active'
        }
      });

      if (!cart) {
        return res.status(404).json({ message: 'Корзина не найдена' });
      }

      await CartItem.destroy({
        where: { cartId: cart.id }
      });

      res.json({ message: 'Корзина очищена' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = cartController;