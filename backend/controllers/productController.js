// controllers/productController.js
const { Product, Favorite } = require('../models');
const { Op } = require('sequelize');

const productController = {
  // Получить все товары с фильтрами
  getProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 8,
        category,
        minPrice,
        maxPrice,
        isNew,
        isBudget,
        hasDiscount,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        isActive = true
      } = req.query;

      console.log('🔍 Запрос товаров с параметрами:', req.query);

      const offset = (page - 1) * limit;
      const where = {};

      // Базовый фильтр по активности товара
      if (isActive !== 'false') {
        where.isActive = true;
      }

      // Фильтры
      if (category && category !== '') {
        where.category = category;
      }
      
      // Ценовые фильтры
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
      }
      
      // Фильтры по свойствам товара
      if (isNew === 'true') where.isNew = true;
      if (isBudget === 'true') where.isBudget = true;
      if (hasDiscount === 'true') {
        where.discountPrice = { [Op.not]: null };
      }
      
      // Поиск по названию и описанию
      if (search && search.trim() !== '') {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search.trim()}%` } },
          { description: { [Op.iLike]: `%${search.trim()}%` } }
        ];
      }

      // Проверяем корректность sortBy
      const allowedSortFields = ['createdAt', 'name', 'price', 'category', 'inStock'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      console.log('📊 WHERE условия:', where);
      console.log('📈 Сортировка:', { sortField, sortDirection });

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortField, sortDirection]],
        include: [
          {
            model: Favorite,
            as: 'likes',
            attributes: ['userId'],
            required: false
          }
        ]
      });

      console.log(`✅ Найдено товаров: ${count}, на странице: ${products.length}`);

      res.json({
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('❌ Ошибка получения товаров:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Получить товар по ID
  getProduct: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('🔍 Запрос товара ID:', id);

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Некорректный ID товара' });
      }
      
      const product = await Product.findOne({
        where: { id, isActive: true },
        include: [
          {
            model: Favorite,
            as: 'likes',
            attributes: ['userId'],
            required: false
          }
        ]
      });

      if (!product) {
        console.log('❌ Товар не найден:', id);
        return res.status(404).json({ message: 'Товар не найден' });
      }

      console.log('✅ Товар найден:', product.name);

      res.json({ product });
    } catch (error) {
      console.error('❌ Ошибка получения товара:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Создать товар (только админ)
  createProduct: async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        discountPrice,
        category,
        inStock,
        isNew,
        isReady,
        isBudget,
        tags,
        images: imagesFromBody
      } = req.body;

      console.log('➕ Создание товара:', { name, category, price });
      console.log('📁 Загруженные файлы:', req.files?.length || 0);
      console.log('📋 Тело запроса:', req.body);

      // Валидация обязательных полей
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название товара обязательно' });
      }

      if (!price || price <= 0) {
        return res.status(400).json({ message: 'Цена должна быть больше 0' });
      }

      if (!category) {
        return res.status(400).json({ message: 'Категория обязательна' });
      }

      // Валидация цены со скидкой
      if (discountPrice && parseFloat(discountPrice) >= parseFloat(price)) {
        return res.status(400).json({ 
          message: 'Цена со скидкой должна быть меньше обычной цены' 
        });
      }

      // ✅ ИСПРАВЛЕНИЕ: Правильная обработка изображений
      let images = [];
      
      // Проверяем новые загруженные файлы
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.filename);
        console.log('📸 Новые изображения из файлов:', images);
      }
      
      // Проверяем изображения из тела запроса (уже загруженные)
      if (imagesFromBody) {
        try {
          const existingImages = typeof imagesFromBody === 'string' 
            ? JSON.parse(imagesFromBody) 
            : imagesFromBody;
          
          if (Array.isArray(existingImages)) {
            images = [...images, ...existingImages];
            console.log('📸 Добавлены существующие изображения:', existingImages);
          }
        } catch (error) {
          console.warn('⚠️ Ошибка парсинга существующих изображений:', error);
        }
      }

      console.log('📸 Итоговые изображения для товара:', images);

      // Обработка тегов
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
          console.warn('⚠️ Ошибка парсинга тегов:', error);
          parsedTags = [];
        }
      }

      const productData = {
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        category,
        images, // ✅ Массив имен файлов изображений
        inStock: parseInt(inStock) || 0,
        isNew: isNew === 'true' || isNew === true,
        isReady: isReady === 'true' || isReady === true,
        isBudget: isBudget === 'true' || isBudget === true,
        tags: parsedTags
      };

      console.log('💾 Данные для создания товара:', productData);

      const product = await Product.create(productData);

      console.log('✅ Товар успешно создан:', { id: product.id, name: product.name, images: product.images });

      res.status(201).json({
        message: 'Товар успешно создан',
        product
      });
    } catch (error) {
      console.error('❌ Ошибка создания товара:', error);
      
      // Обработка ошибок валидации Sequelize
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        return res.status(400).json({ 
          message: 'Ошибки валидации', 
          errors: validationErrors 
        });
      }

      res.status(400).json({ message: error.message });
    }
  },

  // Обновить товар (только админ)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      console.log('✏️ Обновление товара ID:', id);
      console.log('📝 Данные для обновления:', Object.keys(updateData));

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Некорректный ID товара' });
      }

      // Проверяем существование товара
      const existingProduct = await Product.findByPk(id);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      // Валидация обновляемых полей
      if (updateData.name && !updateData.name.trim()) {
        return res.status(400).json({ message: 'Название товара не может быть пустым' });
      }

      if (updateData.price && updateData.price <= 0) {
        return res.status(400).json({ message: 'Цена должна быть больше 0' });
      }

      if (updateData.discountPrice && updateData.price && 
          parseFloat(updateData.discountPrice) >= parseFloat(updateData.price)) {
        return res.status(400).json({ 
          message: 'Цена со скидкой должна быть меньше обычной цены' 
        });
      }

      // Обработка новых изображений
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename);
        console.log('📸 Новые изображения:', newImages);
        
        // Если есть существующие изображения, объединяем их с новыми
        if (updateData.images) {
          try {
            const existingImages = typeof updateData.images === 'string' 
              ? JSON.parse(updateData.images) 
              : updateData.images;
            updateData.images = [...existingImages, ...newImages];
          } catch (error) {
            updateData.images = newImages;
          }
        } else {
          updateData.images = [...(existingProduct.images || []), ...newImages];
        }
      } else if (updateData.images && typeof updateData.images === 'string') {
        // Если изображения переданы как строка, парсим их
        try {
          updateData.images = JSON.parse(updateData.images);
        } catch (error) {
          console.warn('⚠️ Ошибка парсинга изображений:', error);
        }
      }

      // Обработка тегов
      if (updateData.tags && typeof updateData.tags === 'string') {
        try {
          updateData.tags = JSON.parse(updateData.tags);
        } catch (error) {
          console.warn('⚠️ Ошибка парсинга тегов:', error);
          updateData.tags = [];
        }
      }

      // Преобразование строковых булевых значений
      ['isNew', 'isReady', 'isBudget'].forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = updateData[field] === 'true' || updateData[field] === true;
        }
      });

      // Преобразование числовых значений
      ['price', 'discountPrice', 'inStock'].forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== '') {
          updateData[field] = parseFloat(updateData[field]) || 0;
        }
      });

      // Обрезка строковых полей
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.description) updateData.description = updateData.description.trim();

      const [updated] = await Product.update(updateData, {
        where: { id }
      });

      if (!updated) {
        return res.status(404).json({ message: 'Товар не найден или не обновлен' });
      }

      const product = await Product.findByPk(id);
      
      console.log('✅ Товар успешно обновлен:', product.name);

      res.json({
        message: 'Товар успешно обновлен',
        product
      });
    } catch (error) {
      console.error('❌ Ошибка обновления товара:', error);
      
      // Обработка ошибок валидации Sequelize
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        return res.status(400).json({ 
          message: 'Ошибки валидации', 
          errors: validationErrors 
        });
      }

      res.status(400).json({ message: error.message });
    }
  },

  // Удалить товар (только админ) - мягкое удаление
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Удаление товара ID:', id);

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Некорректный ID товара' });
      }

      // Проверяем существование товара
      const existingProduct = await Product.findByPk(id);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      // Мягкое удаление - устанавливаем isActive = false
      const [deleted] = await Product.update(
        { isActive: false },
        { where: { id } }
      );

      if (!deleted) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      console.log('✅ Товар успешно удален (мягкое удаление):', existingProduct.name);

      res.json({ 
        message: 'Товар успешно удален',
        productId: id 
      });
    } catch (error) {
      console.error('❌ Ошибка удаления товара:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Получить категории
  getCategories: async (req, res) => {
    try {
      console.log('📂 Запрос категорий товаров');

      const categories = await Product.findAll({
        attributes: ['category'],
        group: ['category'],
        where: { isActive: true },
        raw: true
      });

      const categoryList = categories.map(item => item.category).filter(Boolean);
      
      // Добавляем предопределенные категории, если они отсутствуют
      const predefinedCategories = [
        'Комбо', 'Сборные букеты', 'Композиции', 'Розы', 
        'Комнатные растения', 'Сладости', 'Игрушки'
      ];

      const allCategories = [...new Set([...predefinedCategories, ...categoryList])];

      console.log('✅ Найдено категорий:', allCategories.length);

      res.json({ 
        categories: allCategories,
        count: allCategories.length 
      });
    } catch (error) {
      console.error('❌ Ошибка получения категорий:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Поиск товаров (дополнительный метод)
  searchProducts: async (req, res) => {
    try {
      const { q: query, category, limit = 10 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: 'Поисковый запрос должен содержать минимум 2 символа' });
      }

      console.log('🔍 Поиск товаров:', { query, category });

      const where = {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query.trim()}%` } },
          { description: { [Op.iLike]: `%${query.trim()}%` } }
        ]
      };

      if (category && category !== '') {
        where.category = category;
      }

      const products = await Product.findAll({
        where,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Favorite,
            as: 'likes',
            attributes: ['userId'],
            required: false
          }
        ]
      });

      console.log('✅ Найдено товаров:', products.length);

      res.json({
        query,
        products,
        count: products.length
      });
    } catch (error) {
      console.error('❌ Ошибка поиска товаров:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Получить популярные товары
  getPopularProducts: async (req, res) => {
    try {
      const { limit = 8 } = req.query;

      console.log('🔥 Запрос популярных товаров');

      const products = await Product.findAll({
        where: { isActive: true },
        order: [
          ['rating', 'DESC'],
          ['reviewCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        include: [
          {
            model: Favorite,
            as: 'likes',
            attributes: ['userId'],
            required: false
          }
        ]
      });

      console.log('✅ Найдено популярных товаров:', products.length);

      res.json({
        products,
        count: products.length
      });
    } catch (error) {
      console.error('❌ Ошибка получения популярных товаров:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Получить новые товары
  getNewProducts: async (req, res) => {
    try {
      const { limit = 8 } = req.query;

      console.log('🆕 Запрос новых товаров');

      const products = await Product.findAll({
        where: { 
          isActive: true,
          isNew: true 
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        include: [
          {
            model: Favorite,
            as: 'likes',
            attributes: ['userId'],
            required: false
          }
        ]
      });

      console.log('✅ Найдено новых товаров:', products.length);

      res.json({
        products,
        count: products.length
      });
    } catch (error) {
      console.error('❌ Ошибка получения новых товаров:', error);
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = productController;