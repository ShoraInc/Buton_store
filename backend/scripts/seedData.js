require('dotenv').config();
const { sequelize, User, Product, Cart, CartItem, Favorite } = require('../models');

const seedData = async () => {
  try {
    console.log('🌱 Начало заполнения тестовыми данными...');

    // Создаем тестовых пользователей
    const users = await User.bulkCreate([
      {
        firstName: 'Иван',
        lastName: 'Петров',
        email: 'ivan@example.com',
        password: 'password123',
        phone: '+77771234567',
        role: 'user'
      },
      {
        firstName: 'Мария',
        lastName: 'Сидорова',
        email: 'maria@example.com',
        password: 'password123',
        phone: '+77779876543',
        role: 'user'
      }
    ]);

    // Создаем тестовые товары
    const products = await Product.bulkCreate([
      {
        name: 'Букет "Романтика"',
        description: 'Нежный букет из красных и розовых роз, идеально подходит для романтических свиданий',
        price: 18900.00,
        discountPrice: null,
        category: 'Сборные букеты',
        images: ['romantic-bouquet-1.jpg', 'romantic-bouquet-2.jpg'],
        inStock: 15,
        isNew: true,
        isReady: true,
        isBudget: false,
        rating: 4.8,
        reviewCount: 24,
        tags: ['розы', 'романтика', 'свидание']
      },
      {
        name: 'Композиция "Весенняя свежесть"',
        description: 'Яркая композиция из тюльпанов и нарциссов в стильной коробке',
        price: 15900.00,
        discountPrice: 12900.00,
        category: 'Композиции',
        images: ['spring-composition-1.jpg'],
        inStock: 8,
        isNew: false,
        isReady: true,
        isBudget: true,
        rating: 4.6,
        reviewCount: 18,
        tags: ['тюльпаны', 'весна', 'коробка']
      },
      {
        name: 'Белые розы "Элегант"',
        description: 'Классический букет из белых роз премиум класса',
        price: 25900.00,
        discountPrice: null,
        category: 'Розы',
        images: ['white-roses-1.jpg', 'white-roses-2.jpg'],
        inStock: 12,
        isNew: false,
        isReady: true,
        isBudget: false,
        rating: 4.9,
        reviewCount: 35,
        tags: ['розы', 'белые', 'премиум', 'элегант']
      },
      {
        name: 'Комбо "Сладкая любовь"',
        description: 'Красные розы с бельгийским шоколадом в подарочной упаковке',
        price: 32900.00,
        discountPrice: null,
        category: 'Комбо',
        images: ['sweet-love-combo-1.jpg'],
        inStock: 5,
        isNew: true,
        isReady: true,
        isBudget: false,
        rating: 5.0,
        reviewCount: 12,
        tags: ['розы', 'шоколад', 'подарок', 'комбо']
      },
      {
        name: 'Хризантемы "Осенняя грация"',
        description: 'Букет из разноцветных хризантем для особых случаев',
        price: 12900.00,
        discountPrice: 9900.00,
        category: 'Сборные букеты',
        images: ['autumn-chrysanthemums-1.jpg'],
        inStock: 20,
        isNew: false,
        isReady: true,
        isBudget: true,
        rating: 4.4,
        reviewCount: 28,
        tags: ['хризантемы', 'осень', 'бюджетный']
      },
      {
        name: 'Пионы "Роскошь"',
        description: 'Эксклюзивный букет из розовых пионов (сезонный товар)',
        price: 45900.00,
        discountPrice: null,
        category: 'Сборные букеты',
        images: ['luxury-peonies-1.jpg'],
        inStock: 3,
        isNew: true,
        isReady: true,
        isBudget: false,
        rating: 4.9,
        reviewCount: 8,
        tags: ['пионы', 'роскошь', 'сезонный', 'эксклюзив']
      },
      {
        name: 'Композиция "Тропический рай"',
        description: 'Экзотическая композиция с орхидеями и тропическими растениями',
        price: 28900.00,
        discountPrice: null,
        category: 'Композиции',
        images: ['tropical-paradise-1.jpg'],
        inStock: 7,
        isNew: false,
        isReady: true,
        isBudget: false,
        rating: 4.7,
        reviewCount: 15,
        tags: ['орхидеи', 'тропические', 'экзотика']
      },
      {
        name: 'Красные розы "Страсть"',
        description: 'Классический букет из красных роз для выражения чувств',
        price: 16900.00,
        discountPrice: 13900.00,
        category: 'Розы',
        images: ['red-passion-roses-1.jpg'],
        inStock: 25,
        isNew: false,
        isReady: true,
        isBudget: true,
        rating: 4.5,
        reviewCount: 42,
        tags: ['розы', 'красные', 'страсть', 'классика']
      }
    ]);

    console.log('✅ Тестовые данные успешно добавлены!');
    console.log(`👥 Создано пользователей: ${users.length}`);
    console.log(`🌸 Создано товаров: ${products.length}`);
    console.log('\n📝 Тестовые аккаунты:');
    console.log('Admin: admin@buton.kz / admin123456');
    console.log('User 1: ivan@example.com / password123');
    console.log('User 2: maria@example.com / password123');

  } catch (error) {
    console.error('❌ Ошибка при заполнении данными:', error);
  } finally {
    await sequelize.close();
  }
};

// Запуск только если файл выполняется напрямую
if (require.main === module) {
  seedData();
}

module.exports = seedData;