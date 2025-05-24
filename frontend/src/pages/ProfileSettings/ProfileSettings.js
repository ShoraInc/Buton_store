import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Eye, EyeOff, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../hooks/useAuth';
import { usersAPI } from '../../services/api'; // Используем существующий usersAPI

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' или 'error'
  const [userStats, setUserStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  // Состояние формы профиля
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Состояние формы смены пароля
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 🔄 Загрузка данных пользователя при монтировании
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  // 📥 Загрузка данных текущего пользователя
  const loadUserData = async () => {
    try {
      setLoadingStats(true);

      // Получаем данные текущего авторизованного пользователя
      const response = await usersAPI.getCurrentUser();
      const userData = response.data.user;

      // Заполняем форму данными пользователя
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });

      // Сохраняем статистику пользователя
      setUserStats(userData.statistics || {});

      // Обновляем данные пользователя в контексте auth
      updateUser(userData);

    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);

      // Если ошибка 401 - пользователь не авторизован
      if (error.response?.status === 401) {
        showMessage('Сессия истекла. Пожалуйста, войдите в систему снова.', 'error');
        // Здесь можно добавить logout и редирект на страницу входа
        navigate('/login');
        return;
      }

      showMessage('Ошибка загрузки данных профиля', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // 💬 Показать сообщение с автоскрытием
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // 📝 Обработчики изменений форм
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // 💾 Сохранение профиля
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setFormLoading(true);

    try {
      // Получаем текущего пользователя для получения его ID
      const currentUserResponse = await usersAPI.getCurrentUser();
      const currentUserId = currentUserResponse.data.user.id;

      // ✅ Подготавливаем данные, конвертируя пустые строки в null для необязательных полей
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone === '' ? null : profileData.phone, // ✅ Пустую строку конвертируем в null
        address: profileData.address === '' ? null : profileData.address
      };

      // Обновляем профиль пользователя через usersAPI
      const response = await usersAPI.update(currentUserId, updateData);

      // Обновляем данные пользователя в контексте
      updateUser(response.data.user);

      showMessage('Профиль успешно обновлен!', 'success');

      // Перезагружаем данные пользователя
      await loadUserData();

    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка обновления профиля';
      showMessage(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // 🔐 Смена пароля
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setFormLoading(true);

    // Валидация на фронтенде
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('Новые пароли не совпадают', 'error');
      setFormLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('Пароль должен содержать минимум 6 символов', 'error');
      setFormLoading(false);
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      showMessage('Новый пароль должен отличаться от текущего', 'error');
      setFormLoading(false);
      return;
    }

    try {
      // Получаем текущего пользователя для получения его ID
      const currentUserResponse = await usersAPI.getCurrentUser();
      const currentUserId = currentUserResponse.data.user.id;

      // Используем метод changePassword из usersAPI
      await usersAPI.changePassword(currentUserId, passwordData.newPassword);

      showMessage('Пароль успешно изменен!', 'success');

      // Очищаем форму
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка смены пароля';
      showMessage(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // 👁️ Переключение видимости паролей
  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  // 📅 Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // 💰 Форматирование суммы
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount || 0);
  };

  // 🔄 Проверка авторизации
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Заголовок страницы */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <User size={32} />
                Настройки профиля
              </h1>
              <p className="text-gray-600">Управление личной информацией и безопасностью</p>
            </div>
          </div>

          {/* 🚨 Уведомления */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${messageType === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
              {messageType === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 📝 Форма профиля */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User size={20} />
                Личная информация
              </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Имя</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                      disabled={formLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Фамилия</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Phone size={16} />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="+7 (___) ___-__-__"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <MapPin size={16} />
                    Адрес доставки
                  </label>
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Введите адрес для доставки заказов"
                    disabled={formLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {formLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </form>
            </div>

            {/* 🔐 Форма смены пароля */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Eye size={20} />
                Безопасность
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Новый пароль</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                      required
                      minLength="6"
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Подтвердите новый пароль</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                      required
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  {formLoading ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </form>

              {/* Дополнительная информация о безопасности */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Рекомендации по безопасности:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Используйте уникальный пароль</li>
                  <li>• Включите комбинацию букв, цифр и символов</li>
                  <li>• Не используйте личную информацию</li>
                  <li>• Регулярно меняйте пароль</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 📊 Информация об аккаунте */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Информация об аккаунте
            </h2>

            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
                <span className="text-gray-600">Загрузка статистики...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Дата регистрации</p>
                  <p className="font-bold">{formatDate(user?.createdAt)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Статус аккаунта</p>
                  <p className={`font-bold ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isActive ? 'Активный' : 'Заблокирован'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Всего заказов</p>
                  <p className="font-bold">{userStats.totalOrders || 0}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Потрачено</p>
                  <p className="font-bold text-green-600">{formatAmount(userStats.totalSpent)} ₸</p>
                </div>
              </div>
            )}

            {/* Дополнительная детальная статистика */}
            {!loadingStats && userStats.totalOrders > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-3">Детальная статистика:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Завершенные</p>
                    <p className="font-bold text-green-600">{userStats.completedOrders || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">В обработке</p>
                    <p className="font-bold text-orange-600">{userStats.processingOrders || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Отмененные</p>
                    <p className="font-bold text-red-600">{userStats.cancelledOrders || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Средний чек</p>
                    <p className="font-bold text-blue-600">{formatAmount(userStats.avgOrderValue)} ₸</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProfileSettings;