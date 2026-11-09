import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, ImageOff } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackText?: string;
  containerClassName?: string;
  showPlaceholder?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackText,
  className = '',
  containerClassName = '',
  showPlaceholder = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src) return;

    // Check if IntersectionObserver is available
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        ref={containerRef}
        className={`flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-2 text-center rounded-lg border border-dashed border-zinc-300 ${containerClassName}`}
      >
        <ImageOff className="w-5 h-5 mb-1 text-zinc-400" />
        {fallbackText && (
          <span className="text-[10px] font-medium text-zinc-500 line-clamp-1">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${containerClassName}`}>
      {/* Loading Skeleton */}
      {!isLoaded && showPlaceholder && (
        <div className="absolute inset-0 bg-zinc-200 animate-pulse flex items-center justify-center text-zinc-400">
          <ImageIcon className="w-4 h-4 opacity-40" />
        </div>
      )}

      {/* Optimized Lazy Image with viewport intersection */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};
