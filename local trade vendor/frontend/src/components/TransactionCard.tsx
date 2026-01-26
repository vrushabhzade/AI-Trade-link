import React from 'react';
import { Transaction } from '../types';

interface TransactionCardProps {
  transaction: Transaction;
  userRole: 'buyer' | 'vendor';
  onClick: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, userRole, onClick }) => {
  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusIcon = (status: Transaction['deliveryStatus']) => {
    switch (status) {
      case 'pending':
        return '📦';
      case 'preparing':
        return '🔨';
      case 'shipped':
        return '🚚';
      case 'in_transit':
        return '🚛';
      case 'delivered':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📦';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const productName = transaction.product?.name?.en || 'Product';
  const otherParty = userRole === 'buyer' 
    ? transaction.vendor?.businessName?.en || 'Vendor'
    : transaction.buyer?.fullName || 'Buyer';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{productName}</h3>
          <p className="text-sm text-gray-600">
            {userRole === 'buyer' ? 'From' : 'To'}: {otherParty}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              transaction.status
            )}`}
          >
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
          <span className="text-lg font-bold text-gray-900">
            {transaction.currency} {transaction.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Quantity</p>
          <p className="font-medium text-gray-900">{transaction.quantity}</p>
        </div>
        <div>
          <p className="text-gray-500">Payment</p>
          <p className="font-medium text-gray-900">
            {transaction.paymentStatus.charAt(0).toUpperCase() +
              transaction.paymentStatus.slice(1)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Delivery</p>
          <p className="font-medium text-gray-900 flex items-center gap-1">
            <span>{getDeliveryStatusIcon(transaction.deliveryStatus)}</span>
            <span>
              {transaction.deliveryStatus.charAt(0).toUpperCase() +
                transaction.deliveryStatus.slice(1).replace('_', ' ')}
            </span>
          </p>
        </div>
        <div>
          <p className="text-gray-500">Date</p>
          <p className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      {transaction.deliveryTracking && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Tracking: <span className="font-mono text-gray-900">{transaction.deliveryTracking}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
