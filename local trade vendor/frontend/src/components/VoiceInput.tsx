import React, { useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { extractPrices, getPrimaryPrice } from '../utils/priceExtraction';

interface VoiceInputProps {
  language?: string;
  onTranscript: (text: string) => void;
  onPriceDetected?: (amount: number, currency?: string) => void;
  className?: string;
  buttonClassName?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  language = 'en-US',
  onTranscript,
  onPriceDetected,
  className = '',
  buttonClassName = ''
}) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceInput({
    language,
    continuous: false,
    interimResults: true
  });

  // Handle transcript completion
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
      
      // Extract and notify about prices
      const prices = extractPrices(transcript);
      if (prices.length > 0 && onPriceDetected) {
        const primaryPrice = getPrimaryPrice(prices);
        if (primaryPrice) {
          onPriceDetected(primaryPrice.amount, primaryPrice.currency);
        }
      }
      
      resetTranscript();
    }
  }, [transcript, isListening, onTranscript, onPriceDetected, resetTranscript]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        disabled={!!error && error.includes('not supported')}
        className={`
          ${buttonClassName}
          ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-200 hover:bg-gray-300'}
          ${error && !isListening ? 'bg-red-100 text-red-600' : ''}
          transition-all duration-200
        `}
        title={isListening ? 'Stop recording' : 'Start voice input'}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </button>

      {/* Interim transcript display */}
      {(isListening || interimTranscript) && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-sm rounded shadow-lg max-w-xs">
          {isListening && !interimTranscript && (
            <span className="text-gray-400">Listening...</span>
          )}
          {interimTranscript && (
            <span>{interimTranscript}</span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && !isListening && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-red-100 text-red-800 text-xs rounded shadow-lg max-w-xs z-10">
          {error}
        </div>
      )}
    </div>
  );
};
