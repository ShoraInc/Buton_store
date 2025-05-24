import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { Search, Edit, Trash2, Crown, User, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { usersAPI } from '../../services/api'; // Импорт API

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🔄 Загрузка данных при монтировании компонента
  useEffect(() => {
    loadAllData();
  }, []);

  // 📥 Загрузка всех данных
  const loadAllData = async () => {
    setLoading(true);
    setError('');

    try {
      // Параллельная загрузка всех данных
      const [usersResponse, topBuyersResponse, statisticsResponse] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getTopBuyers({ limit: 5 }),
        usersAPI.getStatistics()
      ]);

      setUsers(usersResponse.data.users || []);
      setTopBuyers(topBuyersResponse.data.topBuyers || []);
      setStatistics(statisticsResponse.data.statistics || {});

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  // 📥 Загрузка только пользователей
  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки пользователей');
    }
  };

  // 🔄 Изменение роли пользователя
  const handleRoleChange = async (userId, newRole) => {
    const user = users.find(u => u.id === userId);

    // Проверка на последнего администратора
    if (user.role === 'admin' && newRole === 'user') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount === 1) {
        setError('Нельзя убрать права администратора у последнего админа!');
        return;
      }
    }

    const roleText = newRole === 'admin' ? 'Администратор' : 'Пользователь';
    if (!window.confirm(`Изменить роль пользователя на "${roleText}"?`)) {
      return;
    }

    try {
      await usersAPI.changeRole(userId, newRole);

      // Обновляем состояние локально
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      setSuccess('Роль пользователя успешно изменена');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Ошибка изменения роли:', error);
      setError('Ошибка изменения роли пользователя');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 🔐 Изменение статуса активности
  const handleToggleActive = async (userId) => {
    const user = users.find(u => u.id === userId);
    const newStatus = !user.isActive;

    try {
      await usersAPI.toggleStatus(userId, newStatus);

      // Обновляем состояние локально
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isActive: newStatus } : user
      ));

      setSuccess(`Пользователь ${newStatus ? 'активирован' : 'заблокирован'}`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      setError('Ошибка изменения статуса пользователя');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 🗑️ Удаление пользователя
  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);

    if (user.role === 'admin') {
      setError('Нельзя удалить администратора!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.')) {
      return;
    }

    try {
      await usersAPI.delete(userId);

      // Удаляем из состояния
      setUsers(users.filter(user => user.id !== userId));

      setSuccess('Пользователь успешно удален');
      setTimeout(() => setSuccess(''), 3000);

      // Перезагружаем статистику
      loadAllData();

    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);

      // Показываем конкретную ошибку от сервера
      const errorMessage = error.response?.data?.message || 'Ошибка удаления пользователя';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  // 🔍 Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 💰 Форматирование суммы
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount || 0);
  };

  // 📅 Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // 🔄 Компонент загрузки
  if (loading) {
    return (
      <AdminLayout title="Управление пользователями" currentPage="users">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Загрузка данных...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Управление пользователями" currentPage="users">
      {/* 🚨 Уведомления об ошибках и успехе */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* 📊 Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Всего пользователей</h3>
          <p className="text-3xl font-bold text-blue-600">{statistics.totalUsers || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Администраторов</h3>
          <p className="text-3xl font-bold text-red-600">{statistics.adminUsers || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Активных</h3>
          <p className="text-3xl font-bold text-green-600">{statistics.activeUsers || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">С заказами</h3>
          <p className="text-3xl font-bold text-purple-600">{statistics.usersWithOrders || 0}</p>
        </div>
      </div>

      {/* 🔍 Панель фильтров */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по имени, фамилии или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Все роли</option>
            <option value="user">Пользователи</option>
            <option value="admin">Администраторы</option>
          </select>

          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp size={16} />
            Обновить
          </button>
        </div>
      </div>

      {/* 📋 Таблица пользователей */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Пользователь</th>
                <th className="text-left py-3 px-4">Контакты</th>
                <th className="text-left py-3 px-4">Роль</th>
                <th className="text-left py-3 px-4">Статистика</th>
                <th className="text-left py-3 px-4">Регистрация</th>
                <th className="text-left py-3 px-4">Статус</th>
                <th className="text-left py-3 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.role === 'admin' ? (
                          <Crown className="text-red-500" size={20} />
                        ) : (
                          <User className="text-gray-500" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-600">{user.phone || 'Не указан'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer transition-colors ${user.role === 'admin'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {user.statistics?.totalOrders || 0} заказов
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatAmount(user.statistics?.totalSpent || 0)} ₸
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">
                      {formatDate(user.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                    >
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className={`textAlign-center p-2 rounded transition-colors ${user.role === 'admin'
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                          }`}
                        title={user.role === 'admin' ? 'Нельзя удалить администратора' : 'Удалить пользователя'}
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Пользователи не найдены</p>
            <p className="text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>

      {/* 🏆 Топ покупатели */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Crown className="text-yellow-500" size={20} />
          Топ покупатели
        </h3>

        {topBuyers.length > 0 ? (
          <div className="space-y-3">
            {topBuyers.map((buyer, index) => (
              <div key={buyer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-400' : 'text-gray-500'
                    }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{buyer.firstName} {buyer.lastName}</p>
                    <p className="text-sm text-gray-600">
                      {buyer.totalOrders} заказов • Средний чек: {formatAmount(buyer.avgOrderValue)} ₸
                    </p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatAmount(buyer.totalSpent)} ₸</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Данные о покупках отсутствуют</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;