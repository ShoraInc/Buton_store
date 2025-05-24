const { Favorite, Product } = require('../models');

const favoriteController = {
  // Получить избранные товары
  getFavorites: async (req, res) => {
    try {
      const favorites = await Favorite.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'price', 'discountPrice', 'images', 'category', 'rating']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ favorites });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Проверить, находится ли товар в избранном
  checkFavorite: async (req, res) => {
    try {
      const { productId } = req.params;
      
      const favorite = await Favorite.findOne({
        where: {
          userId: req.user.id,
          productId: productId
        }
      });

      res.json({ 
        isFavorite: !!favorite 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Добавить в избранное
  addToFavorites: async (req, res) => {
    try {
      const { productId } = req.body;

      // Проверяем товар
      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      // Проверяем, уже ли в избранном
      const existingFavorite = await Favorite.findOne({
        where: {
          userId: req.user.id,
          productId
        }
      });

      if (existingFavorite) {
        return res.status(400).json({ message: 'Товар уже в избранном' });
      }

      const favorite = await Favorite.create({
        userId: req.user.id,
        productId
      });

      res.status(201).json({
        message: 'Товар добавлен в избранное',
        favorite
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Удалить из избранного
  removeFromFavorites: async (req, res) => {
    try {
      const { productId } = req.params;

      const deleted = await Favorite.destroy({
        where: {
          userId: req.user.id,
          productId
        }
      });

      if (!deleted) {
        return res.status(404).json({ message: 'Товар не найден в избранном' });
      }

      res.json({ message: 'Товар удален из избранного' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Переключить статус избранного
  toggleFavorite: async (req, res) => {
    try {
      const { productId } = req.body;

      // Проверяем товар
      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      const existingFavorite = await Favorite.findOne({
        where: {
          userId: req.user.id,
          productId
        }
      });

      if (existingFavorite) {
        // Удаляем из избранного
        await existingFavorite.destroy();
        res.json({
          message: 'Товар удален из избранного',
          isFavorite: false
        });
      } else {
        // Добавляем в избранное
        await Favorite.create({
          userId: req.user.id,
          productId
        });
        res.json({
          message: 'Товар добавлен в избранное',
          isFavorite: true
        });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = favoriteController;