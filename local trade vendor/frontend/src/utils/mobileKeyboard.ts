/**
 * Mobile keyboard optimization utilities
 */

/**
 * Get appropriate input type for mobile keyboards
 */
export const getInputType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    email: 'email',
    phone: 'tel',
    number: 'number',
    decimal: 'decimal',
    url: 'url',
    search: 'search',
    password: 'password',
    text: 'text'
  };
  
  return typeMap[fieldType] || 'text';
};

/**
 * Get appropriate inputMode for mobile keyboards
 */
export const getInputMode = (fieldType: string): string => {
  const modeMap: Record<string, string> = {
    email: 'email',
    phone: 'tel',
    number: 'numeric',
    decimal: 'decimal',
    url: 'url',
    search: 'search',
    text: 'text'
  };
  
  return modeMap[fieldType] || 'text';
};

/**
 * Get appropriate autocomplete attribute
 */
export const getAutocomplete = (fieldName: string): string => {
  const autocompleteMap: Record<string, string> = {
    email: 'email',
    phone: 'tel',
    name: 'name',
    'first-name': 'given-name',
    'last-name': 'family-name',
    address: 'street-address',
    city: 'address-level2',
    state: 'address-level1',
    zip: 'postal-code',
    country: 'country-name',
    'credit-card': 'cc-number',
    'card-name': 'cc-name',
    'card-expiry': 'cc-exp',
    'card-cvc': 'cc-csc',
    username: 'username',
    password: 'current-password',
    'new-password': 'new-password'
  };
  
  return autocompleteMap[fieldName] || 'off';
};

/**
 * Scroll element into view when keyboard appears
 */
export const scrollIntoViewOnFocus = (element: HTMLElement) => {
  if (!element) return;
  
  // Delay to allow keyboard to appear
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 300);
};

/**
 * Prevent zoom on input focus (iOS)
 */
export const preventZoomOnFocus = () => {
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    viewport.setAttribute('content', content + ', maximum-scale=1.0');
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return value;
};

/**
 * Format currency input
 */
export const formatCurrency = (value: string, currency: string = 'USD'): string => {
  const number = parseFloat(value.replace(/[^0-9.]/g, ''));
  
  if (isNaN(number)) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(number);
};

/**
 * Detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if device has touch support
 */
export const hasTouchSupport = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Get safe area insets for notched devices
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
  };
};
