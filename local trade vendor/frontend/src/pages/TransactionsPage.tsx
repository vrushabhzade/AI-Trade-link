import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { transactionService } from '../services/transactionService';
import { Transaction, TransactionStats } from '../types';
import TransactionList from '../components/TransactionList';
import TransactionStatsCard from '../components/TransactionStatsCard';

const TransactionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'disputed'>(
    'all'
  );

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadStats();
    }
  }, [user, filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const data = await transactionService.getTransactions(filters);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    try {
      const data = await transactionService.getTransactionStats(user.id, user.role);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleTransactionUpdate = () => {
    loadTransactions();
    loadStats();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'buyer' ? 'My Purchases' : 'My Sales'}
          </h1>
          <p className="mt-2 text-gray-600">
            Track your transactions and manage deliveries
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8">
            <TransactionStatsCard stats={stats} role={user.role} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'completed', 'disputed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadTransactions}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-gray-500">
              {filter === 'all'
                ? 'You have no transactions yet'
                : `No ${filter} transactions found`}
            </p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            userRole={user.role}
            onUpdate={handleTransactionUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
