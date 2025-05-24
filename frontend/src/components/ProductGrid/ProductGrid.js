import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import LazyImage from '../LazyImage/LazyImage';

const ProductGrid = ({ products, favorites, onFavorite, onAddToCart, loading = false }) => {
  if (loading) {
    // Скелетон для загрузки
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="flex justify-between items-center mb-3">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🌸</div>
        <p className="text-gray-500 text-lg">Товары не найдены</p>
        <p className="text-gray-400 text-sm mt-2">
          Попробуйте изменить фильтры или поисковый запрос
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onFavorite={onFavorite}
          isFavorite={favorites.includes(product.id)}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default ProductGrid;