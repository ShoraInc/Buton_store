const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Все маршруты требуют авторизации и роли админа
router.use(authMiddleware);
router.use(adminMiddleware); // Добавляем проверку роли админа

// ⚠️ ВАЖНО: Специфичные маршруты должны идти ПЕРЕД общими маршрутами с параметрами!

// Получение общей суммы всех заказов
// GET /admin/orders/total-sum?startDate=2024-01-01&endDate=2024-12-31&excludeCancelled=true
router.get('/orders/total-sum', adminController.getOrdersTotalSum);

// Получение детальной статистики заказов
// GET /admin/orders/statistics
router.get('/orders/statistics', adminController.getOrdersStatistics);

// Получение суммы заказов за период с группировкой
// GET /admin/orders/sum-by-period?startDate=2024-01-01&endDate=2024-12-31&groupBy=day
router.get('/orders/sum-by-period', adminController.getOrdersSumByPeriod);

// Получение всех заказов с фильтрацией, поиском и пагинацией
// GET /admin/orders?page=1&limit=20&status=pending&search=ORD-123&startDate=2024-01-01&endDate=2024-12-31
router.get('/orders', adminController.ordersFindAll);

// Получение конкретного заказа по ID
// GET /admin/orders/:id
router.get('/orders/:id', adminController.getOrderById);

// Обновление статуса заказа
// PUT /admin/orders/:id/status
router.put('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;