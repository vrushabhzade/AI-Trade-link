import request from 'supertest';
import express from 'express';

// Mock all dependencies before importing the route
jest.mock('@prisma/client', () => {
  const mockUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: mockUser,
    })),
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocktoken'),
  verify: jest.fn().mockReturnValue({ userId: 'user1', email: 'test@example.com', role: 'BUYER' }),
}));

// Now import the route after mocking
import authRoutes from '../auth';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Mock environment variable
process.env.JWT_SECRET = 'test-secret';

// Get the mocked prisma instance
const mockPrisma = new PrismaClient() as any;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        role: 'buyer',
        preferredLanguage: 'en'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user1',
        email: userData.email,
        fullName: userData.fullName,
        role: 'BUYER',
        preferredLanguage: userData.preferredLanguage,
        location: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBe('mocktoken');
    });

    it('should return error for existing user', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        fullName: 'Test User',
        role: 'buyer'
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: loginData.email,
        passwordHash: 'hashedpassword',
        fullName: 'Test User',
        role: 'BUYER',
        preferredLanguage: 'en',
        location: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBe('mocktoken');
    });

    it('should return error for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});