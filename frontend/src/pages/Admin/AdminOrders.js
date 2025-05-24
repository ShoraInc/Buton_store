import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { Search, Eye, Package, Calendar, Filter, User, MapPin, Phone, AlertCircle } from 'lucide-react';
import { ordersAPI } from '../../services';
import { useAuth } from '../../hooks/useAuth';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [totalSum, setTotalSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'pending', label: 'Ожидает' },
    { value: 'processing', label: 'В обработке' },
    { value: 'confirmed', label: 'Подтвержден' },
    { value: 'delivering', label: 'Доставляется' },
    { value: 'delivered', label: 'Доставлен' },
    { value: 'cancelled', label: 'Отменен' }
  ];



  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем заказы и общую сумму параллельно
      const [ordersResponse, totalSumResponse] = await Promise.all([
        ordersAPI.getAllOrders({
          page: 1,
          limit: 100, // или другой лимит
          search: searchQuery,
          status: statusFilter
        }),
        ordersAPI.getOrdersTotalSum()
      ]);

      console.log('Orders response:', ordersResponse);
      console.log('Total sum response:', totalSumResponse);

      // Проверяем структуру ответа для заказов
      if (ordersResponse.data) {
        // Если data содержит массив orders
        if (ordersResponse.data.orders) {
          setOrders(ordersResponse.data.orders);
        }
        // Если data сам является массивом
        else if (Array.isArray(ordersResponse.data)) {
          setOrders(ordersResponse.data);
        }
        // Если success и data
        else if (ordersResponse.data.success && ordersResponse.data.data) {
          setOrders(Array.isArray(ordersResponse.data.data) ? ordersResponse.data.data : ordersResponse.data.data.orders || []);
        }
        else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }

      // Проверяем структуру ответа для общей суммы
      if (totalSumResponse.data) {
        if (totalSumResponse.data.data.totalSum !== undefined) {
          setTotalSum(totalSumResponse.data.data.totalSum);
        } else {
          setTotalSum(0);
        }
      } else {
        setTotalSum(0);
      }

    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      setError(error.response?.data?.message || 'Ошибка загрузки заказов');
      setOrders([]);
      setTotalSum(0);
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем данные при изменении фильтров
  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);

      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);

      console.log('Status update response:', response);

      // Проверяем успешность обновления
      if (response.data && (response.data.success !== false)) {
        // Обновляем локальное состояние
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );

        console.log('✅ Статус заказа обновлен');
      } else {
        throw new Error(response.data?.message || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert(error.response?.data?.message || error.message || 'Ошибка обновления статуса');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (order) => {
    // Переходим на детальную страницу заказа
    navigate(`/admin/orders/${order.id}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-purple-100 text-purple-800',
      'delivering': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'processing': 'В обработке',
      'confirmed': 'Подтвержден',
      'delivering': 'Доставляется',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || 'Неизвестно';
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);

    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Показываем загрузку пока проверяется авторизация
  if (authLoading) {
    return (
      <AdminLayout title="Управление заказами" currentPage="orders">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="ml-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Управление заказами" currentPage="orders">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="ml-4 text-gray-600">Загрузка заказов...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Управление заказами" currentPage="orders">
      {/* Ошибка */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={loadOrders}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600">Всего заказов</h3>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600">В обработке</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => ['pending', 'processing', 'confirmed'].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600">Доставлены</h3>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600">Общая сумма</h3>
          <p className="text-2xl font-bold text-gray-800">
            {parseFloat(totalSum || 0).toLocaleString()} ₸
          </p>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по номеру заказа, клиенту или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Список заказов */}
      <div className="space-y-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Заголовок заказа */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-4 mb-2 md:mb-0">
                <h3 className="text-lg font-bold">Заказ #{order.orderNumber || order.id}</h3>

                {/* Если статус отменен - показываем только badge без возможности изменения */}
                {order.status === 'cancelled' ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-xs text-gray-500 italic">
                      (статус нельзя изменить)
                    </span>
                  </div>
                ) : (
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={actionLoading === order.id}
                    className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(order.status)} disabled:opacity-50`}
                  >
                    {statusOptions.slice(1).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {actionLoading === order.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{parseFloat(order.total || order.totalAmount || 0).toLocaleString()} ₸</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(order.date || order.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {/* Информация о клиенте */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <User size={16} className="text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Клиент:</p>
                  <p className="font-medium">{order.customerName || order.user?.name || 'Не указано'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Телефон:</p>
                  <p className="font-medium">{order.customerPhone || order.user?.phone || 'Не указано'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Адрес доставки:</p>
                  <p className="font-medium">{order.deliveryAddress || order.address || 'Не указано'}</p>
                </div>
              </div>
            </div>

            {/* Товары в заказе */}
            <div className="space-y-2 mb-4">
              <p className="font-medium">Товары ({order.items?.length || order.orderItems?.length || 0}):</p>
              {(order.items || order.orderItems) && (order.items || order.orderItems).length > 0 ? (
                <div className="space-y-2">
                  {(order.items || order.orderItems).slice(0, 3).map((item, index) => {
                    // Обработка разных структур товара
                    const itemData = item.product || item;
                    const itemName = itemData.name || itemData.title || 'Товар';
                    const itemImage = itemData.image || itemData.images?.[0];
                    const itemPrice = item.price || itemData.price || 0;
                    const itemQuantity = item.quantity || 1;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {itemImage && (
                            <img
                              src={getImageUrl(itemImage)}
                              alt={itemName}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => e.target.src = '/api/placeholder/40/40'}
                            />
                          )}
                          <div>
                            <span className="font-medium">{itemName}</span>
                            <p className="text-sm text-gray-600">Количество: {itemQuantity}</p>
                          </div>
                        </div>
                        <span className="font-medium">{parseFloat(itemPrice).toLocaleString()} ₸</span>
                      </div>
                    );
                  })}
                  {(order.items || order.orderItems).length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      и еще {(order.items || order.orderItems).length - 3} товаров...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Информация о товарах недоступна</p>
              )}
            </div>

            {/* Дополнительная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              {order.deliveryDate && (
                <div>
                  <span className="text-gray-600">Дата доставки: </span>
                  <span className="font-medium">
                    {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                    {order.deliveryTime && ` в ${order.deliveryTime}`}
                  </span>
                </div>
              )}
              {order.paymentMethod && (
                <div>
                  <span className="text-gray-600">Способ оплаты: </span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cash' && 'Наличными'}
                    {order.paymentMethod === 'card' && 'Картой'}
                    {order.paymentMethod === 'online' && 'Онлайн'}
                  </span>
                </div>
              )}
            </div>

            {(order.specialInstructions || order.comment || order.notes) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Комментарий к заказу:</p>
                <p className="text-sm text-blue-700">{order.specialInstructions || order.comment || order.notes}</p>
              </div>
            )}

            {/* Действия - кнопки управления только для не отмененных заказов */}
            <div className="flex gap-3">
              <button
                onClick={() => handleViewDetails(order)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye size={16} />
                Подробности
              </button>

              {/* Кнопки управления статусом только для не отмененных заказов */}
              {order.status !== 'cancelled' && (
                <>
                  {['pending', 'processing', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivering')}
                      disabled={actionLoading === order.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Package size={16} />
                      Отправить
                    </button>
                  )}

                  {order.status === 'delivering' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      disabled={actionLoading === order.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Package size={16} />
                      Доставлено
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">Заказы не найдены</p>
          {(searchQuery || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;