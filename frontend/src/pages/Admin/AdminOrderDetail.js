// pages/OrderDetail/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  CreditCard,
  Clock,
  MessageSquare,
  Gift,
  Repeat,
  X,
  CheckCircle,
  Truck
} from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../hooks/useAuth';
import { ordersAPI } from '../../services';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await ordersAPI.getAdminOrderById(orderId);

      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Заказ не найден');
      }
    } catch (err) {
      console.error('Ошибка загрузки заказа:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    try {
      setActionLoading(true);
      const response = await ordersAPI.reorderOrder(orderId);

      if (response.data.success) {
        alert(`Заказ повторен! Новый номер: ${response.data.data.orderNumber}`);
        navigate('/my-orders');
      } else {
        alert('Ошибка повторения заказа');
      }
    } catch (error) {
      console.error('Ошибка повторения заказа:', error);
      alert(error.response?.data?.message || 'Ошибка повторения заказа');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm(`Вы уверены, что хотите отменить заказ ${order.orderNumber}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await ordersAPI.cancelOrder(orderId);

      if (response.data.success) {
        loadOrder(); // Перезагружаем заказ
      } else {
        alert('Ошибка отмены заказа');
      }
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      alert(error.response?.data?.message || 'Ошибка отмены заказа');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-blue-100 text-blue-800 border-blue-200',
      'processing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-purple-100 text-purple-800 border-purple-200',
      'delivering': 'bg-orange-100 text-orange-800 border-orange-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает подтверждения',
      'processing': 'В обработке',
      'confirmed': 'Подтвержден',
      'delivering': 'Доставляется',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || 'Неизвестный статус';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <Clock size={16} />,
      'processing': <Package size={16} />,
      'confirmed': <CheckCircle size={16} />,
      'delivering': <Truck size={16} />,
      'delivered': <CheckCircle size={16} />,
      'cancelled': <X size={16} />
    };
    return icons[status] || <Package size={16} />;
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

  const canCancelOrder = (status) => {
    return ['pending', 'processing', 'confirmed'].includes(status);
  };

  const canReorderOrder = (status) => {
    return ['delivered', 'cancelled'].includes(status);
  };

  // Показываем загрузку пока проверяется авторизация
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              К списку заказов
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Заказ не найден</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              К списку заказов
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="container mx-auto px-4 py-8">
        {/* Навигация назад */}
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          К списку заказов
        </button>

        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Заказ #{order.orderNumber}
            </h1>
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-medium">{getStatusText(order.status)}</span>
            </div>
          </div>
          <p className="text-gray-600">
            Создан {formatDate(order.date || order.createdAt)}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Состав заказа */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package size={20} />
                Состав заказа
              </h2>

              <div className="space-y-4">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-20 h-20 flex-shrink-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/80/80';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      <p className="text-gray-600">
                        {parseFloat(item.price).toLocaleString()} ₸ × {item.quantity} шт.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {(parseFloat(item.totalPrice || item.price) * (item.totalPrice ? 1 : item.quantity)).toLocaleString()} ₸
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Итого:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {parseFloat(order.totalAmount).toLocaleString()} ₸
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Детали заказа */}
          <div className="space-y-6">
            {/* Контактная информация */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User size={18} />
                Контактная информация
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium text-gray-800">{order.customerName}</p>
                <p className="flex items-center gap-2">
                  <Phone size={14} />
                  {order.customerPhone}
                </p>
              </div>
            </div>

            {/* Доставка */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin size={18} />
                Доставка
              </h3>
              <div className="space-y-3 text-gray-600">
                <div>
                  <p className="text-sm text-gray-500">Адрес:</p>
                  <p className="font-medium text-gray-800">{order.deliveryAddress}</p>
                </div>

                {(order.deliveryDate || order.deliveryTime) && (
                  <div>
                    <p className="text-sm text-gray-500">Время доставки:</p>
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      <Calendar size={14} />
                      {order.deliveryDate && new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                      {order.deliveryTime && ` в ${order.deliveryTime}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Способ оплаты */}
            {order.paymentMethod && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={18} />
                  Оплата
                </h3>
                <div className="text-gray-600">
                  <p className="font-medium text-gray-800">
                    {order.paymentMethod === 'cash' && 'Наличными при получении'}
                    {order.paymentMethod === 'card' && 'Картой при получении'}
                    {order.paymentMethod === 'online' && 'Онлайн оплата'}
                  </p>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            {(order.specialInstructions || order.isGift) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Дополнительно
                </h3>
                <div className="space-y-3">
                  {order.specialInstructions && (
                    <div>
                      <p className="text-sm text-gray-500">Комментарий:</p>
                      <p className="text-gray-800">{order.specialInstructions}</p>
                    </div>
                  )}

                  {order.isGift && (
                    <div className="flex items-center gap-2 text-pink-600">
                      <Gift size={16} />
                      <span>Подарочная упаковка</span>
                    </div>
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

export default AdminOrderDetail;