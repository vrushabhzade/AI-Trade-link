import React from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

interface RetryableQueryProps {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  onRetry: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorMessage?: string
}

const RetryableQuery: React.FC<RetryableQueryProps> = ({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  loadingComponent,
  errorMessage,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        {loadingComponent || <LoadingSpinner size="lg" />}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-8">
        <ErrorMessage
          message={errorMessage || error?.message || 'An error occurred'}
          onRetry={onRetry}
        />
      </div>
    )
  }

  return <>{children}</>
}

export default RetryableQuery
