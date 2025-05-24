// components/ApiTest/ApiTest.js - Обновленный компонент для тестирования API
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // ✅ Используем новый контекст
import { productsAPI, authAPI } from '../../services/api';

const ApiTest = () => {
  const { user, isAuthenticated } = useAuth(); // ✅ Используем новый хук
  const [testResults, setTestResults] = useState({
    products: null,
    categories: null,
    auth: null,
    adminOrders: null // ✅ Добавляем тест админских заказов
  });
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = { products: null, categories: null, auth: null, adminOrders: null };

    // Тест получения продуктов
    try {
      const productsResponse = await productsAPI.getAll({ limit: 5 });
      results.products = {
        success: true,
        data: productsResponse.data,
        message: `Получено ${productsResponse.data.products?.length || 0} товаров`
      };
    } catch (error) {
      results.products = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Тест получения категорий
    try {
      const categoriesResponse = await productsAPI.getCategories();
      results.categories = {
        success: true,
        data: categoriesResponse.data,
        message: `Получено ${categoriesResponse.data.categories?.length || 0} категорий`
      };
    } catch (error) {
      results.categories = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Тест проверки авторизации
    if (isAuthenticated) {
      try {
        const profileResponse = await authAPI.getProfile();
        results.auth = {
          success: true,
          data: profileResponse.data,
          message: `Пользователь: ${profileResponse.data.user?.email}`
        };
      } catch (error) {
        results.auth = {
          success: false,
          error: error.message,
          status: error.response?.status
        };
      }
    } else {
      results.auth = {
        success: false,
        error: 'Пользователь не авторизован',
        status: 401
      };
    }

    // ✅ Тест админских заказов (если пользователь админ)
    if (user && user.role === 'admin') {
      try {
        const ordersResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/admin/orders/total-sum`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          results.adminOrders = {
            success: true,
            data: ordersData.data,
            message: `Общая сумма заказов: ${ordersData.data.totalSum} руб.`
          };
        } else {
          throw new Error(`HTTP ${ordersResponse.status}`);
        }
      } catch (error) {
        results.adminOrders = {
          success: false,
          error: error.message,
          status: error.response?.status || 500
        };
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [isAuthenticated, user]); // ✅ Перезапускаем при изменении авторизации

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">API Connection Test</h3>
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Тестирование...' : 'Повторить тест'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Тест продуктов */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(testResults.products?.success)}</span>
            <h4 className="font-medium">Получение товаров</h4>
            <span className={`text-sm ${getStatusColor(testResults.products?.success)}`}>
              {testResults.products?.success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>
          
          {testResults.products && (
            <div className="text-sm text-gray-600">
              {testResults.products.success ? (
                <div>
                  <p className="text-green-600">{testResults.products.message}</p>
                  <p>Endpoint: GET /api/products</p>
                  <p>Total items: {testResults.products.data.pagination?.totalItems || 0}</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-600">Ошибка: {testResults.products.error}</p>
                  <p>Status: {testResults.products.status}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Тест категорий */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(testResults.categories?.success)}</span>
            <h4 className="font-medium">Получение категорий</h4>
            <span className={`text-sm ${getStatusColor(testResults.categories?.success)}`}>
              {testResults.categories?.success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>
          
          {testResults.categories && (
            <div className="text-sm text-gray-600">
              {testResults.categories.success ? (
                <div>
                  <p className="text-green-600">{testResults.categories.message}</p>
                  <p>Endpoint: GET /api/products/categories</p>
                  <p>Categories: {testResults.categories.data.categories?.join(', ')}</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-600">Ошибка: {testResults.categories.error}</p>
                  <p>Status: {testResults.categories.status}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Тест авторизации */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(testResults.auth?.success)}</span>
            <h4 className="font-medium">Проверка авторизации</h4>
            <span className={`text-sm ${getStatusColor(testResults.auth?.success)}`}>
              {testResults.auth?.success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>
          
          {testResults.auth && (
            <div className="text-sm text-gray-600">
              {testResults.auth.success ? (
                <div>
                  <p className="text-green-600">{testResults.auth.message}</p>
                  <p>Endpoint: GET /api/auth/profile</p>
                  <p>Role: {testResults.auth.data.user?.role}</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-600">Ошибка: {testResults.auth.error}</p>
                  <p>Status: {testResults.auth.status}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ✅ Тест админских заказов (только для админов) */}
        {user && user.role === 'admin' && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getStatusIcon(testResults.adminOrders?.success)}</span>
              <h4 className="font-medium">Сумма заказов (Admin)</h4>
              <span className={`text-sm ${getStatusColor(testResults.adminOrders?.success)}`}>
                {testResults.adminOrders?.success ? 'SUCCESS' : 'ERROR'}
              </span>
            </div>
            
            {testResults.adminOrders && (
              <div className="text-sm text-gray-600">
                {testResults.adminOrders.success ? (
                  <div>
                    <p className="text-green-600">{testResults.adminOrders.message}</p>
                    <p>Endpoint: GET /admin/orders/total-sum</p>
                    <p>Orders count: {testResults.adminOrders.data.ordersCount}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-600">Ошибка: {testResults.adminOrders.error}</p>
                    <p>Status: {testResults.adminOrders.status}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Информация о конфигурации */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Конфигурация API</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:4000'}</p>
          <p>Auth Token: {localStorage.getItem('authToken') ? 'Присутствует' : 'Отсутствует'}</p>
          <p>Current User: {user?.email || 'Не авторизован'}</p>
          <p>User Role: {user?.role || 'Не определена'}</p>
          <p>Token Valid: {isAuthenticated ? 'Да' : 'Нет'}</p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;