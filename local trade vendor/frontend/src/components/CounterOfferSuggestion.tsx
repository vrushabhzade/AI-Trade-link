import React, { useState, useEffect } from 'react';
import { CounterOfferSuggestion as CounterOfferSuggestionType } from '../types';
import { pricingService, CounterOfferRequest } from '../services/pricingService';

interface CounterOfferSuggestionProps {
  request: CounterOfferRequest;
  onAcceptSuggestion?: (price: number, message: string) => void;
  onClose?: () => void;
  className?: string;
}

const CounterOfferSuggestion: React.FC<CounterOfferSuggestionProps> = ({
  request,
  onAcceptSuggestion,
  onClose,
  className = ''
}) => {
  const [suggestion, setSuggestion] = useState<CounterOfferSuggestionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAlternative, setSelectedAlternative] = useState<string>('');

  const fetchSuggestion = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await pricingService.getCounterOfferSuggestion(request);

      if (response.success && response.data) {
        setSuggestion(response.data);
      } else {
        setError(response.error?.message || 'Failed to get counter-offer suggestion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Counter-offer suggestion error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [request]);

  const handleAcceptSuggestion = () => {
    if (suggestion && onAcceptSuggestion) {
      onAcceptSuggestion(suggestion.suggestedPrice, suggestion.messageTemplate);
    }
  };

  const handleAcceptAlternative = () => {
    if (selectedAlternative && onAcceptSuggestion) {
      // For alternatives, we'll use the same price but different message
      onAcceptSuggestion(suggestion?.suggestedPrice || request.currentOffer, selectedAlternative);
    }
  };

  const getAcceptanceProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-green-600 bg-green-50';
    if (probability >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAcceptanceProbabilityIcon = (probability: number) => {
    if (probability >= 70) return '🎯';
    if (probability >= 40) return '⚡';
    return '⚠️';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Suggestion Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={fetchSuggestion}
              className="btn-primary"
            >
              Retry
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Counter-Offer Suggestion</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Negotiation Context */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Initial Price</p>
            <p className="text-gray-900">${request.initialPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Current Offer</p>
            <p className="text-gray-900">${request.currentOffer.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Suggested Counter-Offer */}
      <div className="border-2 border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-primary-700">Recommended Counter-Offer</h4>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAcceptanceProbabilityColor(suggestion.acceptanceProbability)}`}>
            <span className="mr-1">{getAcceptanceProbabilityIcon(suggestion.acceptanceProbability)}</span>
            {suggestion.acceptanceProbability}% acceptance chance
          </span>
        </div>

        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-primary-600 mb-2">
            ${suggestion.suggestedPrice.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            {suggestion.suggestedPrice > request.currentOffer ? 'Higher than current offer' : 
             suggestion.suggestedPrice < request.currentOffer ? 'Lower than current offer' : 
             'Same as current offer'}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Suggested Message:</p>
          <p className="text-sm text-blue-700 italic">"{suggestion.messageTemplate}"</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">AI Reasoning:</p>
          <p className="text-sm text-gray-600">{suggestion.rationale}</p>
        </div>
      </div>

      {/* Alternative Suggestions */}
      {suggestion.alternativeSuggestions && suggestion.alternativeSuggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Alternative Approaches</h4>
          <div className="space-y-2">
            {suggestion.alternativeSuggestions.map((alternative, index) => (
              <label
                key={index}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="alternative"
                  value={alternative}
                  checked={selectedAlternative === alternative}
                  onChange={(e) => setSelectedAlternative(e.target.value)}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{alternative}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleAcceptSuggestion}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors duration-200 font-medium"
        >
          Use Recommended Offer
        </button>
        
        {selectedAlternative && (
          <button
            onClick={handleAcceptAlternative}
            className="flex-1 bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 transition-colors duration-200 font-medium"
          >
            Use Alternative
          </button>
        )}
        
        <button
          onClick={fetchSuggestion}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <span className="font-medium">Note:</span> These are AI-generated suggestions based on market data. 
          Use your judgment and consider your specific business needs when making pricing decisions.
        </p>
      </div>
    </div>
  );
};

export default CounterOfferSuggestion;