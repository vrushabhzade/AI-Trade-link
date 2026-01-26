import React, { useState } from 'react';
import { Negotiation } from '../types';
import { negotiationService } from '../services/negotiationService';
import NegotiationModal from './NegotiationModal';

interface NegotiationCardProps {
  negotiation: Negotiation;
  userRole: 'buyer' | 'vendor';
  onUpdate: (negotiation: Negotiation) => void;
}

const NegotiationCard: React.FC<NegotiationCardProps> = ({
  negotiation,
  userRole,
  onUpdate
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getProductName = (product: any) => {
    if (!product?.name) return 'Unknown Product';
    return product.name.en || product.name[Object.keys(product.name)[0]] || 'Unknown Product';
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

  const handleQuickAction = async (action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      let updatedNegotiation: Negotiation;
      
      if (action === 'accept') {
        updatedNegotiation = await negotiationService.acceptNegotiation(negotiation.id, {
          finalPrice: negotiation.currentOffer
        });
      } else {
        updatedNegotiation = await negotiationService.rejectNegotiation(negotiation.id, {});
      }
      
      onUpdate(updatedNegotiation);
    } catch (error) {
      console.error(`Failed to ${action} negotiation:`, error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusColors = negotiationService.getStatusColor(negotiation.status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors}`}>
        {negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
      </span>
    );
  };

  const getPriceMovement = () => {
    const initial = negotiation.initialPrice;
    const current = negotiation.currentOffer;
    const difference = current - initial;
    const percentage = ((difference / initial) * 100).toFixed(1);
    
    if (difference === 0) return null;
    
    return (
      <div className={`flex items-center text-sm ${
        difference > 0 ? 'text-red-600' : 'text-green-600'
      }`}>
        {difference > 0 ? '↗' : '↘'}
        <span className="ml-1">
          {negotiationService.formatPrice(Math.abs(difference), negotiation.product?.currency || 'USD')} 
          ({percentage}%)
        </span>
      </div>
    );
  };

  const getTimeRemaining = () => {
    if (negotiation.status !== 'active' || !negotiation.expiresAt) return null;
    
    const remaining = negotiationService.getTimeRemaining(negotiation.expiresAt);
    const isUrgent = remaining.includes('h') && parseInt(remaining) < 24;
    
    return (
      <div className={`text-sm ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
        ⏰ {remaining}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Product and Party Info */}
              <div className="flex items-start space-x-4">
                {negotiation.product?.images?.[0] && (
                  <img
                    src={negotiation.product.images[0]}
                    alt={getProductName(negotiation.product)}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getProductName(negotiation.product)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {userRole === 'buyer' ? 'Vendor' : 'Buyer'}: {getOtherPartyName()}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    {getStatusBadge()}
                    {getTimeRemaining()}
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Initial Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {negotiationService.formatPrice(negotiation.initialPrice, negotiation.product?.currency || 'USD')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Offer</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {negotiationService.formatPrice(negotiation.currentOffer, negotiation.product?.currency || 'USD')}
                  </p>
                  {getPriceMovement()}
                </div>
                {negotiation.finalPrice && (
                  <div>
                    <p className="text-sm text-gray-600">Final Price</p>
                    <p className="text-lg font-semibold text-green-600">
                      {negotiationService.formatPrice(negotiation.finalPrice, negotiation.product?.currency || 'USD')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {negotiation.messageCount || 0}
                  </p>
                </div>
              </div>

              {/* Last Activity */}
              {negotiation.lastActivity && (
                <div className="mt-4 text-sm text-gray-600">
                  Last activity: {new Date(negotiation.lastActivity).toLocaleDateString()} at{' '}
                  {new Date(negotiation.lastActivity).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Details
              </button>
              
              {negotiation.status === 'active' && (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleQuickAction('accept')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {loading ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleQuickAction('reject')}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {loading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar for Active Negotiations */}
          {negotiation.status === 'active' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Negotiation Progress</span>
                <span>{negotiationService.calculateProgress(negotiation).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${negotiationService.calculateProgress(negotiation)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Negotiation Modal */}
      {showModal && (
        <NegotiationModal
          negotiation={negotiation}
          userRole={userRole}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default NegotiationCard;