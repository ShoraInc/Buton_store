// pages/FlowerShop/FlowerShop.js - Обновленная версия с CartContext
import React, { useState, useEffect } from 'react';

// Импорт компонентов
import Header from '../../components/Header/Header';
import Navigation from '../../components/Navigation/Navigation';
import Features from '../../components/Features/Features';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import Pagination from '../../components/Pagination/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Footer from '../../components/Footer/Footer';

// Импорт контекстов
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext'; // Используем CartContext

const FlowerShop = () => {
  // Хуки для авторизации, корзины и избранного
  const { user, isAuthenticated } = useAuth();
  const { favorites } = useFavorites(); // Из FavoritesContext
  const { addToCart } = useCart(); // Из CartContext

  // Состояние для данных товаров
  const [data, setData] = useState({
    products: [],
    categories: ['Комбо', 'Сборные букеты', 'Композиции', 'Розы'],
    loading: true
  });

  // Состояние фильтров
  const [filters, setFilters] = useState({
    discount: false,
    new: false,
    ready: false,
    budget: false,
    category: '',
    priceMin: 0,
    priceMax: 50000
  });

  // Состояние для поиска и навигации
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('flowers');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchProductsData();
  }, []);

  // Функция для загрузки данных с backend
  const fetchProductsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));
      
      // Здесь будет реальный API вызов к вашему backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products`);
      const result = await response.json();
      
      setData(prev => ({
        ...prev,
        products: result.products || [],
        loading: false
      }));
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  // Обработчики событий
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      alert('Для добавления в корзину необходимо войти в аккаунт');
      return;
    }

    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert(error.message || 'Ошибка при добавлении в корзину');
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1); // Сбрасываем на первую страницу при смене категории
  };

  // Функция для получения названия категории товара по ID навигации
  const getCategoryByNavId = (navId) => {
    const categoryMap = {
      'flowers': ['Розы', 'Сборные букеты', 'Композиции'],
      'plants': ['Комнатные растения'],
      'sweets': ['Сладости'],
      'toys': ['Игрушки'],
      'combo': ['Комбо']
    };
    return categoryMap[navId] || [];
  };

  // Фильтрация товаров
  const filteredProducts = data.products.filter(product => {
    // Фильтрация по поисковому запросу
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Фильтрация по активной категории навигации
    const allowedCategories = getCategoryByNavId(activeCategory);
    if (allowedCategories.length > 0 && !allowedCategories.includes(product.category)) {
      return false;
    }

    // Остальные фильтры
    if (filters.discount && !(product.discountPrice && product.discountPrice < product.price)) return false;
    if (filters.new && !product.isNew) return false;
    if (filters.ready && !product.isReady) return false;
    if (filters.budget && !product.isBudget) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (product.price < filters.priceMin || product.price > filters.priceMax) return false;

    return true;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Получение списка ID избранных товаров из Context
  const favoriteIds = favorites.map(fav => fav.Product.id);

  if (data.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Обновленный Header */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddToCart={handleAddToCart}
      />

      {/* Навигация */}
      <Navigation 
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Особенности */}
      <Features />

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-8">
        {/* Панель фильтров */}
        <FilterPanel 
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={data.categories}
        />

        {/* Результаты поиска */}
        <div className="mb-4">
          <p className="text-gray-600">
            Найдено товаров: <span className="font-medium">{filteredProducts.length}</span>
            {searchQuery && (
              <span className="ml-2">
                по запросу "<span className="font-medium">{searchQuery}</span>"
              </span>
            )}
            {activeCategory !== 'flowers' && (
              <span className="ml-2">
                в категории "<span className="font-medium">
                  {activeCategory === 'plants' && 'Комнатные растения'}
                  {activeCategory === 'sweets' && 'Сладости'}
                  {activeCategory === 'toys' && 'Игрушки'}
                  {activeCategory === 'combo' && 'Комбо'}
                </span>"
              </span>
            )}
          </p>
        </div>

        {/* Сетка товаров */}
        <ProductGrid 
          products={paginatedProducts}
          favorites={favoriteIds}
          onAddToCart={handleAddToCart}
        />

        {/* Пагинация */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showLoadMore={false}
          />
        )}
      </main>

      {/* Подвал */}
      <Footer />
    </div>
  );
};

export default FlowerShop;