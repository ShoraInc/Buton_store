const { Order, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');

class AdminController {
  // Получение всех заказов с полной информацией
  async ordersFindAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      // Построение условий фильтрации
      let whereCondition = {};

      // Фильтр по статусу
      if (status) {
        whereCondition.status = status;
      }

      // Фильтр по дате
      if (startDate || endDate) {
        whereCondition.createdAt = {};
        if (startDate) {
          whereCondition.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereCondition.createdAt[Op.lte] = new Date(endDate);
        }
      }

      // Поиск по номеру заказа, имени клиента или телефону
      if (search) {
        whereCondition[Op.or] = [
          { orderNumber: { [Op.iLike]: `%${search}%` } },
          { customerName: { [Op.iLike]: `%${search}%` } },
          { customerPhone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Пагинация
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Получение заказов с элементами
      const { rows: orders, count: totalCount } = await Order.findAndCountAll({
        where: whereCondition,
        include: [{
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName', 'productImage']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true // Важно для правильного подсчета при JOIN
      });

      // Получаем общую статистику (исключая отмененные)
      const totalStats = await Order.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount']
        ],
        where: {
          status: {
            [Op.ne]: 'cancelled'
          }
        },
        raw: true
      });

      // Преобразуем данные для фронтенда
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        total: parseFloat(order.totalAmount), // Для совместимости с фронтендом
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        specialInstructions: order.specialInstructions,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        isAnonymous: order.isAnonymous,
        createdAt: order.createdAt,
        date: order.createdAt, // Для совместимости с фронтендом
        items: order.items ? order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.productImage
        })) : []
      }));

      res.status(200).json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < totalCount,
            hasPrev: parseInt(page) > 1
          },
          totalSum: parseFloat(totalStats.totalSum) || 0,
          totalOrdersCount: parseInt(totalStats.ordersCount) || 0
        },
        // Для обратной совместимости
        orders: formattedOrders,
        total: parseFloat(totalStats.totalSum) || 0,
        orderCount: parseInt(totalStats.ordersCount) || 0
      });

    } catch (error) {
      console.error('❌ Ошибка получения заказов:', error);
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  // Получение конкретного заказа по ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName', 'productImage']
        }]
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
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        specialInstructions: order.specialInstructions,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        isAnonymous: order.isAnonymous,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items ? order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice),
          image: item.productImage
        })) : []
      };

      res.status(200).json({
        success: true,
        data: formattedOrder
      });

    } catch (error) {
      console.error('❌ Ошибка получения заказа:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Обновление статуса заказа
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Проверяем валидность статуса
      const validStatuses = ['pending', 'processing', 'confirmed', 'delivering', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Неверный статус заказа'
        });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Обновляем статус
      await order.update({ status });

      res.status(200).json({
        success: true,
        message: 'Статус заказа обновлен',
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      });

    } catch (error) {
      console.error('❌ Ошибка обновления статуса:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получение общей суммы всех заказов
  async getOrdersTotalSum(req, res) {
    try {
      const { startDate, endDate, excludeCancelled = 'true' } = req.query;

      let whereCondition = {};

      // Исключаем отмененные заказы по умолчанию
      if (excludeCancelled === 'true') {
        whereCondition.status = {
          [Op.ne]: 'cancelled'
        };
      }

      // Фильтр по дате
      if (startDate || endDate) {
        whereCondition.createdAt = {};
        if (startDate) {
          whereCondition.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereCondition.createdAt[Op.lte] = new Date(endDate);
        }
      }

      const result = await Order.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrder']
        ],
        where: whereCondition,
        raw: true
      });

      const totalSum = parseFloat(result.totalSum) || 0;
      const ordersCount = parseInt(result.ordersCount) || 0;
      const averageOrder = parseFloat(result.averageOrder) || 0;

      res.status(200).json({
        success: true,
        data: {
          totalSum,
          ordersCount,
          averageOrder,
          period: {
            startDate: startDate || null,
            endDate: endDate || null
          },
          message: `${ordersCount} заказов на общую сумму ${totalSum.toLocaleString()} ₸`
        }
      });

    } catch (error) {
      console.error('❌ Ошибка подсчета суммы заказов:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получение детальной статистики заказов
  async getOrdersStatistics(req, res) {
    try {
      // Общая статистика
      const totalStats = await Order.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrder'],
          [sequelize.fn('MAX', sequelize.col('totalAmount')), 'maxOrder'],
          [sequelize.fn('MIN', sequelize.col('totalAmount')), 'minOrder']
        ],
        raw: true
      });

      // Статистика по статусам
      const statusStats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'statusSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'statusCount']
        ],
        group: ['status'],
        raw: true
      });

      // Статистика по месяцам (последние 12 месяцев)
      const monthlyStats = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'monthSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'monthCount']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Последний год
          }
        },
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          total: {
            totalSum: parseFloat(totalStats.totalSum) || 0,
            ordersCount: parseInt(totalStats.ordersCount) || 0,
            averageOrder: parseFloat(totalStats.averageOrder) || 0,
            maxOrder: parseFloat(totalStats.maxOrder) || 0,
            minOrder: parseFloat(totalStats.minOrder) || 0
          },
          byStatus: statusStats.map(stat => ({
            status: stat.status,
            sum: parseFloat(stat.statusSum) || 0,
            count: parseInt(stat.statusCount) || 0,
            percentage: totalStats.ordersCount ? 
              ((parseInt(stat.statusCount) / parseInt(totalStats.ordersCount)) * 100).toFixed(2) : 0
          })),
          monthly: monthlyStats.map(stat => ({
            month: stat.month,
            sum: parseFloat(stat.monthSum) || 0,
            count: parseInt(stat.monthCount) || 0
          }))
        }
      });

    } catch (error) {
      console.error('❌ Ошибка получения статистики заказов:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получение суммы заказов за определенный период
  async getOrdersSumByPeriod(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      let whereCondition = {};

      // Фильтр по дате
      if (startDate && endDate) {
        whereCondition.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereCondition.createdAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereCondition.createdAt = {
          [Op.lte]: new Date(endDate)
        };
      }

      // Общая сумма за период
      const totalResult = await Order.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount']
        ],
        where: whereCondition,
        raw: true
      });

      // Группировка по периодам
      let dateGroupFunction;
      switch (groupBy) {
        case 'month':
          dateGroupFunction = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'));
          break;
        case 'week':
          dateGroupFunction = sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt'));
          break;
        default:
          dateGroupFunction = sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt'));
      }

      const periodStats = await Order.findAll({
        attributes: [
          [dateGroupFunction, 'period'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'periodSum'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'periodCount']
        ],
        where: whereCondition,
        group: [dateGroupFunction],
        order: [[dateGroupFunction, 'ASC']],
        raw: true
      });

      const totalSum = parseFloat(totalResult.totalSum) || 0;
      const ordersCount = parseInt(totalResult.ordersCount) || 0;

      res.status(200).json({
        success: true,
        data: {
          totalSum,
          ordersCount,
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
            groupBy
          },
          breakdown: periodStats.map(stat => ({
            period: stat.period,
            sum: parseFloat(stat.periodSum) || 0,
            count: parseInt(stat.periodCount) || 0
          })),
          message: `За указанный период: ${ordersCount} заказов на сумму ${totalSum.toLocaleString()} ₸`
        }
      });

    } catch (error) {
      console.error('❌ Ошибка подсчета суммы за период:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AdminController();