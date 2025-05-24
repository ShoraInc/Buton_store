const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class OrderController {

  // ============ ПОЛЬЗОВАТЕЛЬСКИЕ МЕТОДЫ ============

  // Получить все заказы (базовый метод)
  async ordersFindAll(req, res) {
    try {
      const response = await Order.findAll();
      res.status(200).json({ orders: response })
    } catch (error) {
      console.error('❌ Ошибка получения товаров:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Получить все заказы пользователя
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where: { userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Форматируем данные для фронтенда
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        status: order.status,
        total: parseFloat(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        customerPhone: order.customerPhone,
        paymentStatus: order.paymentStatus,
        items: order.items.map(item => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.product?.images?.[0] || item.productImage
        }))
      }));

      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения заказов'
      });
    }
  }

  // Получить конкретный заказ
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: {
          id,
          userId
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images', 'category']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Форматируем данные
      const formattedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        status: order.status,
        total: parseFloat(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        specialInstructions: order.specialInstructions,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        isAnonymous: order.isAnonymous,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.product?.images?.[0] || item.productImage,
          category: item.product?.category
        }))
      };

      res.json({
        success: true,
        data: formattedOrder
      });
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения заказа'
      });
    }
  }

  // Создать новый заказ
  async createOrder(req, res) {
    try {
      // ✅ Включаем валидацию обратно
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Ошибки валидации:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors: errors.array()
        });
      }

      const userId = req.user.id;

      // ✅ Логируем полученные данные
      console.log('📥 Данные заказа от клиента:', JSON.stringify(req.body, null, 2));
      console.log('👤 ID пользователя:', userId);

      const {
        items,
        deliveryAddress,
        deliveryDate,
        deliveryTime,
        customerPhone,
        customerName,
        recipientName,
        recipientPhone,
        specialInstructions,
        paymentMethod,
        isGift,
        giftMessage,
        isAnonymous
      } = req.body;

      // ✅ Проверяем обязательные поля вручную
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Заказ должен содержать хотя бы один товар'
        });
      }

      if (!deliveryAddress || deliveryAddress.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Укажите адрес доставки'
        });
      }

      if (!customerPhone || !customerName) {
        return res.status(400).json({
          success: false,
          message: 'Укажите контактные данные'
        });
      }

      // Проверяем товары и рассчитываем общую стоимость
      let totalAmount = 0;
      const orderItems = [];

      console.log('🔍 Проверка товаров...');
      for (const item of items) {
        console.log(`Проверяем товар ID: ${item.productId}, количество: ${item.quantity}`);

        const product = await Product.findByPk(item.productId);
        if (!product) {
          console.error(`❌ Товар с ID ${item.productId} не найден`);
          return res.status(400).json({
            success: false,
            message: `Товар с ID ${item.productId} не найден`
          });
        }

        console.log(`✅ Товар найден: ${product.name}, в наличии: ${product.inStock}`);

        if (product.inStock < item.quantity) {
          console.error(`❌ Недостаточно товара "${product.name}" на складе`);
          return res.status(400).json({
            success: false,
            message: `Недостаточно товара "${product.name}" на складе`
          });
        }

        const price = parseFloat(product.discountPrice) || parseFloat(product.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: price,
          totalPrice: itemTotal, // ✅ Явно рассчитываем totalPrice
          productName: product.name,
          productImage: product.images?.[0] || null
        });

        console.log(`💰 Товар: ${product.name}, цена: ${price}, итого: ${itemTotal}`);
      }

      console.log(`💰 Общая сумма заказа: ${totalAmount}`);

      // ✅ Правильная обработка даты
      let processedDeliveryDate = null;
      if (deliveryDate) {
        // Если дата в формате YYYY-MM-DD, добавляем время
        if (typeof deliveryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
          processedDeliveryDate = new Date(deliveryDate + 'T00:00:00.000Z');
        } else {
          processedDeliveryDate = new Date(deliveryDate);
        }

        // Проверяем что дата валидная
        if (isNaN(processedDeliveryDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Неверный формат даты доставки'
          });
        }
      }

      console.log('📅 Обработанная дата доставки:', processedDeliveryDate);

      // ✅ Генерируем номер заказа в контроллере как альтернатива
      const generateOrderNumber = async (transaction) => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

        let attempts = 0;
        while (attempts < 10) {
          const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const orderNumber = `ORD-${dateStr}-${randomNum}`;

          // Проверяем уникальность
          const existingOrder = await Order.findOne({
            where: { orderNumber },
            transaction
          });

          if (!existingOrder) {
            return orderNumber;
          }
          attempts++;
        }

        // Fallback
        return `ORD-${dateStr}-${Date.now().toString().slice(-6)}`;
      };

      // Создаем заказ в транзакции
      console.log('🔄 Создание заказа в транзакции...');
      const result = await sequelize.transaction(async (t) => {
        // ✅ Генерируем номер заказа
        const orderNumber = await generateOrderNumber(t);
        console.log('🏷️ Сгенерированный номер заказа:', orderNumber);

        // Создаем заказ
        const orderData = {
          orderNumber, // ✅ Явно устанавливаем номер заказа
          userId,
          totalAmount,
          deliveryAddress: deliveryAddress.trim(),
          deliveryDate: processedDeliveryDate,
          deliveryTime: deliveryTime || null,
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim(),
          recipientName: recipientName ? recipientName.trim() : null,
          recipientPhone: recipientPhone ? recipientPhone.trim() : null,
          specialInstructions: specialInstructions ? specialInstructions.trim() : null,
          paymentMethod: paymentMethod || 'cash',
          isGift: Boolean(isGift),
          giftMessage: giftMessage ? giftMessage.trim() : null,
          isAnonymous: Boolean(isAnonymous)
        };

        console.log('📝 Данные для создания заказа:', orderData);

        const order = await Order.create(orderData, { transaction: t });

        console.log('✅ Заказ создан с ID:', order.id, 'номер:', order.orderNumber);

        // Добавляем позиции заказа
        for (const itemData of orderItems) {
          console.log('📦 Создание позиции заказа:', itemData);

          // ✅ Дополнительная проверка что totalPrice установлен
          if (!itemData.totalPrice) {
            itemData.totalPrice = parseFloat(itemData.price) * itemData.quantity;
            console.log(`🧮 Принудительно рассчитан totalPrice: ${itemData.totalPrice}`);
          }

          await OrderItem.create({
            orderId: order.id,
            ...itemData
          }, { transaction: t });

          // Уменьшаем количество товара на складе
          await Product.decrement('inStock', {
            by: itemData.quantity,
            where: { id: itemData.productId },
            transaction: t
          });

          console.log(`📉 Уменьшено количество товара ID ${itemData.productId} на ${itemData.quantity}`);
        }

        return order;
      });

      console.log('✅ Транзакция завершена успешно');

      // Получаем созданный заказ с данными
      const createdOrder = await Order.findByPk(result.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images']
              }
            ]
          }
        ]
      });

      const responseData = {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        status: createdOrder.status,
        totalAmount: parseFloat(createdOrder.totalAmount)
      };

      console.log('📤 Ответ клиенту:', responseData);

      res.status(201).json({
        success: true,
        message: 'Заказ успешно создан',
        data: responseData
      });

    } catch (error) {
      console.error('❌ Ошибка создания заказа:', error);
      console.error('Stack trace:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Ошибка создания заказа',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Повторить заказ
  async reorderOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const originalOrder = await Order.findOne({
        where: { id, userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!originalOrder) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Проверяем доступность товаров
      const items = [];
      let totalAmount = 0;

      for (const item of originalOrder.items) {
        if (!item.product || !item.product.isActive) {
          return res.status(400).json({
            success: false,
            message: `Товар "${item.productName}" больше не доступен`
          });
        }

        if (item.product.inStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Недостаточно товара "${item.productName}" на складе`
          });
        }

        const currentPrice = item.product.discountPrice || item.product.price;
        totalAmount += currentPrice * item.quantity;

        items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: currentPrice,
          totalPrice: currentPrice,
          productName: item.product.name,
          productImage: item.product.images?.[0] || null
        });
      }

      // Генерируем уникальный номер заказа
      const generateOrderNumber = () => {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp.slice(-8)}-${random}`;
      };

      // Создаем новый заказ
      const newOrder = await sequelize.transaction(async (t) => {
        const order = await Order.create({
          userId,
          orderNumber: generateOrderNumber(), // Добавляем генерацию номера заказа
          totalAmount,
          deliveryAddress: originalOrder.deliveryAddress,
          customerPhone: originalOrder.customerPhone,
          customerName: originalOrder.customerName,
          status: 'pending'
        }, { transaction: t });

        for (const itemData of items) {
          await OrderItem.create({
            orderId: order.id,
            ...itemData
          }, { transaction: t });
        }

        return order;
      });

      res.json({
        success: true,
        message: 'Заказ успешно повторен',
        data: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber
        }
      });

    } catch (error) {
      console.error('Ошибка повторения заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка повторения заказа'
      });
    }
  }

  // Отменить заказ
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, userId },
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      if (['delivered', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Заказ нельзя отменить'
        });
      }

      // Отменяем заказ и возвращаем товары на склад
      await sequelize.transaction(async (t) => {
        await order.update({ status: 'cancelled' }, { transaction: t });

        // Возвращаем товары на склад
        for (const item of order.items) {
          await Product.increment('inStock', {
            by: item.quantity,
            where: { id: item.productId },
            transaction: t
          });
        }
      });

      res.json({
        success: true,
        message: 'Заказ отменен'
      });

    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка отмены заказа'
      });
    }
  }

  // ============ АДМИНСКИЕ МЕТОДЫ ============

  // Получить все заказы (для админа)
  async getAllOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const search = req.query.search;

      // Условия поиска
      const whereConditions = {};
      if (status) {
        whereConditions.status = status;
      }

      if (search) {
        whereConditions[Op.or] = [
          { orderNumber: { [Op.iLike]: `%${search}%` } },
          { customerName: { [Op.iLike]: `%${search}%` } },
          { customerPhone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images', 'category']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Рассчитываем общую сумму всех заказов
      const totalSum = await Order.sum('totalAmount', {
        where: whereConditions
      });

      // Форматируем данные для админки
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        status: order.status,
        total: parseFloat(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        specialInstructions: order.specialInstructions,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        isAnonymous: order.isAnonymous,
        user: order.user ? {
          id: order.user.id,
          name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
          email: order.user.email
        } : null,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.product?.images?.[0] || item.productImage,
          category: item.product?.category
        }))
      }));

      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          total: totalSum || 0,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения заказов (админ):', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения заказов'
      });
    }
  }

  // Получить общую сумму заказов
  async getOrdersTotalSum(req, res) {
    try {
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const status = req.query.status;

      const whereConditions = {};

      if (startDate && endDate) {
        whereConditions.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (status) {
        whereConditions.status = status;
      }

      const totalSum = await Order.sum('totalAmount', {
        where: whereConditions
      });

      const ordersCount = await Order.count({
        where: whereConditions
      });

      res.json({
        success: true,
        data: {
          totalSum: totalSum || 0,
          ordersCount: ordersCount || 0,
          averageOrderValue: ordersCount > 0 ? (totalSum || 0) / ordersCount : 0
        }
      });

    } catch (error) {
      console.error('Ошибка получения общей суммы:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения статистики'
      });
    }
  }

  // Получить статистику заказов
  async getOrdersStatistics(req, res) {
    try {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Статистика по статусам
      const statusStats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'sum']
        ],
        group: ['status'],
        raw: true
      });

      // Статистика за сегодня
      const todayStats = await Order.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'sum']
        ],
        where: {
          createdAt: {
            [Op.gte]: startOfToday
          }
        },
        raw: true
      });

      // Статистика за неделю
      const weekStats = await Order.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'sum']
        ],
        where: {
          createdAt: {
            [Op.gte]: startOfWeek
          }
        },
        raw: true
      });

      // Статистика за месяц
      const monthStats = await Order.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'sum']
        ],
        where: {
          createdAt: {
            [Op.gte]: startOfMonth
          }
        },
        raw: true
      });

      res.json({
        success: true,
        data: {
          statusStats: statusStats.map(stat => ({
            status: stat.status,
            count: parseInt(stat.count) || 0,
            sum: parseFloat(stat.sum) || 0
          })),
          todayStats: {
            count: parseInt(todayStats?.count) || 0,
            sum: parseFloat(todayStats?.sum) || 0
          },
          weekStats: {
            count: parseInt(weekStats?.count) || 0,
            sum: parseFloat(weekStats?.sum) || 0
          },
          monthStats: {
            count: parseInt(monthStats?.count) || 0,
            sum: parseFloat(monthStats?.sum) || 0
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения статистики'
      });
    }
  }

  // Получить сумму заказов по периодам
  async getOrdersSumByPeriod(req, res) {
    try {
      const period = req.query.period || 'month'; // day, week, month, year
      const limit = parseInt(req.query.limit) || 12;

      let dateFormat;
      let dateFunction;

      switch (period) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          dateFunction = sequelize.fn('DATE', sequelize.col('createdAt'));
          break;
        case 'week':
          dateFormat = '%Y-%u';
          dateFunction = sequelize.fn('YEARWEEK', sequelize.col('createdAt'));
          break;
        case 'month':
          dateFormat = '%Y-%m';
          dateFunction = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m');
          break;
        case 'year':
          dateFormat = '%Y';
          dateFunction = sequelize.fn('YEAR', sequelize.col('createdAt'));
          break;
        default:
          dateFormat = '%Y-%m';
          dateFunction = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m');
      }

      const results = await Order.findAll({
        attributes: [
          [dateFunction, 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'sum']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'DESC']],
        limit,
        raw: true
      });

      const formattedResults = results.map(result => ({
        period: result.period,
        count: parseInt(result.count) || 0,
        sum: parseFloat(result.sum) || 0
      }));

      res.json({
        success: true,
        data: formattedResults
      });

    } catch (error) {
      console.error('Ошибка получения данных по периодам:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения данных'
      });
    }
  }

  // Обновить статус заказа (для админа)
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Проверяем валидность статуса
      const validStatuses = ['pending', 'processing', 'confirmed', 'delivering', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Недопустимый статус заказа'
        });
      }

      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Специальная логика для отмены заказа - возвращаем товары на склад
      if (status === 'cancelled' && order.status !== 'cancelled') {
        await sequelize.transaction(async (t) => {
          await order.update({ status }, { transaction: t });

          // Возвращаем товары на склад
          for (const item of order.items) {
            await Product.increment('inStock', {
              by: item.quantity,
              where: { id: item.productId },
              transaction: t
            });
          }
        });
      } else {
        // Просто обновляем статус
        await order.update({ status });
      }

      res.json({
        success: true,
        message: 'Статус заказа обновлен',
        data: {
          id: order.id,
          status: order.status,
          orderNumber: order.orderNumber
        }
      });

    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка обновления статуса заказа'
      });
    }
  }

  // Получить детали заказа (для админа)
  async getAdminOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images', 'category', 'price', 'discountPrice']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Форматируем данные для админки
      const formattedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        status: order.status,
        total: parseFloat(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        specialInstructions: order.specialInstructions,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        isAnonymous: order.isAnonymous,
        user: order.user ? {
          id: order.user.id,
          name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
          email: order.user.email,
          phone: order.user.phone
        } : null,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.product?.images?.[0] || item.productImage,
          category: item.product?.category,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            currentPrice: parseFloat(item.product.discountPrice || item.product.price),
            images: item.product.images
          } : null
        }))
      };

      res.json({
        success: true,
        data: formattedOrder
      });

    } catch (error) {
      console.error('Ошибка получения заказа (админ):', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения заказа'
      });
    }
  }
}

module.exports = new OrderController();