# README.md
# 🌸 BUTON - Backend для интернет-магазина цветов

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Настройка базы данных
```bash
# Создайте базу данных PostgreSQL
createdb flower_shop_db

# Запуск с автоматическим созданием таблиц и тестовыми данными
npm run dev
```

### 4. Заполнение тестовыми данными (опционально)
```bash
node scripts/seedData.js
```

### 5. Сброс базы данных (если нужно)
```bash
node scripts/resetDb.js
```

## 📚 API Endpoints

### Аутентификация (`/api/auth`)
- `POST /register` - Регистрация
- `POST /login` - Вход
- `GET /profile` - Получить профиль (требует авторизации)

### Товары (`/api/products`)
- `GET /` - Список товаров с фильтрами
- `GET /categories` - Список категорий
- `GET /:id` - Товар по ID
- `POST /` - Создать товар (админ)
- `PUT /:id` - Обновить товар (админ)
- `DELETE /:id` - Удалить товар (админ)

### Корзина (`/api/cart`)
- `GET /` - Получить корзину
- `POST /add` - Добавить в корзину
- `PUT /item/:itemId` - Обновить количество
- `DELETE /item/:itemId` - Удалить из корзины
- `DELETE /clear` - Очистить корзину

### Избранное (`/api/favorites`)
- `GET /` - Список избранного
- `POST /` - Добавить в избранное
- `DELETE /:productId` - Удалить из избранного
- `POST /toggle` - Переключить статус

### Загрузка файлов (`/api/upload`)
- `POST /images` - Загрузить изображения (админ)
- `DELETE /images/:filename` - Удалить изображение (админ)

## 🗃️ Структура базы данных

### Таблицы:
- **Users** - Пользователи (роли: user, admin)
- **Products** - Товары
- **Carts** - Корзины пользователей
- **CartItems** - Элементы корзины
- **Favorites** - Избранные товары

### Связи:
- User ↔ Cart (один к одному)
- Cart ↔ CartItems (один ко многим)
- Product ↔ CartItems (один ко многим)
- User ↔ Favorites (один ко многим)
- Product ↔ Favorites (один ко многим)

## 🔧 Технологии

- **Express.js** - Web framework
- **Sequelize** - ORM для PostgreSQL
- **JWT** - Аутентификация
- **Multer** - Загрузка файлов
- **bcryptjs** - Хеширование паролей
- **Helmet** - Безопасность
- **CORS** - Cross-origin requests

## 📁 Структура проекта

```
backend/
├── config/          # Конфигурации (DB, Multer)
├── controllers/     # Контроллеры
├── models/          # Модели Sequelize
├── routes/          # Маршруты API
├── middleware/      # Middleware функции
├── scripts/         # Скрипты для БД
├── uploads/         # Загруженные файлы
└── server.js        # Главный файл сервера
```

## 🛡️ Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Rate limiting
- Helmet для заголовков безопасности
- Валидация данных через Sequelize

## 🔍 Фильтры товаров

Поддерживаемые параметры:
- `category` - Категория
- `minPrice`, `maxPrice` - Диапазон цен
- `isNew` - Новинки
- `isBudget` - Бюджетные
- `hasDiscount` - Со скидкой
- `search` - Поиск по названию/описанию
- `page`, `limit` - Пагинация
- `sortBy`, `sortOrder` - Сортировка