// pages/ProductDetail/ProductDetail.js - Обновленная версия с вертикальным отображением изображений
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Share2,
  Package,
  Shield,
  Truck,
  RefreshCw,
  Tag,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext'; // Используем CartContext
import { productsAPI } from '../../services';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart(); // Из CartContext

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productsAPI.getById(id);
      if (response.data && response.data.product) {
        setProduct(response.data.product);
      } else {
        setError('Товар не найден');
      }
    } catch (err) {
      console.error('Ошибка загрузки товара:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, cart: true }));
      // Используем CartContext вместо прямого вызова API
      await addToCart(product.id, quantity);
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert(error.message || 'Ошибка добавления в корзину');
    } finally {
      setActionLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, favorite: true }));
      await toggleFavorite(product.id);
    } catch (error) {
      console.error('Ошибка обновления избранного:', error);
      alert(error.message || 'Ошибка обновления избранного');
    } finally {
      setActionLoading(prev => ({ ...prev, favorite: false }));
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.inStock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        });
      } else {
        // Fallback - копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(window.location.href);
        alert('Ссылка скопирована в буфер обмена!');
      }
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
    }
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const image = Array.isArray(imageName) ? imageName[0] : imageName;
    return `${baseUrl}/uploads/products/${image}`;
  };

  const renderStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="fill-yellow-400 text-yellow-400 opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка товара...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Товар не найден'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              На главную
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((parseFloat(product.price) - parseFloat(product.discountPrice)) / parseFloat(product.price)) * 100)
    : 0;

  // Проверяем через Context
  const isProductFavorite = isFavorite(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Навигация назад */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Назад
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Галерея изображений с вертикальным расположением */}
          <div className="flex gap-4">
            {/* Миниатюры слева */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-black shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ aspectRatio: '1.5 / 2', height: '85px' }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/64/85';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Основное изображение справа */}
            <div className="flex-1">
              <div 
                className="relative bg-white rounded-lg overflow-hidden shadow-md" 
                style={{ aspectRatio: '1.5 / 2', height: '600px' }}
              >
                <img
                  src={getImageUrl(product.images?.[selectedImageIndex])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/450/600';
                  }}
                />
                
                {/* Бейджи */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Новинка
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      -{discountPercent}%
                    </span>
                  )}
                  {product.isBudget && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Эконом
                    </span>
                  )}
                </div>

                {/* Кнопка поделиться */}
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="space-y-6">
            {/* Заголовок и рейтинг */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                <button
                  onClick={handleToggleFavorite}
                  disabled={actionLoading.favorite || !isAuthenticated}
                  className={`p-3 rounded-full transition-colors ${
                    isProductFavorite
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50 ${!isAuthenticated ? 'cursor-pointer' : ''}`}
                  title={!isAuthenticated ? 'Войдите для добавления в избранное' : ''}
                >
                  <Heart size={24} className={isProductFavorite ? 'fill-current' : ''} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating)}
                </div>
                <span className="text-gray-600">
                  {parseFloat(product.rating || 0).toFixed(1)} ({product.reviewCount || 0} отзывов)
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag size={16} />
                <span>{product.category}</span>
              </div>
            </div>

            {/* Цена */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-800">
                  {parseFloat(currentPrice).toLocaleString()} ₸
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    {parseFloat(product.price).toLocaleString()} ₸
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-green-600 font-medium">
                  Экономия: {(parseFloat(product.price) - parseFloat(product.discountPrice)).toLocaleString()} ₸
                </p>
              )}
            </div>

            {/* Описание */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Описание</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Теги */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Особенности</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Наличие */}
            <div className="flex items-center gap-2">
              <Package size={20} className="text-gray-500" />
              <span className={`font-medium ${product.inStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock > 0 ? `В наличии: ${product.inStock} шт.` : 'Нет в наличии'}
              </span>
            </div>

            {/* Выбор количества */}
            {product.inStock > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.inStock}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Кнопка добавления в корзину */}
                <button
                  onClick={handleAddToCart}
                  disabled={actionLoading.cart || product.inStock === 0}
                  className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  {actionLoading.cart ? 'Добавляем...' : 'Добавить в корзину'}
                </button>

                {/* Общая стоимость */}
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Общая стоимость:</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(parseFloat(currentPrice) * quantity).toLocaleString()} ₸
                  </p>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium">Быстрая доставка</p>
                  <p>По городу за 2-4 часа</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield size={20} className="text-green-600" />
                <div>
                  <p className="font-medium">Гарантия качества</p>
                  <p>Свежие цветы</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RefreshCw size={20} className="text-purple-600" />
                <div>
                  <p className="font-medium">Обмен/возврат</p>
                  <p>В течение 24 часов</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;