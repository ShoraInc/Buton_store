// pages/Checkout/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Calendar, Clock, ShoppingBag, AlertCircle } from 'lucide-react';
import { cartService } from '../../services/cartService';
import { ordersAPI } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // ✅ Ошибки полей

  // Данные формы заказа
  const [orderData, setOrderData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    deliveryType: 'delivery',
    address: '',
    city: 'Семей',
    entrance: '',
    floor: '',
    apartment: '',
    deliveryDate: '',
    deliveryTime: '',
    paymentMethod: 'cash',
    comment: ''
  });

  // ✅ Правила валидации (соответствуют backend)
  const validationRules = {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Имя должно содержать от 2 до 100 символов'
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Фамилия должна содержать от 2 до 100 символов'
    },
    phone: {
      required: true,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Неверный формат телефона'
    },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Неверный формат email'
    },
    address: {
      required: true,
      minLength: 5, // ✅ Уменьшили для "Самовывоз"
      maxLength: 500,
      message: 'Адрес доставки должен содержать от 5 до 500 символов'
    },
    deliveryDate: {
      required: true,
      message: 'Выберите дату доставки'
    },
    deliveryTime: {
      required: true,
      pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      message: 'Выберите время доставки'
    },
    comment: {
      required: false,
      maxLength: 1000,
      message: 'Комментарий не должен превышать 1000 символов'
    }
  };

  // ✅ Функция валидации поля
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return null;

    // Пропускаем валидацию для адреса при самовывозе
    if (name === 'address' && orderData.deliveryType === 'pickup') {
      return null;
    }

    // Проверка обязательности
    if (rule.required && (!value || value.trim() === '')) {
      return rule.message;
    }

    // Если поле не обязательное и пустое, пропускаем остальные проверки
    if (!rule.required && (!value || value.trim() === '')) {
      return null;
    }

    // Проверка минимальной длины
    if (rule.minLength && value.trim().length < rule.minLength) {
      return rule.message;
    }

    // Проверка максимальной длины
    if (rule.maxLength && value.trim().length > rule.maxLength) {
      return rule.message;
    }

    // Проверка паттерна
    if (rule.pattern && !rule.pattern.test(value.trim())) {
      return rule.message;
    }

    return null;
  };

  // ✅ Валидация всех полей
  const validateAllFields = () => {
    const errors = {};

    // Основные поля
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, orderData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    // Проверка корзины
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      errors.cart = 'Корзина пуста';
    }

    // Проверка товаров в корзине
    if (cartData?.items) {
      cartData.items.forEach((item, index) => {
        if (!item.Product?.id) {
          errors[`item_${index}`] = 'Некорректный товар в корзине';
        }
        if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
          errors[`item_${index}_quantity`] = 'Некорректное количество товара';
        }
      });
    }

    return errors;
  };

  // ✅ Обновление данных формы с валидацией
  const handleInputChange = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));

    // Валидация поля в реальном времени
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Очищаем общую ошибку при изменении полей
    if (error === null && fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Обновляем данные формы при загрузке пользователя
  useEffect(() => {
    if (user) {
      setOrderData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Проверка авторизации и загрузка корзины
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      if (!response.cart || !response.cart.items || response.cart.items.length === 0) {
        navigate('/');
        return;
      }
      setCartData(response.cart);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // ✅ Полная валидация перед отправкой
      const errors = validateAllFields();

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const firstError = Object.values(errors)[0];
        setError(firstError);
        setSubmitting(false);
        return;
      }

      // ✅ Правильная подготовка данных для backend
      const orderPayload = {
        items: cartData.items.map(item => ({
          productId: item.Product.id,
          quantity: item.quantity
        })),
        deliveryAddress: orderData.deliveryType === 'delivery'
          ? `${orderData.address}${orderData.entrance ? ', под. ' + orderData.entrance : ''}${orderData.floor ? ', эт. ' + orderData.floor : ''}${orderData.apartment ? ', кв. ' + orderData.apartment : ''}`.trim()
          : 'Самовывоз',

        // ✅ Дата в формате YYYY-MM-DD (backend сам преобразует в ISO8601)
        deliveryDate: orderData.deliveryDate || null,
        deliveryTime: orderData.deliveryTime || null,

        customerPhone: orderData.phone.trim(),
        customerName: `${orderData.firstName.trim()} ${orderData.lastName.trim()}`,

        // ✅ Все опциональные поля отправляем как null если пустые
        recipientName: null,
        recipientPhone: null,
        specialInstructions: orderData.comment.trim() || null,
        paymentMethod: orderData.paymentMethod,
        isGift: false,
        giftMessage: null,
        isAnonymous: false
      };

      // ✅ Детальное логирование для отладки
      console.log('🔍 Отправляемые данные:', JSON.stringify(orderPayload, null, 2));

      // Проверяем каждое поле
      console.log('📋 Проверка полей:');
      console.log('- items count:', orderPayload.items.length);
      console.log('- deliveryAddress length:', orderPayload.deliveryAddress.length);
      console.log('- customerPhone:', orderPayload.customerPhone);
      console.log('- customerName length:', orderPayload.customerName.length);
      console.log('- deliveryDate:', orderPayload.deliveryDate);
      console.log('- deliveryTime:', orderPayload.deliveryTime);
      console.log('- paymentMethod:', orderPayload.paymentMethod);

      const response = await ordersAPI.createOrder(orderPayload);

      if (response.data.success) {
        // Очистка корзины после успешного создания заказа
        await cartService.clearCart();

        // Переход на страницу успеха
        navigate(`/order-success/${response.data.data.id}`);
      } else {
        throw new Error(response.data.message || 'Ошибка создания заказа');
      }

    } catch (err) {
      console.error('❌ Полная ошибка:', err);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response status:', err.response?.status);

      // ✅ Показываем детальную ошибку валидации
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(e => `${e.path}: ${e.msg}`).join('\n');
        setError(`Ошибка валидации:\n${validationErrors}`);
        console.error('📝 Ошибки валидации:', err.response.data.errors);
      } else {
        setError(err.response?.data?.message || err.message || 'Ошибка создания заказа');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Компонент для отображения ошибки поля
  const FieldError = ({ fieldName }) => {
    if (!fieldErrors[fieldName]) return null;

    return (
      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
        <AlertCircle size={14} />
        <span>{fieldErrors[fieldName]}</span>
      </div>
    );
  };

  // ✅ Функция для определения класса поля с ошибкой
  const getFieldClassName = (fieldName, baseClassName) => {
    return fieldErrors[fieldName]
      ? `${baseClassName} border-red-500 focus:ring-red-500`
      : `${baseClassName} border-gray-300 focus:ring-black`;
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 21) {
        slots.push(`${hour}:30`);
      }
    }
    return slots;
  };

  // ✅ Проверка готовности формы
  const isFormValid = () => {
    const errors = validateAllFields();
    return Object.keys(errors).length === 0;
  };

  // Показываем загрузку пока проверяется авторизация
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Проверка авторизации...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка корзины...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Навигация назад */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={20} />
          Назад к покупкам
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма заказа */}
          <div className="bg-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Контактная информация */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <User size={20} />
                  Контактная информация
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Имя *"
                      value={orderData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={getFieldClassName('firstName', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                      required
                    />
                    <FieldError fieldName="firstName" />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Фамилия *"
                      value={orderData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={getFieldClassName('lastName', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                      required
                    />
                    <FieldError fieldName="lastName" />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Телефон *"
                      value={orderData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={getFieldClassName('phone', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                      required
                    />
                    <FieldError fieldName="phone" />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={orderData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={getFieldClassName('email', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                    />
                    <FieldError fieldName="email" />
                  </div>
                </div>
              </div>

              {/* Тип доставки */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Способ получения
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={orderData.deliveryType === 'delivery'}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    />
                    <span>Доставка</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      checked={orderData.deliveryType === 'pickup'}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    />
                    <span>Самовывоз</span>
                  </label>
                </div>

                {orderData.deliveryType === 'delivery' && (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Адрес доставки *"
                        value={orderData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className={getFieldClassName('address', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                        required
                      />
                      <FieldError fieldName="address" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Подъезд"
                        value={orderData.entrance}
                        onChange={(e) => handleInputChange('entrance', e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        placeholder="Этаж"
                        value={orderData.floor}
                        onChange={(e) => handleInputChange('floor', e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        placeholder="Квартира"
                        value={orderData.apartment}
                        onChange={(e) => handleInputChange('apartment', e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Время доставки */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Время доставки
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={orderData.deliveryDate}
                      min={getMinDate()}
                      onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      className={getFieldClassName('deliveryDate', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                      required
                    />
                    <FieldError fieldName="deliveryDate" />
                  </div>
                  <div>
                    <select
                      value={orderData.deliveryTime}
                      onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                      className={getFieldClassName('deliveryTime', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                      required
                    >
                      <option value="">Выберите время</option>
                      {getTimeSlots().map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <FieldError fieldName="deliveryTime" />
                  </div>
                </div>
              </div>

              {/* Способ оплаты */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Способ оплаты
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={orderData.paymentMethod === 'cash'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    />
                    <span>Наличными при получении</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={orderData.paymentMethod === 'card'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    />
                    <span>Картой при получении</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={orderData.paymentMethod === 'online'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    />
                    <span>Онлайн оплата</span>
                  </label>
                </div>
              </div>

              {/* Комментарий */}
              <div>
                <h3 className="text-lg font-medium mb-4">Комментарий к заказу</h3>
                <div>
                  <textarea
                    placeholder="Дополнительные пожелания..."
                    value={orderData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    rows={3}
                    className={getFieldClassName('comment', 'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2')}
                  />
                  <FieldError fieldName="comment" />
                </div>
              </div>

              {/* Кнопка заказа */}
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${submitting || !isFormValid()
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                {submitting ? 'Оформление...' : 'Оформить заказ'}
              </button>

              {/* ✅ Подсказка о валидации */}
              {!isFormValid() && !submitting && (
                <p className="text-sm text-gray-500 text-center">
                  Заполните все обязательные поля для оформления заказа
                </p>
              )}
            </form>
          </div>

          {/* Сводка заказа */}
          <div className="bg-white rounded-lg p-6 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingBag size={20} />
              Ваш заказ
            </h2>

            {cartData && cartData.items && (
              <div className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={getImageUrl(item.Product.images)}
                        alt={item.Product.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/64/64';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.Product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {parseFloat(item.priceAtTime).toLocaleString()} ₸ × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {(parseFloat(item.priceAtTime) * item.quantity).toLocaleString()} ₸
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Итого:</span>
                    <span>{cartData.totalAmount?.toLocaleString()} ₸</span>
                  </div>
                  {orderData.deliveryType === 'delivery' && (
                    <p className="text-sm text-gray-600 mt-2">
                      * Стоимость доставки уточняется при подтверждении заказа
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;