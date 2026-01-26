import React, { useState } from 'react';
import { Transaction } from '../types';
import { transactionService } from '../services/transactionService';

interface TransactionDetailModalProps {
  transaction: Transaction;
  userRole: 'buyer' | 'vendor';
  onClose: () => void;
  onUpdate: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  userRole,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDeliveryUpdate, setShowDeliveryUpdate] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(transaction.deliveryStatus);
  const [trackingNumber, setTrackingNumber] = useState(transaction.deliveryTracking || '');

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      await transactionService.processPayment(transaction.id, 'card', {
        // In production, this would include actual payment details
        cardNumber: '****',
      });
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      await transactionService.updateDeliveryStatus(
        transaction.id,
        deliveryStatus,
        trackingNumber || undefined
      );
      setShowDeliveryUpdate(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transaction?')) return;

    try {
      setLoading(true);
      setError(null);
      await transactionService.cancelTransaction(transaction.id, 'User requested cancellation');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      setError('Please provide a reason for the dispute');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await transactionService.createDispute(transaction.id, disputeReason);
      setShowDisputeForm(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (resolution: 'refund' | 'continue') => {
    if (!confirm(`Are you sure you want to ${resolution} this dispute?`)) return;

    try {
      setLoading(true);
      setError(null);
      await transactionService.resolveDispute(transaction.id, resolution);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const productName = transaction.product?.name?.en || 'Product';
  const otherParty =
    userRole === 'buyer'
      ? transaction.vendor?.businessName?.en || 'Vendor'
      : transaction.buyer?.fullName || 'Buyer';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Product Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{productName}</h3>
            <p className="text-gray-600">
              {userRole === 'buyer' ? 'Seller' : 'Buyer'}: {otherParty}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-mono text-sm text-gray-900">{transaction.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900">
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium text-gray-900">{transaction.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price per unit</p>
              <p className="font-medium text-gray-900">
                {transaction.currency} {transaction.agreedPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {transaction.currency} {transaction.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="font-medium text-gray-900">
                {transaction.paymentStatus.charAt(0).toUpperCase() +
                  transaction.paymentStatus.slice(1)}
              </p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-900">
                  {transaction.deliveryStatus.charAt(0).toUpperCase() +
                    transaction.deliveryStatus.slice(1).replace('_', ' ')}
                </p>
              </div>
              {transaction.deliveryTracking && (
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-mono text-sm text-gray-900">{transaction.deliveryTracking}</p>
                </div>
              )}
              {transaction.deliveryAddress && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="text-sm text-gray-900">
                    {transaction.deliveryAddress.street}, {transaction.deliveryAddress.city},{' '}
                    {transaction.deliveryAddress.state} {transaction.deliveryAddress.postalCode},{' '}
                    {transaction.deliveryAddress.country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Information */}
          {transaction.status === 'disputed' && transaction.disputeReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Dispute</h4>
              <p className="text-sm text-red-800">{transaction.disputeReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Buyer Actions */}
            {userRole === 'buyer' && transaction.paymentStatus === 'pending' && (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Process Payment'}
              </button>
            )}

            {/* Vendor Actions */}
            {userRole === 'vendor' &&
              transaction.status === 'confirmed' &&
              !showDeliveryUpdate && (
                <button
                  onClick={() => setShowDeliveryUpdate(true)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Update Delivery Status
                </button>
              )}

            {/* Delivery Update Form */}
            {showDeliveryUpdate && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Status
                  </label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeliveryUpdate}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    onClick={() => setShowDeliveryUpdate(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Dispute Actions */}
            {transaction.status !== 'completed' &&
              transaction.status !== 'cancelled' &&
              transaction.status !== 'disputed' &&
              !showDisputeForm && (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Create Dispute
                </button>
              )}

            {/* Dispute Form */}
            {showDisputeForm && (
              <div className="p-4 bg-red-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-1">
                    Reason for Dispute
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Explain the issue..."
                    rows={4}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateDispute}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Submit Dispute'}
                  </button>
                  <button
                    onClick={() => setShowDisputeForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Dispute Resolution */}
            {transaction.status === 'disputed' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolveDispute('refund')}
                  disabled={loading}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  Refund
                </button>
                <button
                  onClick={() => handleResolveDispute('continue')}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Cancel Transaction */}
            {transaction.status === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cancelling...' : 'Cancel Transaction'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
