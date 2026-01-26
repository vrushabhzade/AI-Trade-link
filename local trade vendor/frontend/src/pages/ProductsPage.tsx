import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductFilters, ApiResponse } from '../types';
import { useAuthStore } from '../stores/authStore';
import { negotiationService } from '../services/negotiationService';
import ProductCard from '../components/ProductCard';
import ProductSearch from '../components/ProductSearch';

const ProductsPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [negotiationLoading, setNegotiationLoading] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
    language: user?.preferredLanguage || 'en'
  });

  // Fetch products based on filters
  const fetchProducts = async (filters: ProductFilters) => {
    setLoading(true);
    setError('');
    
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters
      queryParams.append('language', filters.language);
      if (filters.search) queryParams.append('query', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
      
      // Add location parameters
      if (filters.location) {
        queryParams.append('latitude', filters.location[1].toString());
        queryParams.append('longitude', filters.location[0].toString());
        if (filters.radius) queryParams.append('radius', filters.radius.toString());
      }

      const response = await fetch(`/api/products?${queryParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data: ApiResponse<Product[]> = await response.json();

      if (data.success && data.data) {
        setProducts(data.data);
        setCurrentFilters(filters);
      } else {
        setError(data.error?.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(currentFilters);
  }, [user?.preferredLanguage]);

  const handleSearch = (filters: ProductFilters) => {
    fetchProducts(filters);
  };

  const handleAddToCart = (productId: string, quantity: number) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', productId, quantity);
    // For now, just show an alert
    alert(`Added ${quantity} item(s) to cart! (Cart functionality coming soon)`);
  };

  const handleStartNegotiation = async (productId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setNegotiationLoading(productId);
      
      // Find the product to get its base price
      const product = products.find(p => p.id === productId);
      if (!product) {
        alert('Product not found');
        return;
      }

      // Create negotiation with base price as initial offer
      await negotiationService.createNegotiation({
        productId,
        initialPrice: product.basePrice,
        buyerLanguage: user.preferredLanguage,
        vendorLanguage: 'en', // Default, will be updated by backend
        message: `Hi! I'm interested in your ${product.name.en || Object.values(product.name)[0]}. Would you consider this price?`
      });

      // Navigate to negotiations page
      navigate('/negotiations');
      
      // Show success message
      alert('Negotiation started successfully! Check your negotiations page.');
    } catch (error) {
      console.error('Failed to start negotiation:', error);
      alert('Failed to start negotiation. Please try again.');
    } finally {
      setNegotiationLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Product Marketplace
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Discover products from local vendors with multilingual support and smart search
        </p>
      </div>

      {/* Search Interface */}
      <ProductSearch
        onSearch={handleSearch}
        loading={loading}
        initialFilters={currentFilters}
      />

      {/* Results Summary */}
      {!loading && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-sm sm:text-base text-gray-600">
            {products.length === 0 ? 'No products found' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            {currentFilters.location && ' near your location'}
          </p>
          
          {currentFilters.search && (
            <p className="text-xs sm:text-sm text-gray-500">
              Searching for: "<span className="font-medium">{currentFilters.search}</span>"
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="flex">
            <span className="text-red-400 mr-2">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-sm sm:text-base text-gray-600">Searching for products...</p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onStartNegotiation={negotiationLoading === product.id ? undefined : handleStartNegotiation}
              showDistance={!!currentFilters.location}
              distance={product.distance} // This would come from the API response
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-5xl sm:text-6xl mb-4">🔍</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
            Try adjusting your search criteria or browse all categories
          </p>
          <button
            onClick={() => handleSearch({ language: user?.preferredLanguage || 'en' })}
            className="btn-primary"
          >
            Show All Products
          </button>
        </div>
      )}

      {/* Popular Categories */}
      {!loading && products.length === 0 && !currentFilters.search && !error && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {['electronics', 'clothing', 'food', 'books', 'home'].map((category) => (
              <button
                key={category}
                onClick={() => handleSearch({ ...currentFilters, category })}
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100 transition-colors duration-200 text-center touch-manipulation"
              >
                <div className="text-xl sm:text-2xl mb-2">
                  {category === 'electronics' && '📱'}
                  {category === 'clothing' && '👕'}
                  {category === 'food' && '🍎'}
                  {category === 'books' && '📚'}
                  {category === 'home' && '🏠'}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;