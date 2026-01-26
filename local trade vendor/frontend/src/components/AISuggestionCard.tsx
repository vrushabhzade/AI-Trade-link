import React from 'react';
import { CounterOfferSuggestion } from '../types';

interface AISuggestionCardProps {
  suggestion: CounterOfferSuggestion;
  onApplySuggestion: (price: number, message: string) => void;
}

const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  suggestion,
  onApplySuggestion
}) => {
  const getAcceptanceProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-100';
    if (probability >= 60) return 'text-yellow-600 bg-yellow-100';
    if (probability >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getAcceptanceProbabilityIcon = (probability: number) => {
    if (probability >= 80) return '🎯';
    if (probability >= 60) return '👍';
    if (probability >= 40) return '⚠️';
    return '❌';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="bg-blue-600 rounded-full p-2 mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendation</h3>
          <p className="text-sm text-gray-600">Based on market analysis and negotiation patterns</p>
        </div>
      </div>

      {/* Main Suggestion */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Suggested Price: ${suggestion.suggestedPrice.toFixed(2)}
            </h4>
            <p className="text-sm text-gray-600">Recommended counter-offer amount</p>
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            getAcceptanceProbabilityColor(suggestion.acceptanceProbability)
          }`}>
            <span className="mr-1">{getAcceptanceProbabilityIcon(suggestion.acceptanceProbability)}</span>
            {suggestion.acceptanceProbability}% acceptance chance
          </div>
        </div>

        {/* Message Template */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested Message:</h5>
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 italic">
            "{suggestion.messageTemplate}"
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">AI Reasoning:</h5>
          <p className="text-sm text-gray-600">{suggestion.rationale}</p>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => onApplySuggestion(suggestion.suggestedPrice, suggestion.messageTemplate)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          Apply This Suggestion
        </button>
      </div>

      {/* Alternative Suggestions */}
      {suggestion.alternativeSuggestions && suggestion.alternativeSuggestions.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Alternative Strategies:</h5>
          <div className="space-y-2">
            {suggestion.alternativeSuggestions.map((alternative, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-600 flex-1">{alternative}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> AI suggestions are based on market data and patterns. 
              Use your judgment and consider your specific situation when making decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionCard;