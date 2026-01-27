import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple health check for now
  if (req.url === '/health' || req.url === '/api/health') {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  }

  // API info
  if (req.url === '/api' || req.url === '/api/') {
    return res.json({
      message: 'TradeLink API is running',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        products: '/api/products',
        chat: '/api/chat',
        pricing: '/api/pricing',
        negotiations: '/api/negotiations',
        transactions: '/api/transactions'
      }
    });
  }

  // For now, return a message that backend is being set up
  return res.status(503).json({
    success: false,
    message: 'Backend API is being configured. Please check back shortly.',
    timestamp: new Date().toISOString()
  });
}
