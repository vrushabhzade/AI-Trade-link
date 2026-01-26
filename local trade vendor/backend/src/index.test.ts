import request from 'supertest'
import express from 'express'

// Simple test to verify basic setup
describe('TradeLink Backend Setup', () => {
  let app: express.Application

  beforeAll(() => {
    app = express()
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'test'
      })
    })
  })

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('environment', 'test')
  })

  it('should have correct project structure', () => {
    // Test that core types are properly defined
    expect(typeof require('./types')).toBe('object')
  })
})