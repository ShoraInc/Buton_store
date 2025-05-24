require('dotenv').config();
const { sequelize } = require('../models');
const seedData = require('./seedData');

const resetDatabase = async () => {
  try {
    console.log('🔄 Сброс базы данных...');
    
    // Удаляем все таблицы и пересоздаем
    await sequelize.sync({ force: true });
    console.log('✅ База данных сброшена');
    
    // Заполняем тестовыми данными
    await seedData();
    
  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error);
  } finally {
    process.exit(0);
  }
};

resetDatabase();