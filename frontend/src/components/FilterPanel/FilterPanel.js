import React from 'react';

const FilterPanel = ({ filters, onFilterChange, categories }) => {
  const filterButtons = [
    { key: 'discount', label: 'По скидке' },
    { key: 'new', label: 'Новинки' },
    { key: 'ready', label: 'Готовые' },
    { key: 'budget', label: 'Бюджетные' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {filterButtons.map(button => (
          <button 
            key={button.key}
            onClick={() => onFilterChange(button.key, !filters[button.key])}
            className={`px-4 py-2 rounded-full border transition-colors ${
              filters[button.key] 
                ? 'bg-black text-white' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
      
      {/* Категории */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('category', '')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !filters.category ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Все
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onFilterChange('category', category)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filters.category === category 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;