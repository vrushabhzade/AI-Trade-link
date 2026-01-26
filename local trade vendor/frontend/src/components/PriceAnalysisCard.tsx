import React, { useState, useEffect } from 'react';
import { PriceAnalysis, Product } from '../types';
import { pricingService } from '../services/pricingService';
import { useAuthStore } from '../stores/authStore';

interface PriceAnalysisCardProps {
  product: Product;
  onPriceUpdate?: (newPrice: number) => void;
  className?: string;
}

const PriceAnalysisCard: React.FC<PriceAnalysisCardProps> = ({
  product,
  onPriceUpdate,
  className = ''
}) => {
  const { user } = useAuthStore();
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await pricingService.analyzePricing({
        productId: product.id,
        location: user?.location?.coordinates,
        radiusKm: 10
      });

      if (response.success && response.data) {
        setAnalysis(response.data);
      } else {
        setError(response.error?.message || 'Failed to analyze pricing');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Price analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [product.id]);

  const handleApplyRecommendation = () => {
    if (analysis && onPriceUpdate) {
      onPriceUpdate(analysis.recommendedPrice);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'below':
        return 'text-green-600 bg-green-50';
      case 'above':
        return 'text-red-600 bg-red-50';
      case 'at':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="btn-primary"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const priceGap = analysis.recommendedPrice - product.basePrice;
  const priceGapPercentage = ((priceGap / product.basePrice) * 100).toFixed(1);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price Analysis</h3>
        <span className={`text-sm font-medium px-2 py-1 rounded ${getConfidenceColor(analysis.confidenceScore)}`}>
          {analysis.confidenceScore}% confidence
        </span>
      </div>

      {/* Current vs Recommended Price */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Current Price</p>
          <p className="text-2xl font-bold text-gray-900">
            {product.currency} {product.basePrice.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Recommended Price</p>
          <p className="text-2xl font-bold text-primary-600">
            {product.currency} {analysis.recommendedPrice.toFixed(2)}
          </p>
          {priceGap !== 0 && (
            <p className={`text-sm ${priceGap > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceGap > 0 ? '+' : ''}{product.currency} {priceGap.toFixed(2)} ({priceGapPercentage}%)
            </p>
          )}
        </div>
      </div>

      {/* Market Insights */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Market Position</p>
          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPositionColor(analysis.marketInsights.pricePosition)}`}>
            {analysis.marketInsights.pricePosition === 'below' && '📉 Below Market'}
            {analysis.marketInsights.pricePosition === 'at' && '📊 At Market'}
            {analysis.marketInsights.pricePosition === 'above' && '📈 Above Market'}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Demand Level</p>
          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getDemandColor(analysis.marketInsights.demandLevel)}`}>
            {analysis.marketInsights.demandLevel === 'high' && '🔥 High Demand'}
            {analysis.marketInsights.demandLevel === 'medium' && '📊 Medium Demand'}
            {analysis.marketInsights.demandLevel === 'low' && '📉 Low Demand'}
          </span>
        </div>
      </div>

      {/* Negotiation Range */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Negotiation Range</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {product.currency} {analysis.negotiationRange.min.toFixed(2)}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
            <div 
              className="bg-primary-600 h-2 rounded-full"
              style={{ 
                width: '100%',
                background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
              }}
            ></div>
            <div 
              className="absolute top-0 w-1 h-2 bg-white border border-gray-400 rounded-full"
              style={{ 
                left: `${((product.basePrice - analysis.negotiationRange.min) / (analysis.negotiationRange.max - analysis.negotiationRange.min)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {product.currency} {analysis.negotiationRange.max.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">Analysis Details</span>
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">{analysis.reasoning}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Competitors</p>
                <p className="text-gray-600">{analysis.marketInsights.competitorCount} found</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Avg. Competitor Price</p>
                <p className="text-gray-600">
                  {product.currency} {analysis.marketInsights.averageCompetitorPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {onPriceUpdate && Math.abs(priceGap) > 0.01 && (
        <div className="flex space-x-3">
          <button
            onClick={handleApplyRecommendation}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
          >
            Apply Recommendation
          </button>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default PriceAnalysisCard;