import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'buyer',
    preferredLanguage: 'en'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    return errors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear errors when user starts typing
    if (error) setError(null)
    
    // Validate password in real-time
    if (name === 'password') {
      const errors = validatePassword(value)
      setValidationErrors(errors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate password before submitting
    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors)
      setError('Please fix the password requirements')
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.error?.details) {
          const errorMessages = data.error.details.map((err: any) => err.msg).join(', ')
          throw new Error(errorMessages)
        }
        throw new Error(data.error?.message || 'Registration failed')
      }

      if (data.success && data.data) {
        // Store user and token in auth store
        login(data.data.user, data.data.token)
        
        // Redirect to home page
        navigate('/')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">Join TradeLink</h2>
        
        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              minLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {validationErrors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                <p className="font-medium">Password requirements:</p>
                <ul className="list-disc list-inside mt-1">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {formData.password && validationErrors.length === 0 && (
              <p className="mt-2 text-sm text-green-600">✓ Password meets all requirements</p>
            )}
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I want to
            </label>
            <select 
              id="role" 
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="buyer">Buy products</option>
              <option value="vendor">Sell products</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || validationErrors.length > 0}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage