import React from 'react';
import { Product } from '../types';
import { useAuthStore } from '../stores/authStore';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string, quantity: number) => void;
  onStartNegotiation?: (productId: string) => void;
  showDistance?: boolean;
  distance?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onStartNegotiation,
  showDistance = false,
  distance
}) => {
  const { user } = useAuthStore();
  const userLanguage = user?.preferredLanguage || 'en';

  // Get localized content with fallback
  const getLocalizedText = (content: Record<string, string>, fallbackKey: string = 'en'): string => {
    return content[userLanguage] || content[fallbackKey] || Object.values(content)[0] || '';
  };

  const productName = getLocalizedText(product.name);
  const productDescription = getLocalizedText(product.description);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id, 1);
    }
  };

  const handleStartNegotiation = () => {
    if (onStartNegotiation) {
      onStartNegotiation(product.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">📦</span>
          </div>
        )}
        
        {/* Distance badge */}
        {showDistance && distance !== undefined && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </div>
        )}

        {/* Stock status */}
        {product.quantityAvailable === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {productName}
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.category}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {productDescription}
        </p>

        {/* Price and Unit */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-primary-600">
              {product.currency} {product.basePrice.toFixed(2)}
            </span>
            {product.unit && (
              <span className="text-gray-500 text-sm ml-1">
                / {product.unit}
              </span>
            )}
          </div>
          
          {product.quantityAvailable > 0 && (
            <span className="text-sm text-gray-500">
              {product.quantityAvailable} available
            </span>
          )}
        </div>

        {/* Product Attributes */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {Object.entries(product.attributes).slice(0, 3).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {key}: {String(value)}
                </span>
              ))}
              {Object.keys(product.attributes).length > 3 && (
                <span className="text-xs text-gray-500">
                  +{Object.keys(product.attributes).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {product.quantityAvailable > 0 ? (
            <>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                disabled={!onAddToCart}
              >
                Add to Cart
              </button>
              <button
                onClick={handleStartNegotiation}
                className="flex-1 bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 transition-colors duration-200 text-sm font-medium"
                disabled={!onStartNegotiation}
              >
                Negotiate
              </button>
            </>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed text-sm font-medium"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;