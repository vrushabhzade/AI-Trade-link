import React, { useState, useEffect } from 'react';
import { Product, ApiResponse } from '../types';
import { useAuthStore } from '../stores/authStore';
import PricingDashboard from '../components/PricingDashboard';
import PriceAnalysisCard from '../components/PriceAnalysisCard';

const VendorPricingPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch vendor's products
  const fetchProducts = async () => {
    if (!user || user.role !== 'vendor') return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/products/vendor', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<Product[]> = await response.json();

      if (data.success && data.data) {
        setProducts(data.data);
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

  useEffect(() => {
    fetchProducts();
  }, [user, token]);

  const handlePriceUpdate = async (productId: string, newPrice: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ basePrice: newPrice })
      });

      const data: ApiResponse<Product> = await response.json();

      if (data.success && data.data) {
        // Update the product in the list
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, basePrice: newPrice } : p
        ));
        
        // Update selected product if it's the one being updated
        if (selectedProduct?.id === productId) {
          setSelectedProduct({ ...selectedProduct, basePrice: newPrice });
        }

        // Show success message
        alert('Price updated successfully!');
      } else {
        alert(data.error?.message || 'Failed to update price');
      }
    } catch (err) {
      console.error('Price update error:', err);
      alert('Network error. Please try again.');
    }
  };

  const getLocalizedProductName = (product: Product): string => {
    const userLanguage = user?.preferredLanguage || 'en';
    const nameContent = product.name;
    return nameContent[userLanguage] || nameContent.en || Object.values(nameContent)[0] || 'Unknown Product';
  };

  // Redirect if not a vendor
  if (user && user.role !== 'vendor') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only available to vendors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pricing Analytics
        </h1>
        <p className="text-gray-600">
          AI-powered pricing insights and recommendations for your products
        </p>
      </div>

      {/* Pricing Dashboard */}
      <div className="mb-8">
        <PricingDashboard />
      </div>

      {/* Product Selection and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Products</h2>
            
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <div className="text-red-500 text-xl mb-2">⚠️</div>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="text-sm btn-primary"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-600 mb-4">No products found</p>
                <a
                  href="/products/add"
                  className="text-sm btn-primary"
                >
                  Add Your First Product
                </a>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedProduct?.id === product.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getLocalizedProductName(product)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {product.category}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-semibold text-gray-900">
                          ${product.basePrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantityAvailable} in stock
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price Analysis */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <PriceAnalysisCard
              product={selectedProduct}
              onPriceUpdate={(newPrice) => handlePriceUpdate(selectedProduct.id, newPrice)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Product
                </h3>
                <p className="text-gray-600">
                  Choose a product from the list to see detailed pricing analysis and recommendations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          How AI Pricing Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🔍</div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Market Analysis</h3>
              <p className="text-blue-700">
                We analyze competitor prices, local market conditions, and demand patterns.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">AI Recommendations</h3>
              <p className="text-blue-700">
                Our AI provides data-driven pricing suggestions with confidence scores.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">📈</div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Optimize Sales</h3>
              <p className="text-blue-700">
                Balance competitive pricing with profit margins to maximize your revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPricingPage;