const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Регистрация
router.post('/register', authController.register);

// Вход
router.post('/login', authController.login);

// Получить профиль (требует авторизации)
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;