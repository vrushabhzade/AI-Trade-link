import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface ChatListItem {
  negotiationId: string;
  productName: string;
  otherPartyName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  currentOffer?: number;
  currency: string;
  productImage?: string;
}

interface ChatListProps {
  onChatSelect: (negotiationId: string) => void;
  selectedChatId?: string;
  className?: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  onChatSelect,
  selectedChatId,
  className = ''
}) => {
  const { user, token } = useAuthStore();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      loadChats();
    }
  }, [user, token]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // This would be a real API call to get user's negotiations
      // For now, we'll create mock data
      const mockChats: ChatListItem[] = [
        {
          negotiationId: '1',
          productName: 'Fresh Tomatoes',
          otherPartyName: 'Maria\'s Farm',
          lastMessage: 'How about $3.50 per kg?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          unreadCount: 2,
          status: 'active',
          currentOffer: 3.50,
          currency: 'USD',
          productImage: '/api/placeholder/60/60'
        },
        {
          negotiationId: '2',
          productName: 'Organic Apples',
          otherPartyName: 'Green Valley Orchard',
          lastMessage: 'Deal! When can you deliver?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          unreadCount: 0,
          status: 'accepted',
          currentOffer: 4.00,
          currency: 'USD',
          productImage: '/api/placeholder/60/60'
        },
        {
          negotiationId: '3',
          productName: 'Handmade Pottery',
          otherPartyName: 'Artisan Crafts',
          lastMessage: 'Thank you for your interest',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          unreadCount: 0,
          status: 'rejected',
          currentOffer: 25.00,
          currency: 'USD',
          productImage: '/api/placeholder/60/60'
        }
      ];

      setChats(mockChats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'accepted':
        return 'text-blue-600 bg-blue-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '💬';
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'expired':
        return '⏰';
      default:
        return '💬';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">❌ {error}</div>
          <button 
            onClick={loadChats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>No active negotiations</p>
          <p className="text-sm mt-1">Start negotiating on products to see chats here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Active Negotiations</h2>
        <p className="text-sm text-gray-500">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.negotiationId}
            onClick={() => onChatSelect(chat.negotiationId)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedChatId === chat.negotiationId ? 'bg-blue-50 border-r-2 border-blue-600' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                {chat.productImage ? (
                  <img 
                    src={chat.productImage} 
                    alt={chat.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {chat.productName}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                      {getStatusIcon(chat.status)} {chat.status}
                    </span>
                  </div>
                </div>

                {/* Other Party */}
                <p className="text-sm text-gray-600 mb-1">
                  with {chat.otherPartyName}
                </p>

                {/* Last Message */}
                <p className="text-sm text-gray-500 truncate mb-1">
                  {chat.lastMessage}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatLastMessageTime(chat.lastMessageTime)}
                  </span>
                  
                  {chat.currentOffer && (
                    <span className="text-xs font-medium text-green-600">
                      Current: {chat.currentOffer} {chat.currency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={loadChats}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};