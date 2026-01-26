/**
 * Frontend Performance Optimization Utilities
 * Implements lazy loading, code splitting, and caching strategies
 * Requirements: System performance optimization
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy load components with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load component (attempt ${i + 1}/${retries}):`, error);
        
        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError || new Error('Failed to load component after retries');
  });
}

/**
 * Debounce function for search and input optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll and resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Image lazy loading with Intersection Observer
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.01,
          ...options,
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
    }
    if (srcset) {
      img.srcset = srcset;
    }

    img.classList.add('loaded');
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Local storage with expiration
 */
export class CachedStorage {
  private prefix: string;

  constructor(prefix: string = 'tradelink_') {
    this.prefix = prefix;
  }

  set(key: string, value: any, expirationMinutes?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationMinutes
        ? Date.now() + expirationMinutes * 60 * 1000
        : null,
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);

      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        this.remove(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(key?: string): void {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }
}

/**
 * Virtual scrolling helper for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): { start: number; end: number; offsetY: number } {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  const offsetY = start * itemHeight;

  return { start, end, offsetY };
}

/**
 * Preload critical resources
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(name?: string): void {
    if (name) {
      this.marks.delete(name);
    } else {
      this.marks.clear();
    }
  }
}

// Singleton instances
export const cachedStorage = new CachedStorage();
export const requestDeduplicator = new RequestDeduplicator();
export const performanceMonitor = new PerformanceMonitor();
export const imageLazyLoader = new ImageLazyLoader();
