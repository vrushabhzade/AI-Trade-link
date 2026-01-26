import React from 'react';
import { TransactionStats } from '../types';

interface TransactionStatsCardProps {
  stats: TransactionStats;
  role: 'buyer' | 'vendor';
}

const TransactionStatsCard: React.FC<TransactionStatsCardProps> = ({ stats, role }) => {
  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: '📊',
      color: 'text-gray-600',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: '⏳',
      color: 'text-yellow-600',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: '✓',
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: '✅',
      color: 'text-green-600',
    },
    {
      label: 'Disputed',
      value: stats.disputed,
      icon: '⚠️',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
        
        {role === 'vendor' && (
          <div className="text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionStatsCard;
