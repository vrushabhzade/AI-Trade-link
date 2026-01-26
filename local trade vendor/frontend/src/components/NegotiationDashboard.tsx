import React, { useState, useEffect } from 'react';
import { 
  Negotiation, 
  NegotiationStats, 
  NegotiationInsights
} from '../types';
import { negotiationService } from '../services/negotiationService';
import { useAuthStore } from '../stores/authStore';
import NegotiationCard from './NegotiationCard';
import NegotiationStatsCard from './NegotiationStatsCard';

interface NegotiationDashboardProps {
  userRole?: 'buyer' | 'vendor';
}

const NegotiationDashboard: React.FC<NegotiationDashboardProps> = ({ userRole }) => {
  const { user } = useAuthStore();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [stats, setStats] = useState<NegotiationStats | null>(null);
  const [insights, setInsights] = useState<NegotiationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'accepted' | 'rejected' | 'expired'>('all');
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'vendor'>(
    userRole || (user?.role === 'vendor' ? 'vendor' : 'buyer')
  );

  useEffect(() => {
    loadDashboardData();
  }, [selectedRole, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load negotiations
      const negotiationsData = await negotiationService.getNegotiations({
        role: selectedRole,
        status: activeTab === 'all' ? undefined : activeTab
      });

      // Load stats and insights
      const [statsData, insightsData] = await Promise.all([
        negotiationService.getStats(selectedRole),
        negotiationService.getInsights(selectedRole)
      ]);

      setNegotiations(negotiationsData);
      setStats(statsData);
      setInsights(insightsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiationUpdate = (updatedNegotiation: Negotiation) => {
    setNegotiations(prev => 
      prev.map(n => n.id === updatedNegotiation.id ? updatedNegotiation : n)
    );
    // Reload stats to reflect changes
    loadDashboardData();
  };

  const getTabCount = (status: string) => {
    if (!stats) return 0;
    switch (status) {
      case 'all': return stats.total;
      case 'active': return stats.active;
      case 'accepted': return stats.accepted;
      case 'rejected': return stats.rejected;
      case 'expired': return stats.expired;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading negotiations</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={loadDashboardData}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedRole === 'buyer' ? 'My Purchase Negotiations' : 'My Sales Negotiations'}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your ongoing and completed negotiations
          </p>
        </div>
        
        {/* Role Switcher (if user can be both buyer and vendor) */}
        {user?.role === 'vendor' && (
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setSelectedRole('buyer')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedRole === 'buyer'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                As Buyer
              </button>
              <button
                onClick={() => setSelectedRole('vendor')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedRole === 'vendor'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                As Vendor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NegotiationStatsCard
            title="Total Negotiations"
            value={stats.total}
            icon="📊"
            color="blue"
          />
          <NegotiationStatsCard
            title="Success Rate"
            value={`${insights.successRate.toFixed(1)}%`}
            icon="✅"
            color="green"
          />
          <NegotiationStatsCard
            title="Avg. Negotiation Time"
            value={`${insights.averageNegotiationTime.toFixed(1)}h`}
            icon="⏱️"
            color="yellow"
          />
          <NegotiationStatsCard
            title="Avg. Discount"
            value={`${insights.averageDiscount.toFixed(1)}%`}
            icon="💰"
            color="purple"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'expired', label: 'Expired' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({getTabCount(tab.key)})
            </button>
          ))}
        </nav>
      </div>

      {/* Negotiations List */}
      <div className="space-y-4">
        {negotiations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No negotiations found
            </h3>
            <p className="text-gray-600">
              {activeTab === 'all' 
                ? `You haven't started any negotiations as a ${selectedRole} yet.`
                : `No ${activeTab} negotiations found.`
              }
            </p>
          </div>
        ) : (
          negotiations.map((negotiation) => (
            <NegotiationCard
              key={negotiation.id}
              negotiation={negotiation}
              userRole={selectedRole}
              onUpdate={handleNegotiationUpdate}
            />
          ))
        )}
      </div>

      {/* Top Categories Insight */}
      {insights && insights.topCategories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Categories
          </h3>
          <div className="space-y-3">
            {insights.topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    #{index + 1} {category.category}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(category.count / insights.topCategories[0].count) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{category.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationDashboard;