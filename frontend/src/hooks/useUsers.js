// hooks/useUsers.js
import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📥 Загрузка всех данных
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
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
  const changeUserRole = async (userId, newRole) => {
    try {
      await usersAPI.changeRole(userId, newRole);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      return { success: true, message: 'Роль пользователя успешно изменена' };
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
      return { success: false, message: 'Ошибка изменения роли пользователя' };
    }
  };

  // 🔐 Изменение статуса активности
  const toggleUserStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    const newStatus = !user.isActive;

    try {
      await usersAPI.toggleStatus(userId, newStatus);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: newStatus } : user
      ));
      
      return { 
        success: true, 
        message: `Пользователь ${newStatus ? 'активирован' : 'заблокирован'}` 
      };
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      return { success: false, message: 'Ошибка изменения статуса пользователя' };
    }
  };

  // 🗑️ Удаление пользователя
  const deleteUser = async (userId) => {
    try {
      await usersAPI.delete(userId);
      
      setUsers(users.filter(user => user.id !== userId));
      
      // Обновляем статистику после удаления
      await loadAllData();
      
      return { success: true, message: 'Пользователь успешно удален' };
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка удаления пользователя';
      return { success: false, message: errorMessage };
    }
  };

  // ➕ Создание пользователя
  const createUser = async (userData) => {
    try {
      const response = await usersAPI.create(userData);
      
      // Добавляем нового пользователя в список
      setUsers([...users, response.data.user]);
      
      // Обновляем статистику
      await loadAllData();
      
      return { success: true, message: 'Пользователь успешно создан', user: response.data.user };
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка создания пользователя';
      return { success: false, message: errorMessage };
    }
  };

  // ✏️ Обновление пользователя
  const updateUser = async (userId, userData) => {
    try {
      const response = await usersAPI.update(userId, userData);
      
      setUsers(users.map(user => 
        user.id === userId ? response.data.user : user
      ));
      
      return { success: true, message: 'Пользователь успешно обновлен', user: response.data.user };
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка обновления пользователя';
      return { success: false, message: errorMessage };
    }
  };

  // 🏆 Обновление топ покупателей
  const loadTopBuyers = async (params = {}) => {
    try {
      const response = await usersAPI.getTopBuyers(params);
      setTopBuyers(response.data.topBuyers || []);
    } catch (error) {
      console.error('Ошибка загрузки топ покупателей:', error);
      setError('Ошибка загрузки топ покупателей');
    }
  };

  return {
    // State
    users,
    topBuyers,
    statistics,
    loading,
    error,
    setError,
    
    // Actions
    loadAllData,
    loadUsers,
    changeUserRole,
    toggleUserStatus,
    deleteUser,
    createUser,
    updateUser,
    loadTopBuyers
  };
};