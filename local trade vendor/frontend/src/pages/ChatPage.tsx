import React, { useState } from 'react';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import Layout from '../components/Layout';

export const ChatPage: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const handleChatSelect = (negotiationId: string) => {
    setSelectedChatId(negotiationId);
    setIsMobileView(true); // On mobile, show chat window when selected
  };

  const handleBackToList = () => {
    setIsMobileView(false);
    setSelectedChatId(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Manage your product negotiations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List - Hidden on mobile when chat is selected */}
          <div className={`lg:col-span-1 ${isMobileView ? 'hidden lg:block' : 'block'}`}>
            <ChatList
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChatId || undefined}
              className="h-full"
            />
          </div>

          {/* Chat Window - Hidden on mobile when no chat selected */}
          <div className={`lg:col-span-2 ${!selectedChatId ? 'hidden lg:flex' : 'flex'} flex-col`}>
            {selectedChatId ? (
              <div className="h-full">
                {/* Mobile back button */}
                <div className="lg:hidden mb-4">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    ← Back to conversations
                  </button>
                </div>
                
                <ChatWindow
                  negotiationId={selectedChatId}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="hidden lg:flex items-center justify-center h-full bg-white rounded-lg shadow-lg">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a negotiation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile floating action button for new chat */}
        <div className="lg:hidden fixed bottom-6 right-6">
          <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center">
            <span className="text-xl">💬</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};