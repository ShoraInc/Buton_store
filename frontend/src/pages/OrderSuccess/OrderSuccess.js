// pages/OrderSuccess/OrderSuccess.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { ordersAPI } from '../../services'; // ✅ Используем ordersAPI
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      console.log('Загрузка заказа:', orderId);
      const response = await ordersAPI.getOrder(orderId); // ✅ Используем ordersAPI
      
      if (response.data.success) {
        setOrder(response.data.data);
        console.log('Заказ загружен:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Заказ не найден');
      }
    } catch (err) {
      console.error('Ошибка загрузки заказа:', err);
      setError(err.response?.data?.message || err.message || 'Заказ не найден');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает подтверждения',
      'processing': 'В обработке',
      'confirmed': 'Подтвержден',
      'preparing': 'Готовится',
      'delivering': 'Доставляется',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'processing': 'text-blue-600 bg-blue-100',
      'confirmed': 'text-green-600 bg-green-100',
      'preparing': 'text-orange-600 bg-orange-100',
      'delivering': 'text-indigo-600 bg-indigo-100',
      'delivered': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка заказа...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              На главную
            </button>
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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={20} />
          На главную
        </button>

        {/* Заголовок успеха */}
        <div className="text-center mb-8">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Заказ успешно оформлен!
          </h1>
          <p className="text-gray-600">
            Номер заказа: <span className="font-bold">#{order?.orderNumber || orderId}</span>
          </p>
        </div>

        {order && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Информация о заказе */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">Детали заказа</h2>

              {/* Статус */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Статус заказа</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              {/* Контактная информация */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Phone size={18} />
                  Контактная информация
                </h3>
                <div className="space-y-1 text-gray-600">
                  <p>{order.customerName}</p>
                  <p>{order.customerPhone}</p>
                </div>
              </div>

              {/* Доставка */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  Доставка
                </h3>
                <div className="space-y-1 text-gray-600">
                  <p>{order.deliveryAddress}</p>
                </div>
              </div>

              {/* Время */}
              {(order.deliveryDate || order.deliveryTime) && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Clock size={18} />
                    Время доставки
                  </h3>
                  <p className="text-gray-600">
                    {order.deliveryDate} {order.deliveryTime && `в ${order.deliveryTime}`}
                  </p>
                </div>
              )}

              {/* Способ оплаты */}
              {order.paymentMethod && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Способ оплаты</h3>
                  <p className="text-gray-600">
                    {order.paymentMethod === 'cash' && 'Наличными при получении'}
                    {order.paymentMethod === 'card' && 'Картой при получении'}
                    {order.paymentMethod === 'online' && 'Онлайн оплата'}
                  </p>
                </div>
              )}

              {/* Комментарий */}
              {order.specialInstructions && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Комментарий</h3>
                  <p className="text-gray-600">{order.specialInstructions}</p>
                </div>
              )}

              {/* Время создания */}
              <div className="text-sm text-gray-500">
                Заказ создан: {formatDate(order.date || order.createdAt)}
              </div>
            </div>

            {/* Состав заказа */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package size={20} />
                Состав заказа
              </h2>

              {order.items && order.items.length > 0 && (
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/64/64';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {parseFloat(item.price).toLocaleString()} ₸ × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {(parseFloat(item.totalPrice || item.price) * (item.totalPrice ? 1 : item.quantity)).toLocaleString()} ₸
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Итого:</span>
                      <span>{parseFloat(order.total).toLocaleString()} ₸</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Дополнительная информация */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-800 mb-3">Что дальше?</h3>
          <div className="space-y-2 text-blue-700">
            <p>• Мы свяжемся с вами в течение 30 минут для подтверждения заказа</p>
            <p>• Вы получите SMS с обновлениями о статусе заказа</p>
            <p>• За час до доставки мы отправим вам уведомление</p>
            <p>• Если у вас есть вопросы, звоните: +7 (XXX) XXX-XX-XX</p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Продолжить покупки
          </button>
          <button
            onClick={() => navigate('/my-orders')}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Мои заказы
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderSuccess;