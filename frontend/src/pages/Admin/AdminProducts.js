// pages/Admin/AdminProducts.js
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import ProductModal from '../../components/ProductModal/ProductModal';
import { Plus, Edit, Trash2, Search, Eye, AlertCircle, Check, Package } from 'lucide-react';
import { productsAPI } from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Состояния для фильтров
  const [filters, setFilters] = useState({
    isNew: false,
    isBudget: false,
    hasDiscount: false,
    inStock: false
  });

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchQuery, selectedCategory, filters]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      // Добавляем активные фильтры
      if (filters.isNew) params.isNew = 'true';
      if (filters.isBudget) params.isBudget = 'true';
      if (filters.hasDiscount) params.hasDiscount = 'true';
      if (filters.inStock) params.minPrice = '1'; // Товары в наличии

      console.log('Загрузка товаров с параметрами:', params);
      
      const response = await productsAPI.getAll(params);
      const { products: productList, pagination } = response.data;
      
      setProducts(productList);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
      
      console.log('Товары загружены:', { count: productList.length, total: pagination.totalItems });
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      showAlert('error', 'Ошибка загрузки товаров: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(['Все', ...response.data.categories]);
      console.log('Категории загружены:', response.data.categories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      // Используем предопределенные категории в случае ошибки
      setCategories([
        'Все', 'Комбо', 'Сборные букеты', 'Композиции', 
        'Розы', 'Комнатные растения', 'Сладости', 'Игрушки'
      ]);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await productsAPI.delete(productId);
        showAlert('success', 'Товар успешно удален');
        loadProducts(); // Перезагружаем список
      } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showAlert('error', 'Ошибка удаления товара: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditProduct = (product) => {
    console.log('Редактирование товара:', product);
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleProductSuccess = (product) => {
    console.log('Товар успешно сохранен:', product);
    loadProducts(); // Перезагружаем список товаров
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 5000);
  };

  const getImageUrl = (filename) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    return `${baseUrl}/uploads/products/${filename}`;
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= 5) return 'text-orange-600';
    return 'text-green-600';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === 'Все' ? '' : category);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setFilters({
      isNew: false,
      isBudget: false,
      hasDiscount: false,
      inStock: false
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory || Object.values(filters).some(Boolean);

  if (loading && products.length === 0) {
    return (
      <AdminLayout title="Управление товарами" currentPage="products">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка товаров...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Управление товарами" currentPage="products">
      {/* Уведомления */}
      {alert.show && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          alert.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {alert.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {alert.message}
        </div>
      )}

      {/* Панель управления */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Поиск и основные фильтры */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-w-64"
                />
              </div>

              {/* Фильтр по категории */}
              <select
                value={selectedCategory || 'Все'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateProduct}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Добавить товар
            </button>
          </div>

          {/* Дополнительные фильтры */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <button
              onClick={() => handleFilterChange('isNew')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.isNew 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Новинки
            </button>
            
            <button
              onClick={() => handleFilterChange('isBudget')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.isBudget 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Бюджетные
            </button>
            
            <button
              onClick={() => handleFilterChange('hasDiscount')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.hasDiscount 
                  ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Со скидкой
            </button>
            
            <button
              onClick={() => handleFilterChange('inStock')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.inStock 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              В наличии
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 rounded-full text-sm bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Очистить фильтры
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Результаты */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            Найдено товаров: <span className="font-medium">{totalItems}</span>
            {hasActiveFilters && (
              <span className="text-sm text-gray-500 ml-2">
                (с примененными фильтрами)
              </span>
            )}
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              <span className="text-sm">Загрузка...</span>
            </div>
          )}
        </div>

        {/* Таблица товаров */}
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Товар</th>
                  <th className="text-left py-3 px-4">Категория</th>
                  <th className="text-left py-3 px-4">Цена</th>
                  <th className="text-left py-3 px-4">Остаток</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={getImageUrl(product.images[0])} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDEzLjMxMzcgMTggMTBDMTggNi42ODYyOSAyMC42ODYzIDQgMjQgNEMyNy4zMTM3IDQgMzAgNi42ODYyOSAzMCAxMEMzMCAxMy4zMTM3IDI3LjMxMzcgMTYgMjQgMTZaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMiAzNkMxMiAyOS4zNzI2IDE3LjM3MjYgMjQgMjQgMjRDMzAuNjI3NCAyNCAzNiAyOS4zNzI2IDM2IDM2VjQ0SDEyVjM2WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {product.images?.length || 0} фото
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {product.isNew && (
                              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Новинка
                              </span>
                            )}
                            {product.isBudget && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Бюджет
                              </span>
                            )}
                            {product.isReady && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Готов
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{product.category}</td>
                    <td className="py-3 px-4">
                      <div>
                        {product.discountPrice ? (
                          <>
                            <p className="font-bold text-red-600">{formatPrice(product.discountPrice)} ₸</p>
                            <p className="text-sm text-gray-500 line-through">{formatPrice(product.price)} ₸</p>
                          </>
                        ) : (
                          <p className="font-bold">{formatPrice(product.price)} ₸</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getStockColor(product.inStock)}`}>
                        {product.inStock} шт.
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/product/${product.id}`, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Просмотреть"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                          title="Редактировать"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Удалить"
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
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {hasActiveFilters ? 'Товары не найдены' : 'Нет товаров'}
            </p>
            {hasActiveFilters ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Очистить все фильтры
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Добавьте первый товар в каталог
                </p>
                <button
                  onClick={handleCreateProduct}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus size={16} />
                  Добавить товар
                </button>
              </div>
            )}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Назад
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-red-600 text-white border-red-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <ProductModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        product={null}
        onSuccess={handleProductSuccess}
      />

      <ProductModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        product={editingProduct}
        onSuccess={handleProductSuccess}
      />
    </AdminLayout>
  );
};

export default AdminProducts;