import React, { useState, useEffect } from 'react';
import { ProductFilters } from '../types';
import { useAuthStore } from '../stores/authStore';
import { VoiceInput } from './VoiceInput';

interface ProductSearchProps {
  onSearch: (filters: ProductFilters) => void;
  loading?: boolean;
  initialFilters?: Partial<ProductFilters>;
}

const CATEGORIES = [
  'electronics',
  'clothing',
  'food',
  'books',
  'home',
  'sports',
  'beauty',
  'automotive',
  'toys',
  'other'
];

const ProductSearch: React.FC<ProductSearchProps> = ({
  onSearch,
  loading = false,
  initialFilters = {}
}) => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() || '');
  const [radius, setRadius] = useState(initialFilters.radius?.toString() || '10');
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  // Get user's location
  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          setLocationError('');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError('Unable to get your location. Please enable location services.');
          setUseLocation(false);
        }
      );
    }
  }, [useLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: ProductFilters = {
      language: user?.preferredLanguage || 'en',
      search: searchQuery.trim() || undefined,
      category: category || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };

    // Add location filter if enabled and available
    if (useLocation && userLocation) {
      filters.location = userLocation;
      filters.radius = parseFloat(radius);
    }

    onSearch(filters);
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setRadius('10');
    setUseLocation(false);
    setUserLocation(null);
    setLocationError('');
    
    onSearch({
      language: user?.preferredLanguage || 'en'
    });
  };

  const handleVoiceSearch = (transcript: string) => {
    setSearchQuery(transcript);
  };

  const getLanguageCode = (preferredLanguage: string): string => {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'hi': 'hi-IN',
      'ar': 'ar-SA',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'pt': 'pt-BR',
      'ru': 'ru-RU'
    };
    return languageMap[preferredLanguage] || 'en-US';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Query */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <div className="relative flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products or use voice..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            <VoiceInput
              language={getLanguageCode(user?.preferredLanguage || 'en')}
              onTranscript={handleVoiceSearch}
              buttonClassName="px-3 py-2 rounded-md border border-gray-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              id="minPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              id="maxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="1000"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius (km)
            </label>
            <input
              type="number"
              id="radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="10"
              min="1"
              max="100"
              disabled={!useLocation}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Location Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useLocation"
            checked={useLocation}
            onChange={(e) => setUseLocation(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="useLocation" className="text-sm text-gray-700">
            Search near my location
          </label>
          {useLocation && userLocation && (
            <span className="text-xs text-green-600">📍 Location detected</span>
          )}
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {locationError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Searching...
              </span>
            ) : (
              'Search Products'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductSearch;