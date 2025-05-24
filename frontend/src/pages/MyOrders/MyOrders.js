import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Phone, ArrowLeft, Eye, Repeat, X } from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../hooks/useAuth';
import { ordersAPI } from '../../services';

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Проверка авторизации
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setError(null);

      const response = await ordersAPI.getUserOrders();

      if (response.data.success) {
        setOrders(response.data.data.orders);
      } else {
        setError('Ошибка загрузки заказов');
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);

      // ✅ Обрабатываем разные типы ошибок
      if (error.response?.status === 401) {
        setError('Ошибка авторизации. Проверьте, авторизованы ли вы в системе.');
      } else {
        setError(error.response?.data?.message || error.message || 'Ошибка загрузки заказов');
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'confirmed': return 'Подтвержден';
      case 'delivering': return 'Доставляется';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  const handleReorder = async (order) => {
    try {
      const response = await ordersAPI.reorderOrder(order.id);

      if (response.data.success) {
        alert(`Заказ повторен! Новый номер: ${response.data.data.orderNumber}`);
        loadOrders(); // Перезагружаем список заказов
      } else {
        alert('Ошибка повторения заказа');
      }
    } catch (error) {
      console.error('Ошибка повторения заказа:', error);
      alert(error.response?.data?.message || error.message || 'Ошибка повторения заказа');
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Вы уверены, что хотите отменить заказ ${order.orderNumber}?`)) {
      return;
    }

    try {
      const response = await ordersAPI.cancelOrder(order.id);

      if (response.data.success) {
        loadOrders(); // Перезагружаем список заказов
      } else {
        alert('Ошибка отмены заказа');
      }
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      alert(error.response?.data?.message || error.message || 'Ошибка отмены заказа');
    }
  };

  const handleViewDetails = (order) => {
    navigate(`/orders/${order.id}`); // ✅ Правильный путь к детальной странице
  };

  // Показываем загрузку пока useAuth инициализируется
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // ✅ Если не авторизован - не показываем ничего (navigate уже сработал)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Заголовок страницы */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Мои заказы</h1>
              <p className="text-gray-600">История ваших покупок</p>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{error}</p>
              <button
                onClick={loadOrders}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Загрузка заказов */}
          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка заказов...</p>
            </div>
          ) : (
            /* Список заказов */
            orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">У вас пока нет заказов</p>
                <p className="text-gray-400 mb-6">Начните покупки в нашем магазине</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Перейти к покупкам
                </button>
              </div>
            ) : (
              <>
                {/* Список заказов */}
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                      {/* Заголовок заказа */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-bold">Заказ #{order.orderNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{order.total.toLocaleString()} ₸</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(order.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>

                      {/* Товары в заказе */}
                      <div className="space-y-3 mb-4">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={item.image || '/api/placeholder/80/80'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{item.price.toLocaleString()} ₸</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Информация о доставке */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm font-medium">Адрес доставки:</p>
                              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone size={16} className="text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm font-medium">Телефон:</p>
                              <p className="text-sm text-gray-600">{order.customerPhone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="flex gap-3 mt-4 pt-4 border-t">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={16} />
                          Подробности
                        </button>

                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <Repeat size={16} />
                            Заказать снова
                          </button>
                        )}

                        {['pending', 'processing', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={16} />
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyOrders;

