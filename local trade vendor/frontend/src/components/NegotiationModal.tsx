import React, { useState, useEffect } from 'react';
import { 
  Negotiation, 
  CounterOfferSuggestion, 
  PriceOffer, 
  NegotiationTimeline 
} from '../types';
import { negotiationService } from '../services/negotiationService';
import AISuggestionCard from './AISuggestionCard';

interface NegotiationModalProps {
  negotiation: Negotiation;
  userRole: 'buyer' | 'vendor';
  onClose: () => void;
  onUpdate: (negotiation: Negotiation) => void;
}

const NegotiationModal: React.FC<NegotiationModalProps> = ({
  negotiation,
  userRole,
  onClose,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'timeline' | 'suggestions'>('overview');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CounterOfferSuggestion | null>(null);
  const [offerHistory, setOfferHistory] = useState<PriceOffer[]>([]);
  const [timeline, setTimeline] = useState<NegotiationTimeline[]>([]);
  const [counterOfferAmount, setCounterOfferAmount] = useState<string>('');
  const [counterOfferMessage, setCounterOfferMessage] = useState<string>('');
  const [showCounterOfferForm, setShowCounterOfferForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'suggestions' && !suggestions) {
      loadSuggestions();
    } else if (activeTab === 'offers' && offerHistory.length === 0) {
      loadOfferHistory();
    } else if (activeTab === 'timeline' && timeline.length === 0) {
      loadTimeline();
    }
  }, [activeTab]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestionsData = await negotiationService.getSuggestions(negotiation.id);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOfferHistory = async () => {
    try {
      setLoading(true);
      const offers = await negotiationService.getPriceOfferHistory(negotiation.id);
      setOfferHistory(offers);
    } catch (error) {
      console.error('Failed to load offer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const timelineData = await negotiationService.getNegotiationTimeline(negotiation.id);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!counterOfferAmount) return;

    try {
      setLoading(true);
      const updatedNegotiation = await negotiationService.makeCounterOffer(negotiation.id, {
        amount: parseFloat(counterOfferAmount),
        message: counterOfferMessage || undefined
      });
      
      onUpdate(updatedNegotiation);
      setShowCounterOfferForm(false);
      setCounterOfferAmount('');
      setCounterOfferMessage('');
    } catch (error) {
      console.error('Failed to make counter offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      const updatedNegotiation = await negotiationService.acceptNegotiation(negotiation.id, {
        finalPrice: negotiation.currentOffer
      });
      onUpdate(updatedNegotiation);
    } catch (error) {
      console.error('Failed to accept negotiation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const updatedNegotiation = await negotiationService.rejectNegotiation(negotiation.id, {});
      onUpdate(updatedNegotiation);
    } catch (error) {
      console.error('Failed to reject negotiation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = () => {
    if (!negotiation.product?.name) return 'Unknown Product';
    return negotiation.product.name.en || 
           negotiation.product.name[Object.keys(negotiation.product.name)[0]] || 
           'Unknown Product';
  };

  const getOtherPartyName = () => {
    if (userRole === 'buyer') {
      return negotiation.vendor?.businessName?.en || 
             negotiation.vendor?.user?.fullName || 
             'Unknown Vendor';
    } else {
      return negotiation.buyer?.fullName || 'Unknown Buyer';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {getProductName()}
            </h2>
            <p className="text-sm text-gray-600">
              Negotiation with {getOtherPartyName()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'offers', label: 'Offer History' },
              { key: 'timeline', label: 'Timeline' },
              { key: 'suggestions', label: 'AI Suggestions' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Price Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    negotiationService.getStatusColor(negotiation.status)
                  }`}>
                    {negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Current Offer</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {negotiationService.formatPrice(negotiation.currentOffer, negotiation.product?.currency)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Time Remaining</h3>
                  <p className="text-sm text-gray-600">
                    {negotiation.expiresAt ? negotiationService.getTimeRemaining(negotiation.expiresAt) : 'No expiration'}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              {negotiation.product && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Product Details</h3>
                  <div className="flex space-x-4">
                    {negotiation.product.images?.[0] && (
                      <img
                        src={negotiation.product.images[0]}
                        alt={getProductName()}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{getProductName()}</p>
                      <p className="text-sm text-gray-600">Category: {negotiation.product.category}</p>
                      <p className="text-sm text-gray-600">
                        Base Price: {negotiationService.formatPrice(negotiation.product.basePrice, negotiation.product.currency)}
                      </p>
                      <p className="text-sm text-gray-600">Unit: {negotiation.product.unit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {negotiation.status === 'active' && (
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAccept}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Accept Current Offer
                    </button>
                    <button
                      onClick={() => setShowCounterOfferForm(!showCounterOfferForm)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Make Counter Offer
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>

                  {/* Counter Offer Form */}
                  {showCounterOfferForm && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Make Counter Offer</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Offer Amount ({negotiation.product?.currency || 'USD'})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={counterOfferAmount}
                            onChange={(e) => setCounterOfferAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your offer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message (Optional)
                          </label>
                          <input
                            type="text"
                            value={counterOfferMessage}
                            onChange={(e) => setCounterOfferMessage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add a message with your offer"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCounterOffer}
                          disabled={loading || !counterOfferAmount}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          {loading ? 'Sending...' : 'Send Counter Offer'}
                        </button>
                        <button
                          onClick={() => setShowCounterOfferForm(false)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Price Offer History</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : offerHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No offers yet</p>
              ) : (
                <div className="space-y-3">
                  {offerHistory.map((offer) => (
                    <div key={offer.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {negotiationService.formatPrice(offer.priceOffer, negotiation.product?.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            by {offer.senderName} • {offer.messageType.replace('_', ' ')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(offer.createdAt).toLocaleDateString()} at{' '}
                          {new Date(offer.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Negotiation Timeline</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No timeline events</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => (
                    <div key={event.id} className="flex space-x-4">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        event.type === 'offer' ? 'bg-blue-500' :
                        event.type === 'status_change' ? 'bg-green-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.description}</p>
                        {event.senderName && (
                          <p className="text-xs text-gray-600">by {event.senderName}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleDateString()} at{' '}
                          {new Date(event.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">AI Suggestions</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : suggestions ? (
                <AISuggestionCard
                  suggestion={suggestions}
                  onApplySuggestion={(price, message) => {
                    setCounterOfferAmount(price.toString());
                    setCounterOfferMessage(message);
                    setActiveTab('overview');
                    setShowCounterOfferForm(true);
                  }}
                />
              ) : (
                <p className="text-gray-600 text-center py-8">
                  AI suggestions are not available for this negotiation
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NegotiationModal;