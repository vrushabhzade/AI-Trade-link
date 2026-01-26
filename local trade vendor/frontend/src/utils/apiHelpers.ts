const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export class ApiException extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.code = code
  }
}

/**
 * Fetch with automatic retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // Don't retry on client errors (4xx), only on server errors (5xx) or network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error as Error
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
    }
  }

  throw lastError || new Error('Request failed after retries')
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Merge with provided headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value
      }
    })
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiException(
      errorData.message || 'An error occurred',
      response.status,
      errorData.code
    )
  }

  return response.json()
}

/**
 * Get authentication token from storage
 */
export function getAuthToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state?.token || null
    }
  } catch (error) {
    console.error('Error reading auth token:', error)
  }
  return null
}

/**
 * Handle API errors and return user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )
  }
  return false
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiException) {
    return error.status === 401 || error.status === 403
  }
  return false
}
