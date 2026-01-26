import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import OfflineIndicator from './components/OfflineIndicator'
import ErrorBoundary from './components/ErrorBoundary'
import GlobalNotifications from './components/GlobalNotifications'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import NegotiationsPage from './pages/NegotiationsPage'
import TransactionsPage from './pages/TransactionsPage'
import VendorPricingPage from './pages/VendorPricingPage'
import { ChatPage } from './pages/ChatPage'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <ErrorBoundary>
      <GlobalNotifications />
      <OfflineIndicator />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          {isAuthenticated && (
            <>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/negotiations" element={<NegotiationsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              {user?.role === 'vendor' && (
                <Route path="/vendor/pricing" element={<VendorPricingPage />} />
              )}
            </>
          )}
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App