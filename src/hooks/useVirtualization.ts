import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVirtualizationOptions {
  totalItems: number;
  itemHeight: number;     
  containerHeight: number; 
  bufferSize?: number;   
}

interface VirtualizationResult {
  visibleItems: { index: number; offsetTop: number }[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
}

export function useVirtualization({
  totalItems,
  itemHeight,
  containerHeight,
  bufferSize = 5,
}: UseVirtualizationOptions): VirtualizationResult {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = totalItems * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + bufferSize * 2);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ index: i, offsetTop: i * itemHeight });
  }

  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return { visibleItems, totalHeight, containerRef, onScroll };
}