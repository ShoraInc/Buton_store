const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { createOrderValidation } = require('../validators/orderValidation');
const { authMiddleware } = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authMiddleware);

// GET /api/orders - Получить все заказы пользователя
router.get('/', orderController.getUserOrders);

// GET /api/orders/:id - Получить конкретный заказ
router.get('/:id', orderController.getOrderById);

// POST /api/orders - Создать новый заказ (✅ С валидацией)
router.post('/', createOrderValidation, orderController.createOrder);

// POST /api/orders/:id/reorder - Повторить заказ
router.post('/:id/reorder', orderController.reorderOrder);

// PUT /api/orders/:id/cancel - Отменить заказ
router.put('/:id/cancel', orderController.cancelOrder);



module.exports = router;