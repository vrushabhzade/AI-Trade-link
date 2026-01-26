import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'image'
  count?: number
  className?: string
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          </div>
        )
      case 'card':
        return (
          <div className={`animate-pulse bg-white rounded-lg shadow-md p-4 ${className}`}>
            <div className="h-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        )
      case 'avatar':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
          </div>
        )
      case 'image':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="w-full h-64 bg-gray-200 rounded" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  )
}

export default LoadingSkeleton
