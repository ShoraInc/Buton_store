import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onError = () => {},
  onLoad = () => {} 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  // Intersection Observer для lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  const defaultPlaceholder = (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-1">🌸</div>
        <div className="text-xs">Загрузка...</div>
      </div>
    </div>
  );

  const errorPlaceholder = (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-1">📷</div>
        <div className="text-xs">Ошибка загрузки</div>
      </div>
    </div>
  );

  if (hasError) {
    return errorPlaceholder;
  }

  return (
    <div ref={imgRef} className={className}>
      {!isInView && (placeholder || defaultPlaceholder)}
      {isInView && (
        <>
          {!isLoaded && (placeholder || defaultPlaceholder)}
          <img
            src={src}
            alt={alt}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ display: isLoaded ? 'block' : 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default LazyImage;