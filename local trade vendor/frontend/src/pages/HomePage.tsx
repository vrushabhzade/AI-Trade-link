import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="text-center px-4 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Welcome to TradeLink
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
          AI-powered local trade marketplace that connects vendors and buyers 
          through multilingual communication and intelligent price negotiation.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <Link to="/products" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
            Browse Products
          </Link>
          <Link to="/register" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
            Join as Vendor
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          <div className="text-center p-4 sm:p-0">
            <div className="bg-primary-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🌍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Multilingual Support</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Break language barriers with real-time translation powered by AI
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-0">
            <div className="bg-secondary-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🤝</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Smart Negotiations</h3>
            <p className="text-sm sm:text-base text-gray-600">
              AI-powered price discovery and negotiation assistance
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-0 sm:col-span-2 md:col-span-1">
            <div className="bg-yellow-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">📍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Local Discovery</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Find products and vendors near you with location-based search
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage