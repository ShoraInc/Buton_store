import React from 'react';

const Navigation = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'flowers', name: 'Цветы' },
    { id: 'plants', name: 'Комнатные растения' },
    { id: 'sweets', name: 'Сладости' },
    { id: 'toys', name: 'Игрушки' }
  ];

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`transition-colors ${
                activeCategory === category.id 
                  ? 'text-black font-medium border-b-2 border-black' 
                  : 'text-gray-700 hover:text-black'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;