import React from 'react';
import Layout from '../components/Layout';
import NegotiationDashboard from '../components/NegotiationDashboard';
import { useAuthStore } from '../stores/authStore';

const NegotiationsPage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Please log in to view your negotiations
            </h2>
            <p className="text-gray-600">
              You need to be logged in to access your negotiation dashboard.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NegotiationDashboard />
      </div>
    </Layout>
  );
};

export default NegotiationsPage;