import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerValidation, loginValidation, validateRequest, updateProfileValidation } from '../utils/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ApiResponse, User } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Register endpoint
router.post('/register', registerValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, preferredLanguage = 'en' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role.toUpperCase(),
        preferredLanguage
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        preferredLanguage: true,
        location: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Transform user data to match frontend interface
    const userData: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.toLowerCase() as 'buyer' | 'vendor' | 'admin',
      preferredLanguage: user.preferredLanguage,
      location: user.location as any || {
        city: '',
        country: '',
        coordinates: [0, 0]
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      data: {
        user: userData,
        token
      }
    } as ApiResponse<{ user: User; token: string }>);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to create user account',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Login endpoint
router.post('/login', loginValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        role: true,
        preferredLanguage: true,
        location: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Transform user data to match frontend interface
    const userData: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.toLowerCase() as 'buyer' | 'vendor' | 'admin',
      preferredLanguage: user.preferredLanguage,
      location: user.location as any || {
        city: '',
        country: '',
        coordinates: [0, 0]
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userData,
        token
      }
    } as ApiResponse<{ user: User; token: string }>);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to authenticate user',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        preferredLanguage: true,
        location: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Transform user data to match frontend interface
    const userData: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.toLowerCase() as 'buyer' | 'vendor' | 'admin',
      preferredLanguage: user.preferredLanguage,
      location: user.location as any || {
        city: '',
        country: '',
        coordinates: [0, 0]
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: userData
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Logout endpoint (client-side token removal, but we can track for analytics)
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // In a more complex system, we might maintain a blacklist of tokens
    // For now, we just return success and let the client remove the token
    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    } as ApiResponse<{ message: string }>);

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

export default router;