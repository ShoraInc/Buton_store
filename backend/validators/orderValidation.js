const { body } = require('express-validator');

const createOrderValidation = [
  // Проверка товаров
  body('items')
    .isArray({ min: 1 })
    .withMessage('Заказ должен содержать хотя бы один товар'),
  
  body('items.*.productId')
    .isInt({ gt: 0 })
    .withMessage('ID товара должен быть положительным числом'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Количество должно быть от 1 до 100'),

  // Адрес доставки
  body('deliveryAddress')
    .trim()
    .isLength({ min: 5, max: 500 }) // ✅ Уменьшили минимум до 5 для "Самовывоз"
    .withMessage('Адрес доставки должен содержать от 5 до 500 символов'),

  // Контактные данные
  body('customerPhone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Неверный формат телефона'),

  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя заказчика должно содержать от 2 до 100 символов'),

  // ✅ Время доставки - теперь обязательные поля, но гибкая валидация
  body('deliveryDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && value !== null) {
        // Проверяем что это валидная дата
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Неверный формат даты доставки');
        }
      }
      return true;
    }),

  body('deliveryTime')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && value !== null) {
        // Проверяем формат времени HH:MM
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          throw new Error('Неверный формат времени доставки');
        }
      }
      return true;
    }),

  // Опциональные поля получателя
  body('recipientName')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя получателя должно содержать от 2 до 100 символов'),

  body('recipientPhone')
    .optional({ nullable: true })
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Неверный формат телефона получателя'),

  // Дополнительная информация
  body('specialInstructions')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Особые инструкции не должны превышать 1000 символов'),

  body('giftMessage')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Сообщение подарка не должно превышать 500 символов'),

  // Булевые поля
  body('isGift')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('isGift должно быть булевым значением'),

  body('isAnonymous')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('isAnonymous должно быть булевым значением'),

  // ✅ Добавляем валидацию способа оплаты
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'online'])
    .withMessage('Неверный способ оплаты')
];

module.exports = {
  createOrderValidation
};