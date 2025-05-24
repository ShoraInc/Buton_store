// contexts/FavoritesContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загрузка избранного
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const response = await favoriteService.getFavorites();
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Переключение избранного
  const toggleFavorite = async (productId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      const response = await favoriteService.toggleFavorite(productId);
      
      if (response.data?.isFavorite) {
        // Добавлен в избранное - создаем временный объект
        const tempFavorite = {
          id: `temp_${Date.now()}`,
          productId: productId,
          Product: {
            id: productId,
            name: 'Загрузка...',
            price: 0,
            images: []
          }
        };
        setFavorites(prev => [...prev, tempFavorite]);
      } else {
        // Убран из избранного
        setFavorites(prev => prev.filter(fav => fav.Product.id !== productId));
      }

      // Асинхронно обновляем полные данные
      setTimeout(() => {
        loadFavorites();
      }, 100);

      return response.data;
    } catch (error) {
      // При ошибке перезагружаем данные
      loadFavorites();
      throw error;
    }
  };

  // Добавление в избранное
  const addToFavorites = async (productId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await favoriteService.addToFavorites(productId);
      
      // Оптимистичное обновление
      const tempFavorite = {
        id: `temp_${Date.now()}`,
        productId: productId,
        Product: {
          id: productId,
          name: 'Загрузка...',
          price: 0,
          images: []
        }
      };
      setFavorites(prev => [...prev, tempFavorite]);

      // Асинхронно обновляем полные данные
      setTimeout(() => {
        loadFavorites();
      }, 100);
    } catch (error) {
      loadFavorites();
      throw error;
    }
  };

  // Удаление из избранного
  const removeFromFavorites = async (productId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      await favoriteService.removeFromFavorites(productId);
      
      // Оптимистичное обновление - сразу убираем из UI
      setFavorites(prev => prev.filter(fav => fav.Product.id !== productId));

      // Асинхронно синхронизируем с сервером
      setTimeout(() => {
        loadFavorites();
      }, 100);
    } catch (error) {
      // При ошибке перезагружаем данные
      loadFavorites();
      throw error;
    }
  };

  // Проверка, находится ли товар в избранном
  const isFavorite = useCallback((productId) => {
    return favorites.some(fav => fav.Product?.id === productId);
  }, [favorites]);

  // Получение избранного товара
  const getFavoriteProduct = useCallback((productId) => {
    return favorites.find(fav => fav.Product?.id === productId);
  }, [favorites]);

  // Очистка избранного при выходе пользователя
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
    } else {
      loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);

  // Принудительное обновление
  const refetch = useCallback(() => {
    loadFavorites();
  }, [loadFavorites]);

  const value = {
    favorites,
    loading,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoriteProduct,
    refetch,
    favoritesCount: favorites.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Хук для использования контекста избранного
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  
  if (!context) {
    throw new Error('useFavorites должен использоваться внутри FavoritesProvider');
  }
  
  return context;
};