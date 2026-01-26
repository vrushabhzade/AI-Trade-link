import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import vendorRoutes from './routes/vendors'
import productRoutes from './routes/products'
import chatRoutes from './routes/chat'
import pricingRoutes from './routes/pricing'
import negotiationRoutes from './routes/negotiations'
import transactionRoutes from './routes/transactions'
import { ChatHandler } from './services/chatHandler'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api', limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/products', productRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/negotiations', negotiationRoutes)
app.use('/api/transactions', transactionRoutes)

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// API routes placeholder
app.use('/api', (req, res) => {
  res.json({ 
    message: 'TradeLink API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      chat: '/api/chat',
      pricing: '/api/pricing',
      negotiations: '/api/negotiations',
      transactions: '/api/transactions',
      translations: '/api/translations'
    }
  })
})

// WebSocket connection handling
const chatHandler = new ChatHandler(io);

// Health check for WebSocket
app.get('/api/chat/health', (req, res) => {
  const onlineUsers = chatHandler.getOnlineUsers();
  res.json({
    status: 'ok',
    websocket: 'connected',
    onlineUsers: onlineUsers.length,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString()
    }
  })
})

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 TradeLink server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🔌 WebSocket server ready`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

// Export for testing
export default app
export { server, io }