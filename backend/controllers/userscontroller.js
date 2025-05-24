const { User, Order } = require("../models");
const { Op } = require('sequelize');

// 📊 Получить всех пользователей с базовой статистикой заказов
exports.usersFindAll = async (req, res) => {
  try {
    const response = await User.findAll({
      attributes: {
        exclude: ['password'] // Исключаем пароль из ответа
      },
      include: [{
        model: Order,
        as: 'orders', // Убедитесь что ассоциация настроена
        attributes: ['id', 'totalAmount', 'status', 'createdAt'],
        required: false
      }]
    });

    // Добавляем статистику для каждого пользователя
    const usersWithStats = response.map(user => {
      const userData = user.toJSON();
      const orders = userData.orders || [];
      
      userData.statistics = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
        completedOrders: orders.filter(order => order.status === 'delivered').length,
        lastOrderDate: orders.length > 0 ? Math.max(...orders.map(o => new Date(o.createdAt))) : null
      };
      
      return userData;
    });

    res.status(200).json({ 
      users: usersWithStats,
      total: usersWithStats.length 
    });
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
    res.status(400).json({ message: error.message });
  }
};

// 🏆 Получить топ покупателей
exports.getTopBuyers = async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'month':
          dateFilter.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
          };
          break;
        case 'year':
          dateFilter.createdAt = {
            [Op.gte]: new Date(now.getFullYear(), 0, 1)
          };
          break;
        case '30days':
          dateFilter.createdAt = {
            [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          };
          break;
      }
    }

    const topBuyers = await User.findAll({
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'
      ],
      include: [{
        model: Order,
        as: 'orders',
        where: {
          status: { [Op.in]: ['delivered', 'confirmed'] },
          ...dateFilter
        },
        attributes: ['totalAmount', 'status', 'createdAt'],
        required: true
      }],
      order: [[{ model: Order, as: 'orders' }, 'totalAmount', 'DESC']]
    });

    // Группируем и сортируем по общей сумме покупок
    const buyersStats = topBuyers.reduce((acc, user) => {
      const userData = user.toJSON();
      const userId = userData.id;
      
      if (!acc[userId]) {
        acc[userId] = {
          ...userData,
          totalSpent: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          orders: []
        };
        delete acc[userId].orders;
      }
      
      userData.orders.forEach(order => {
        acc[userId].totalSpent += parseFloat(order.totalAmount);
        acc[userId].totalOrders += 1;
        acc[userId].orders = userData.orders;
      });
      
      acc[userId].avgOrderValue = acc[userId].totalSpent / acc[userId].totalOrders;
      
      return acc;
    }, {});

    // Сортируем по общей потраченной сумме и берем топ
    const sortedBuyers = Object.values(buyersStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, parseInt(limit));

    res.status(200).json({
      topBuyers: sortedBuyers,
      period,
      total: sortedBuyers.length
    });
  } catch (error) {
    console.error('❌ Ошибка получения топ покупателей:', error);
    res.status(400).json({ message: error.message });
  }
};

// 👤 Получить одного пользователя по ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Order,
        as: 'orders',
        attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'createdAt', 'deliveryDate']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const userData = user.toJSON();
    const orders = userData.orders || [];
    
    // Добавляем детальную статистику
    userData.statistics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
      completedOrders: orders.filter(order => order.status === 'delivered').length,
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      processingOrders: orders.filter(order => order.status === 'processing').length,
      cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) / orders.length : 0,
      firstOrderDate: orders.length > 0 ? Math.min(...orders.map(o => new Date(o.createdAt))) : null,
      lastOrderDate: orders.length > 0 ? Math.max(...orders.map(o => new Date(o.createdAt))) : null
    };

    res.status(200).json({ user: userData });
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    res.status(400).json({ message: error.message });
  }
};

// ➕ Создать нового пользователя
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, address } = req.body;

    // Проверяем обязательные поля
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'Заполните обязательные поля: firstName, lastName, email, password' 
      });
    }

    // Проверяем существование пользователя с таким email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: role || 'user',
      address
    });

    // Исключаем пароль из ответа
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    res.status(201).json({ 
      message: 'Пользователь успешно создан',
      user: userResponse 
    });
  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error);
    res.status(400).json({ message: error.message });
  }
};

// ✏️ Обновить пользователя
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, password, role, address, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Если обновляется email, проверяем уникальность
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id } // Исключаем текущего пользователя
        } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
    }

    // Если обновляется телефон, проверяем уникальность (только если телефон не пустой)
    if (phone && phone !== '' && phone !== user.phone) {
      const existingUser = await User.findOne({ 
        where: { 
          phone,
          id: { [Op.ne]: id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким телефоном уже существует' });
      }
    }

    // ✅ Подготавливаем данные для обновления с правильной обработкой пустых значений
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password; // Хук beforeUpdate зашифрует пароль
    if (role !== undefined) updateData.role = role;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // ✅ Особая обработка для телефона - конвертируем пустую строку в null
    if (phone !== undefined) {
      updateData.phone = phone === '' ? null : phone;
    }

    await user.update(updateData);

    // Получаем обновленного пользователя без пароля
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({ 
      message: 'Пользователь успешно обновлен',
      user: updatedUser 
    });
  } catch (error) {
    console.error('❌ Ошибка обновления пользователя:', error);
    
    // Обработка ошибок валидации
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({ 
        message: 'Ошибка валидации данных',
        errors: validationErrors
      });
    }
    
    res.status(400).json({ message: error.message });
  }
};

// 🗑️ Удалить пользователя
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем есть ли активные заказы
    const activeOrders = await Order.findAll({
      where: {
        userId: id,
        status: { [Op.in]: ['pending', 'processing', 'confirmed', 'delivering'] }
      }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({ 
        message: `Нельзя удалить пользователя с активными заказами (${activeOrders.length})`,
        activeOrdersCount: activeOrders.length
      });
    }

    await user.destroy();

    res.status(200).json({ 
      message: 'Пользователь успешно удален',
      deletedUserId: id
    });
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error);
    res.status(400).json({ message: error.message });
  }
};

// 📈 Получить статистику по пользователям
exports.getUsersStatistics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    
    // Пользователи с заказами
    const usersWithOrders = await User.count({
      include: [{
        model: Order,
        as: 'orders',
        required: true
      }]
    });

    // Новые пользователи за последний месяц
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newUsersLastMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: lastMonth }
      }
    });

    res.status(200).json({
      statistics: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        usersWithOrders,
        usersWithoutOrders: totalUsers - usersWithOrders,
        newUsersLastMonth
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    res.status(400).json({ message: error.message });
  }
};

// 👤 Получить данные текущего авторизованного пользователя (для профиля)
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // Из middleware авторизации
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Order,
        as: 'orders',
        attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'createdAt']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const userData = user.toJSON();
    const orders = userData.orders || [];
    
    // Добавляем детальную статистику
    userData.statistics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
      completedOrders: orders.filter(order => order.status === 'delivered').length,
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      processingOrders: orders.filter(order => order.status === 'processing').length,
      cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) / orders.length : 0,
      firstOrderDate: orders.length > 0 ? Math.min(...orders.map(o => new Date(o.createdAt))) : null,
      lastOrderDate: orders.length > 0 ? Math.max(...orders.map(o => new Date(o.createdAt))) : null
    };

    res.status(200).json({ 
      message: 'Данные пользователя получены успешно',
      user: userData 
    });
  } catch (error) {
    console.error('❌ Ошибка получения текущего пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};