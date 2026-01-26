import React, { useState, useEffect } from 'react';
import { pricingService, PricingInsightsResponse } from '../services/pricingService';
import { useAuthStore } from '../stores/authStore';

interface PricingDashboardProps {
  vendorId?: string;
  className?: string;
}

const PricingDashboard: React.FC<PricingDashboardProps> = ({
  vendorId,
  className = ''
}) => {
  const { user } = useAuthStore();
  const [insights, setInsights] = useState<PricingInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await pricingService.getPricingInsights(
        vendorId,
        selectedCategory || undefined,
        timeframe
      );

      if (response.success && response.data) {
        setInsights(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch pricing insights');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Pricing insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [vendorId, selectedCategory, timeframe]);

  const getLocalizedProductName = (productName: Record<string, string>): string => {
    const userLanguage = user?.preferredLanguage || 'en';
    return productName[userLanguage] || productName.en || Object.values(productName)[0] || 'Unknown Product';
  };

  const getPriceGapColor = (gap: number) => {
    if (gap > 1) return 'text-green-600 bg-green-50';
    if (gap < -1) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'below': return '📉';
      case 'above': return '📈';
      case 'at': return '📊';
      default: return '❓';
    }
  };

  const getDemandIcon = (level: string) => {
    switch (level) {
      case 'high': return '🔥';
      case 'medium': return '📊';
      case 'low': return '📉';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-3xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Insights</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInsights}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const categories = [...new Set(insights.insights.map(insight => insight.category))];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Pricing Dashboard</h2>
        <div className="flex space-x-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          {/* Timeframe Filter */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📦</div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{insights.summary.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm text-green-600 font-medium">Underpriced</p>
              <p className="text-2xl font-bold text-green-900">{insights.summary.underpriced}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📉</div>
            <div>
              <p className="text-sm text-red-600 font-medium">Overpriced</p>
              <p className="text-2xl font-bold text-red-900">{insights.summary.overpriced}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg. Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.summary.averageConfidence.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Insights Table */}
      {insights.insights.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {insights.insights.map((insight) => (
                <tr key={insight.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getLocalizedProductName(insight.productName)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {insight.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${insight.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                    ${insight.recommendedPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriceGapColor(insight.priceGap)}`}>
                      {insight.priceGap > 0 ? '+' : ''}${insight.priceGap.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="flex items-center">
                      <span className="mr-1">{getPositionIcon(insight.marketPosition)}</span>
                      {insight.marketPosition}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="flex items-center">
                      <span className="mr-1">{getDemandIcon(insight.demandLevel)}</span>
                      {insight.demandLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            insight.confidenceScore >= 80 ? 'bg-green-500' :
                            insight.confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${insight.confidenceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {insight.confidenceScore.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">
            {selectedCategory 
              ? `No products found in the ${selectedCategory} category.`
              : 'Add some products to see pricing insights.'
            }
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchInsights}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default PricingDashboard;