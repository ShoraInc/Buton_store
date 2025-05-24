const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Decoded token:', decoded);
    
    // Поддерживаем оба формата токенов: userId и id
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Неверная структура токена' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    console.log('✅ Пользователь найден:', { id: user.id, email: user.email, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.message);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

const adminMiddleware = (req, res, next) => {
  console.log('🔐 Проверка прав админа для пользователя:', req.user.role);
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  console.log('✅ Права админа подтверждены');
  next();
};

module.exports = { authMiddleware, adminMiddleware };