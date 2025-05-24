import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const ImageGallery = ({ images, productName, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Обновляем индекс при изменении initialIndex
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden'; // Блокируем скролл
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/products/${imageName}`;
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 text-white">
          <h3 className="text-lg font-medium truncate">
            {productName} ({currentIndex + 1} из {images.length})
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Основное изображение */}
        <div className="flex-1 flex items-center justify-center relative px-4 pb-4">
          <div className={`relative max-w-full max-h-full transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}>
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${productName} - изображение ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={() => setIsZoomed(!isZoomed)}
            />
            
            {/* Иконка увеличения */}
            {!isZoomed && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full">
                <ZoomIn size={16} />
              </div>
            )}
          </div>

          {/* Навигационные стрелки */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div className="flex justify-center p-4 gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex 
                    ? 'border-white' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;