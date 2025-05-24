import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, showLoadMore, onLoadMore }) => {
  if (showLoadMore) {
    return (
      <div className="flex justify-center">
        <button 
          onClick={onLoadMore}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Показать еще
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === page
              ? 'bg-black text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

export default Pagination;