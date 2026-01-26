import express, { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getPriceAnalysisService } from '../services/priceAnalysisService';
import { prisma } from '../config/database';

const router = express.Router();
const priceAnalysisService = getPriceAnalysisService();

/**
 * Get pricing recommendations for a product
 * POST /api/pricing/analyze
 */
router.post('/analyze',
  authenticateToken,
  [
    body('productId').isUUID().withMessage('Valid product ID is required'),
    body('location').optional().isArray().withMessage('Location must be an array of [longitude, latitude]'),
    body('radiusKm').optional().isFloat({ min: 1, max: 100 }).withMessage('Radius must be between 1 and 100 km')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const { productId, location, radiusKm } = req.body;
      const userId = req.user?.id;

      // Verify product exists and user has access
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          vendor: {
            include: {
              user: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Check if user is the vendor or has permission to view pricing
      if (product.vendor.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to access pricing analysis for this product',
            timestamp: new Date().toISOString()
          }
        });
      }

      const analysis = await priceAnalysisService.getPricingRecommendations({
        productId,
        category: product.category,
        basePrice: parseFloat(product.basePrice.toString()),
        currency: product.currency,
        location,
        radiusKm
      });

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Pricing analysis error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to analyze pricing',
          timestamp: new Date().toISOString()
        },
        retryable: true
      });
    }
  }
);

/**
 * Get market data for a category
 * GET /api/pricing/market-data/:category
 */
router.get('/market-data/:category',
  authenticateToken,
  [
    param('category').notEmpty().withMessage('Category is required'),
    query('location').optional().custom((value) => {
      if (value) {
        const coords = value.split(',').map(Number);
        if (coords.length !== 2 || coords.some(isNaN)) {
          throw new Error('Location must be in format "longitude,latitude"');
        }
      }
      return true;
    }),
    query('radiusKm').optional().isFloat({ min: 1, max: 100 }).withMessage('Radius must be between 1 and 100 km')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const { category } = req.params;
      const { location, radiusKm } = req.query;

      let locationCoords: [number, number] | undefined;
      if (location) {
        const coords = (location as string).split(',').map(Number);
        locationCoords = [coords[0], coords[1]];
      }

      const marketData = await priceAnalysisService.collectMarketData({
        productId: '', // Not needed for market data collection
        category,
        basePrice: 0, // Not needed for market data collection
        currency: 'USD',
        location: locationCoords,
        radiusKm: radiusKm ? parseFloat(radiusKm as string) : 10
      });

      res.json({
        success: true,
        data: marketData
      });

    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch market data',
          timestamp: new Date().toISOString()
        },
        retryable: true
      });
    }
  }
);

/**
 * Get counter-offer suggestion for negotiation
 * POST /api/pricing/counter-offer
 */
router.post('/counter-offer',
  authenticateToken,
  [
    body('productId').isUUID().withMessage('Valid product ID is required'),
    body('currentOffer').isFloat({ min: 0 }).withMessage('Current offer must be a positive number'),
    body('initialPrice').isFloat({ min: 0 }).withMessage('Initial price must be a positive number'),
    body('negotiationHistory').isArray().withMessage('Negotiation history must be an array'),
    body('buyerLanguage').isLength({ min: 2, max: 5 }).withMessage('Buyer language code is required'),
    body('vendorLanguage').isLength({ min: 2, max: 5 }).withMessage('Vendor language code is required')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const {
        productId,
        currentOffer,
        initialPrice,
        negotiationHistory,
        buyerLanguage,
        vendorLanguage
      } = req.body;
      const userId = req.user?.id;

      // Verify product exists and user is the vendor
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          vendor: {
            include: {
              user: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Check if user is the vendor
      if (product.vendor.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only the product vendor can request counter-offer suggestions',
            timestamp: new Date().toISOString()
          }
        });
      }

      const suggestion = await priceAnalysisService.suggestCounterOffer({
        productId,
        currentOffer,
        initialPrice,
        negotiationHistory,
        buyerLanguage,
        vendorLanguage
      });

      res.json({
        success: true,
        data: suggestion
      });

    } catch (error) {
      console.error('Counter-offer suggestion error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate counter-offer suggestion',
          timestamp: new Date().toISOString()
        },
        retryable: true
      });
    }
  }
);

/**
 * Get pricing insights for vendor dashboard
 * GET /api/pricing/insights
 */
router.get('/insights',
  authenticateToken,
  [
    query('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
    query('category').optional().notEmpty().withMessage('Category cannot be empty'),
    query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Timeframe must be 7d, 30d, or 90d')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const { vendorId, category, timeframe = '30d' } = req.query;
      const userId = req.user?.id;

      // If vendorId is provided, verify access
      if (vendorId) {
        const vendor = await prisma.vendor.findUnique({
          where: { id: vendorId as string },
          include: { user: true }
        });

        if (!vendor) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: 'Vendor not found',
              timestamp: new Date().toISOString()
            }
          });
        }

        if (vendor.userId !== userId && req.user?.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'You do not have permission to view this vendor\'s insights',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      // Get vendor's products
      const products = await prisma.product.findMany({
        where: {
          vendor: vendorId ? { id: vendorId as string } : { userId },
          category: category as string || undefined,
          isActive: true
        },
        include: {
          vendor: true
        }
      });

      // Generate insights for each product
      const insights = await Promise.all(
        products.map(async (product) => {
          try {
            const analysis = await priceAnalysisService.getPricingRecommendations({
              productId: product.id,
              category: product.category,
              basePrice: parseFloat(product.basePrice.toString()),
              currency: product.currency
            });

            return {
              productId: product.id,
              productName: product.name,
              category: product.category,
              currentPrice: parseFloat(product.basePrice.toString()),
              recommendedPrice: analysis.recommendedPrice,
              priceGap: analysis.recommendedPrice - parseFloat(product.basePrice.toString()),
              confidenceScore: analysis.confidenceScore,
              marketPosition: analysis.marketInsights.pricePosition,
              demandLevel: analysis.marketInsights.demandLevel
            };
          } catch (error) {
            console.error(`Error analyzing product ${product.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed analyses
      const validInsights = insights.filter(insight => insight !== null);

      res.json({
        success: true,
        data: {
          insights: validInsights,
          summary: {
            totalProducts: validInsights.length,
            averageConfidence: validInsights.length > 0 
              ? validInsights.reduce((sum, i) => sum + i!.confidenceScore, 0) / validInsights.length 
              : 0,
            underpriced: validInsights.filter(i => i!.priceGap > 0).length,
            overpriced: validInsights.filter(i => i!.priceGap < 0).length,
            wellPriced: validInsights.filter(i => Math.abs(i!.priceGap) < 1).length
          }
        }
      });

    } catch (error) {
      console.error('Pricing insights error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch pricing insights',
          timestamp: new Date().toISOString()
        },
        retryable: true
      });
    }
  }
);

export default router;