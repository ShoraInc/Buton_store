const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30m' });
};

const authController = {
  // Регистрация
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, password, address, role } = req.body;

      // Проверяем, существует ли пользователь
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }

      // Создаем пользователя
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        address,
        role
      });

      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          address: user.address,
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Вход
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Находим пользователя
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Неверные учетные данные' });
      }

      // Проверяем пароль
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Неверные учетные данные' });
      }

      const token = generateToken(user.id);

      res.json({
        message: 'Успешный вход',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Получить профиль
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      res.json({ user });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = authController;