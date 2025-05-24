import { useState, useEffect } from 'react';

export const useProductImages = (product) => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());

  useEffect(() => {
    // Нормализуем изображения в массив
    let productImages = [];
    
    if (Array.isArray(product.images)) {
      productImages = product.images;
    } else if (product.images) {
      productImages = [product.images];
    }

    setImages(productImages);
    setCurrentImageIndex(0);
    setImageErrors(new Set());
  }, [product.id, product.images]);

  const getImageUrl = (imageName) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/products/${imageName}`;
  };

  const handleImageError = (imageName) => {
    setImageErrors(prev => new Set([...prev, imageName]));
  };

  const isImageValid = (imageName) => {
    return !imageErrors.has(imageName);
  };

  const getValidImages = () => {
    return images.filter(img => isImageValid(img));
  };

  const nextImage = () => {
    const validImages = getValidImages();
    if (validImages.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % validImages.length);
    }
  };

  const prevImage = () => {
    const validImages = getValidImages();
    if (validImages.length > 1) {
      setCurrentImageIndex(prev => (prev - 1 + validImages.length) % validImages.length);
    }
  };

  const goToImage = (index) => {
    const validImages = getValidImages();
    if (index >= 0 && index < validImages.length) {
      setCurrentImageIndex(index);
    }
  };

  return {
    images: getValidImages(),
    currentImageIndex,
    currentImage: getValidImages()[currentImageIndex],
    hasImages: getValidImages().length > 0,
    hasMultipleImages: getValidImages().length > 1,
    getImageUrl,
    handleImageError,
    nextImage,
    prevImage,
    goToImage
  };
};
