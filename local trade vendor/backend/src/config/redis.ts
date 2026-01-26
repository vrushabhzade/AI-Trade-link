import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis')
})

// Initialize connection
export const initRedis = async () => {
  try {
    await redisClient.connect()
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    // Don't throw error - app should work without Redis
  }
}

export { redisClient }