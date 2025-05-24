const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authMiddleware } = require('../middleware/auth');

// Все роуты требуют авторизации
router.use(authMiddleware);

router.get('/', favoriteController.getFavorites);
router.get('/check/:productId', favoriteController.checkFavorite); // Новый роут для проверки
router.post('/', favoriteController.addToFavorites);
router.delete('/:productId', favoriteController.removeFromFavorites);
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;