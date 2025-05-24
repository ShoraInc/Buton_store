// components/ProductCard/ProductCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext'; // Используем Context вместо хука
import ImageGallery from '../ImageGallery/ImageGallery';

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites(); // Теперь из Context
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Получаем массив изображений
  const images = Array.isArray(product.images) 
    ? product.images 
    : product.images 
      ? [product.images] 
      : [];

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;

  // Автоматическое переключение изображений при наведении
  useEffect(() => {
    if (isHovered && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isHovered, images.length]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
  }, [product.id]);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      setFavoriteLoading(true);
      await toggleFavorite(product.id);
    } catch (error) {
      console.error('Ошибка обновления избранного:', error);
      alert(error.message || 'Ошибка при обновлении избранного');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    return `${baseUrl}/uploads/products/${imageName}`;
  };

  const openGallery = (e) => {
    e.stopPropagation();
    setIsGalleryOpen(true);
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const renderPrice = () => {
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    
    if (hasDiscount) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-red-600">
            {parseFloat(product.discountPrice).toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 line-through">
            {parseFloat(product.price).toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">₸</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <span className="font-bold text-lg">
          {parseFloat(product.price).toLocaleString()}
        </span>
        <span className="text-sm text-gray-600">₸</span>
      </div>
    );
  };

  // Проверяем через Context
  const isProductFavorite = isFavorite(product.id);

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 product-card group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Блок изображения */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {!imageError && currentImage ? (
            <img
              src={getImageUrl(currentImage)}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🌸</div>
                <div className="text-sm">Фото скоро будет</div>
              </div>
            </div>
          )}

          {/* Кнопка просмотра всех фото */}
          {hasImages && (
            <button
              onClick={openGallery}
              className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75 transition-all opacity-0 group-hover:opacity-100"
              title="Посмотреть все фото"
            >
              <Eye size={14} />
            </button>
          )}

          {/* Навигация по изображениям */}
          {hasImages && images.length > 1 && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-all"
                title="Предыдущее фото"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-all"
                title="Следующее фото"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {/* Индикаторы изображений */}
          {hasImages && images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white' 
                      : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Кнопка избранного */}
          <button
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
              isProductFavorite
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white hover:scale-110'
            } disabled:opacity-50`}
            title={
              !isAuthenticated 
                ? 'Войдите для добавления в избранное'
                : isProductFavorite 
                  ? 'Убрать из избранного' 
                  : 'Добавить в избранное'
            }
          >
            <Heart size={16} fill={isProductFavorite ? 'white' : 'none'} />
          </button>

          {/* Бейджи */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <span className="bg-red-500 text-white px-2 py-1 text-xs rounded font-medium">
                Новинки
              </span>
            )}
            {product.discountPrice && product.discountPrice < product.price && (
              <span className="bg-green-500 text-white px-2 py-1 text-xs rounded font-medium">
                Скидка
              </span>
            )}
            {product.isBudget && (
              <span className="bg-blue-500 text-white px-2 py-1 text-xs rounded font-medium">
                Хит
              </span>
            )}
          </div>

          {/* Количество на складе */}
          {product.inStock && product.inStock <= 5 && (
            <span className="absolute bottom-2 right-2 bg-orange-500 text-white px-2 py-1 text-xs rounded">
              Осталось: {product.inStock}
            </span>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="p-4">
          <h3 className="font-medium text-gray-800 mb-1 line-clamp-1 hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description || 'Описание товара'}
          </p>

          <div className="flex items-center justify-between mb-3">
            {renderPrice()}
            
            {product.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">
                  {parseFloat(product.rating).toFixed(1)}
                </span>
                {product.reviewCount > 0 && (
                  <span className="text-xs text-gray-500">
                    ({product.reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCartClick}
            disabled={product.inStock === 0}
            className={`w-full py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
              product.inStock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-md transform hover:-translate-y-0.5'
            }`}
          >
            <ShoppingCart size={16} />
            {product.inStock === 0 ? 'Нет в наличии' : 'В корзину'}
          </button>

          {/* Дополнительная информация */}
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Категория: {product.category}</span>
            {hasImages && images.length > 1 && (
              <span>{images.length} фото</span>
            )}
          </div>
        </div>
      </div>

      {/* Галерея изображений */}
      <ImageGallery
        images={images}
        productName={product.name}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={currentImageIndex}
      />
    </>
  );
};

export default ProductCard;