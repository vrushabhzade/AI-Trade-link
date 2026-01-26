import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage, NegotiationDetails, TypingIndicator } from '../services/chatService';
import { useAuthStore } from '../stores/authStore';
import { VoiceInput } from './VoiceInput';
import { extractPrices, highlightPrices } from '../utils/priceExtraction';

interface ChatWindowProps {
  negotiationId: string;
  onClose?: () => void;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  negotiationId, 
  onClose,
  className = ''
}) => {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [negotiationDetails, setNegotiationDetails] = useState<NegotiationDetails | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [priceOffer, setPriceOffer] = useState('');
  const [showPriceOffer, setShowPriceOffer] = useState(false);
  const [detectedPrices, setDetectedPrices] = useState<Array<{ amount: number; currency?: string }>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || !token) return;

    // Authenticate with chat service
    chatService.authenticate(token, user.id, user.preferredLanguage);

    // Load negotiation details and messages
    loadNegotiationData();

    // Join the negotiation room
    chatService.joinNegotiation(negotiationId);

    // Set up event listeners
    const unsubscribeMessage = chatService.onMessage(handleNewMessage);
    const unsubscribeTyping = chatService.onTyping(handleTypingIndicator);
    const unsubscribeError = chatService.onError(handleError);

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeError();
      chatService.leaveNegotiation(negotiationId);
    };
  }, [negotiationId, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadNegotiationData = async () => {
    try {
      setIsLoading(true);
      const [details, messageHistory] = await Promise.all([
        chatService.getNegotiationDetails(negotiationId),
        chatService.getMessages(negotiationId, user?.preferredLanguage)
      ]);
      
      setNegotiationDetails(details);
      setMessages(messageHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTypingIndicator = (typing: TypingIndicator) => {
    if (typing.negotiationId === negotiationId && typing.userId !== user?.id) {
      setOtherUserTyping(typing.isTyping);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !negotiationDetails || !user) return;

    const targetLanguage = negotiationDetails.otherParty.language;
    const priceOfferAmount = showPriceOffer && priceOffer ? parseFloat(priceOffer) : undefined;

    chatService.sendMessage(negotiationId, newMessage, targetLanguage, priceOfferAmount);
    
    setNewMessage('');
    setPriceOffer('');
    setShowPriceOffer(false);
    chatService.stopTyping(negotiationId);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Extract prices from the input
    const prices = extractPrices(value);
    if (prices.length > 0) {
      setDetectedPrices(prices.map(p => ({ amount: p.amount, currency: p.currency })));
    } else {
      setDetectedPrices([]);
    }
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      chatService.startTyping(negotiationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.stopTyping(negotiationId);
    }, 1000);
  };

  const sendPriceOffer = () => {
    if (!priceOffer || !negotiationDetails) return;

    const amount = parseFloat(priceOffer);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const message = `I'd like to offer ${amount} ${negotiationDetails.product.currency} for this item.`;
    chatService.sendPriceOffer(negotiationId, amount, message);
    
    setPriceOffer('');
    setShowPriceOffer(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to current message
    const newText = newMessage ? `${newMessage} ${transcript}` : transcript;
    handleInputChange(newText);
  };

  const handlePriceDetected = (amount: number) => {
    // Auto-fill price offer if detected
    setPriceOffer(amount.toString());
    setShowPriceOffer(true);
  };

  const getLanguageCode = (preferredLanguage: string): string => {
    // Map common language codes to Web Speech API format
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

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat(user?.preferredLanguage || 'en', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'offer':
      case 'counter_offer':
        return '💰';
      case 'acceptance':
        return '✅';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading chat...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button 
            onClick={loadNegotiationData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!negotiationDetails) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-600">
          Negotiation details not available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {negotiationDetails.otherParty.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {negotiationDetails.otherParty.name}
            </h3>
            <p className="text-sm text-gray-500">
              {negotiationDetails.product.name[user?.preferredLanguage || 'en'] || 
               Object.values(negotiationDetails.product.name)[0]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-3 py-1 text-xs rounded-full ${
              showTranslation 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            🌐 Translation {showTranslation ? 'ON' : 'OFF'}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isFromCurrentUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-1 mb-1">
                {getMessageTypeIcon(message.messageType)}
                <span className="text-xs opacity-75">
                  {message.senderName} • {formatTimestamp(message.createdAt)}
                </span>
              </div>
              
              <p className="text-sm">
                {showTranslation ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightPrices(message.displayText, 'font-semibold underline') 
                  }} />
                ) : (
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightPrices(message.originalText, 'font-semibold underline') 
                  }} />
                )}
              </p>
              
              {message.priceOffer && (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
                  💰 Price Offer: {message.priceOffer} {negotiationDetails.product.currency}
                </div>
              )}
              
              {!showTranslation && message.originalLanguage !== user?.preferredLanguage && (
                <div className="text-xs opacity-75 mt-1">
                  Original language: {message.originalLanguage}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
              <span className="animate-pulse">
                {negotiationDetails.otherParty.name} is typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Price Offer Section */}
      {showPriceOffer && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-yellow-800">💰 Price Offer:</span>
            <input
              type="number"
              value={priceOffer}
              onChange={(e) => setPriceOffer(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 px-2 py-1 border border-yellow-300 rounded text-sm"
              step="0.01"
              min="0"
            />
            <span className="text-sm text-yellow-800">
              {negotiationDetails.product.currency}
            </span>
            <button
              onClick={sendPriceOffer}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              Send
            </button>
            <button
              onClick={() => setShowPriceOffer(false)}
              className="px-2 py-1 text-yellow-600 hover:text-yellow-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Price detection notification */}
        {detectedPrices.length > 0 && !showPriceOffer && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <span className="text-blue-800">
              💰 Price detected: {detectedPrices.map(p => 
                `${p.amount} ${p.currency || negotiationDetails?.product.currency || ''}`
              ).join(', ')}
            </span>
            <button
              onClick={() => {
                const primaryPrice = detectedPrices[0];
                setPriceOffer(primaryPrice.amount.toString());
                setShowPriceOffer(true);
              }}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Make offer
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPriceOffer(!showPriceOffer)}
            className="px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Make price offer"
          >
            💰
          </button>
          
          <VoiceInput
            language={getLanguageCode(user?.preferredLanguage || 'en')}
            onTranscript={handleVoiceTranscript}
            onPriceDetected={handlePriceDetected}
            buttonClassName="px-3 py-2 rounded"
          />
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message or use voice..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {showTranslation && (
            <span>
              Messages will be translated to {negotiationDetails?.otherParty.language}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};