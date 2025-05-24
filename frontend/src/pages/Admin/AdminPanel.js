// pages/Admin/AdminPanel.js - Обновленная админская панель с тестом API
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import ApiTest from '../../components/ApiTest/ApiTest';
import { Package, ShoppingCart, Users, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { productsAPI, authAPI, usersAPI, ordersAPI } from '../../services';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showApiTest, setShowApiTest] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Загружаем статистику товаров
      const productsResponse = await productsAPI.getAll({ limit: 1 });
      const totalProducts = productsResponse.data.pagination?.totalItems || 0;

      const ordersResponse = await ordersAPI.getAllOrders();
      const totalOrders = ordersResponse.data.orders.length || 0;


      const usersResponse = await usersAPI.getAll();
      const totalUsers = usersResponse.data.users.length || 0;

      const revenueResponse = await ordersAPI.getOrdersTotalSum();
      const totalRevenue = revenueResponse.data.data.totalSum || 0;

      setStats(prev => ({
        ...prev,
        products: totalProducts,
        orders: totalOrders,
        users: totalUsers,
        revenue: totalRevenue,
      }));

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = "bg-blue-600", loading: cardLoading }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <div className="text-2xl font-bold mt-1">
            {cardLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
        </div>
        <div className={`${color} rounded-full p-3`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Панель управления" currentPage="dashboard">
      <div className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Товары"
            value={stats.products}
            color="bg-blue-600"
            loading={loading}
          />
          <StatCard
            icon={ShoppingCart}
            title="Заказы"
            value={stats.orders}
            color="bg-green-600"
            loading={loading}
          />
          <StatCard
            icon={Users}
            title="Пользователи"
            value={stats.users}
            color="bg-purple-600"
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            title="Выручка"
            value={`${stats.revenue} ₸`}
            color="bg-orange-600"
            loading={loading}
          />
        </div>

        {/* Быстрые действия */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/admin/products'}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package size={20} className="text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Управление товарами</p>
                <p className="text-sm text-gray-600">Добавить, редактировать товары</p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/admin/orders'}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart size={20} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium">Заказы</p>
                <p className="text-sm text-gray-600">Просмотр и управление заказами</p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/admin/users'}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users size={20} className="text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Пользователи</p>
                <p className="text-sm text-gray-600">Управление пользователями</p>
              </div>
            </button>
          </div>
        </div>

        {/* Тест API подключения */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              <h3 className="text-lg font-bold">Диагностика системы</h3>
            </div>
            <button
              onClick={() => setShowApiTest(!showApiTest)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showApiTest ? 'Скрыть тест' : 'Показать тест API'}
            </button>
          </div>

          {showApiTest && <ApiTest />}

          {!showApiTest && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>Нажмите "Показать тест API" для диагностики подключения</p>
            </div>
          )}
        </div>

        {/* Последние действия */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Последние действия</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Система запущена</p>
                <p className="text-xs text-gray-600">Админская панель готова к работе</p>
              </div>
              <span className="text-xs text-gray-500">Сейчас</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">API подключение</p>
                <p className="text-xs text-gray-600">Соединение с бэкендом установлено</p>
              </div>
              <span className="text-xs text-gray-500">1 мин назад</span>
            </div>
          </div>
        </div>

        {/* Важные уведомления */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Важная информация</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Убедитесь, что бэкенд сервер запущен на порту 4000</li>
                <li>• Проверьте настройки CORS в server.js</li>
                <li>• Используйте тест API для диагностики подключения</li>
                <li>• Для создания товаров необходимы права администратора</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;