import React, { useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import ErrorMessage from './ErrorMessage'
import SuccessMessage from './SuccessMessage'

const GlobalNotifications: React.FC = () => {
  const { error, successMessage, clearMessages } = useUIStore()

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        clearMessages()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, clearMessages])

  if (!error && !successMessage) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full px-4">
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={clearMessages}
          className="mb-4"
        />
      )}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={clearMessages}
        />
      )}
    </div>
  )
}

export default GlobalNotifications
