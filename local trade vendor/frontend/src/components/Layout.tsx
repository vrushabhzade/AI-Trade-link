import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-primary-600" onClick={closeMobileMenu}>
                TradeLink
              </Link>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
                Products
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/negotiations" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Negotiations
                  </Link>
                  <Link to="/transactions" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Transactions
                  </Link>
                  <Link to="/chat" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Messages
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'vendor' && (
                <Link to="/vendor/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Pricing
                </Link>
              )}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {user?.fullName}
                  </Link>
                  <Link to="/settings" className="text-gray-600 hover:text-primary-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  <button
                    onClick={logout}
                    className="btn-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            {/* Mobile Search */}
            <div className="px-4 py-3 border-b">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>
            </div>
            
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/products"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                  isActivePath('/products') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Products
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/negotiations"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/negotiations') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Negotiations
                  </Link>
                  <Link
                    to="/transactions"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/transactions') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Transactions
                  </Link>
                  <Link
                    to="/chat"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/chat') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Messages
                  </Link>
                  {user?.role === 'vendor' && (
                    <Link
                      to="/vendor/pricing"
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                        isActivePath('/vendor/pricing') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Pricing
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/profile') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/settings') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                  >
                    Logout
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      isActivePath('/login') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-center touch-manipulation"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation (for authenticated users) */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="flex justify-around items-center h-16">
            <Link
              to="/products"
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
                isActivePath('/products') ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs">Products</span>
            </Link>
            <Link
              to="/negotiations"
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
                isActivePath('/negotiations') ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Negotiate</span>
            </Link>
            <Link
              to="/chat"
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
                isActivePath('/chat') ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">Messages</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
                isActivePath('/settings') ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs">Settings</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Footer - Hidden on mobile when authenticated (due to bottom nav) */}
      <footer className={`bg-white border-t mt-8 ${isAuthenticated ? 'hidden md:block mb-0' : 'mb-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; 2024 TradeLink Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Spacer for bottom navigation on mobile */}
      {isAuthenticated && <div className="md:hidden h-16" />}
    </div>
  )
}

export default Layout