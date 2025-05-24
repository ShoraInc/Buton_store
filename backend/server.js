require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');

// Импорт роутов
const usersRoutes = require("./routes/users")
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const favoriteRoutes = require('./routes/favorites');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 минут
//   max: 100 // лимит каждого IP до 100 запросов за windowMs
// });
// app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы для изображений
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Роуты API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes); 
app.use('/api/admin', adminRoutes); 

// Обработка ошибок 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Внутренняя ошибка сервера'
  });
});

// Подключение к базе данных и запуск сервера
const startServer = async () => {
  try {
    // Проверка подключения к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // await sequelize.sync({ alter: true }); // force: true - пересоздаст таблицы
    // console.log('✅ Модели синхронизированы');

    // Создание админа по умолчанию
    // await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📖 API документация: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Создание админа по умолчанию
const createDefaultAdmin = async () => {
  try {
    const { User } = require('./models');

    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'BUTON',
        email: 'admin@gmail.com',
        password: 'admin123456',
        role: 'admin'
      });
      console.log('✅ Админ по умолчанию создан: admin@buton.kz / admin123456');
    }
  } catch (error) {
    console.error('❌ Ошибка создания админа:', error);
  }
};

startServer();

module.exports = app;