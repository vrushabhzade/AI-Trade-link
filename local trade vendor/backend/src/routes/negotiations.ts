import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { negotiationService } from '../services/negotiationService';
import { getPriceAnalysisService } from '../services/priceAnalysisService';
import { prisma } from '../config/database';
import { NegotiationStatus } from '@prisma/client';

const router = express.Router();
const priceAnalysisService = getPriceAnalysisService();

// Create a new negotiation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, initialPrice, buyerLanguage, vendorLanguage, message } = req.body;
    const buyerId = req.user!.userId;

    // Validate product exists and get vendor info
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
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if buyer is not the vendor
    if (product.vendor.userId === buyerId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NEGOTIATION',
          message: 'Cannot negotiate with yourself',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if there's already an active negotiation for this product by this buyer
    const existingNegotiation = await prisma.negotiation.findFirst({
      where: {
        productId,
        buyerId,
        status: NegotiationStatus.ACTIVE
      }
    });

    if (existingNegotiation) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGOTIATION_EXISTS',
          message: 'Active negotiation already exists for this product',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Create negotiation
    const negotiation = await negotiationService.createNegotiation({
      productId,
      buyerId,
      vendorId: product.vendorId,
      initialPrice,
      buyerLanguage: buyerLanguage || 'en',
      vendorLanguage: vendorLanguage || 'en'
    });

    // Create initial message if provided
    if (message) {
      await prisma.message.create({
        data: {
          negotiationId: negotiation.id,
          senderId: buyerId,
          originalText: message,
          originalLanguage: buyerLanguage || 'en',
          messageType: 'OFFER',
          priceOffer: initialPrice
        }
      });
    }

    res.json({
      success: true,
      data: negotiation
    });
  } catch (error) {
    console.error('Error creating negotiation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create negotiation',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Get negotiation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const negotiation = await negotiationService.getNegotiationById(id);

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if user is part of this negotiation
    const isParticipant = negotiation.buyerId === userId || negotiation.vendor.userId === userId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this negotiation',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    res.json({
      success: true,
      data: negotiation
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch negotiation',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Get user's negotiations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { status, role } = req.query;

    // Determine user's role in negotiations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendor: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const filters: any = {};
    
    // Filter by role
    if (role === 'buyer' || (role !== 'vendor' && user.role === 'BUYER')) {
      filters.buyerId = userId;
    } else if (role === 'vendor' || (role !== 'buyer' && user.vendor)) {
      filters.vendorId = user.vendor.id;
    } else {
      // User can be both buyer and vendor, get all their negotiations
      filters.OR = [
        { buyerId: userId },
        { vendor: { userId } }
      ];
    }

    // Filter by status
    if (status && Object.values(NegotiationStatus).includes(status as NegotiationStatus)) {
      filters.status = status;
    }

    const negotiations = await prisma.negotiation.findMany({
      where: filters,
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true
              }
            }
          }
        },
        buyer: true,
        vendor: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: negotiations
    });
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch negotiations',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Make counter offer
router.post('/:id/counter-offer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, message } = req.body;
    const userId = req.user!.userId;

    // Validate negotiation exists and user is participant
    const negotiation = await negotiationService.getNegotiationById(id);
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const isParticipant = negotiation.buyerId === userId || negotiation.vendor.userId === userId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this negotiation',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if negotiation is still active
    if (negotiation.status !== NegotiationStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_ACTIVE',
          message: 'Negotiation is not active',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Update negotiation with counter offer
    const updatedNegotiation = await negotiationService.makeCounterOffer(id, amount);

    // Create message for the counter offer
    if (message) {
      await prisma.message.create({
        data: {
          negotiationId: id,
          senderId: userId,
          originalText: message,
          originalLanguage: negotiation.buyerId === userId ? negotiation.buyerLanguage : negotiation.vendorLanguage,
          messageType: 'COUNTER_OFFER',
          priceOffer: amount
        }
      });
    }

    res.json({
      success: true,
      data: updatedNegotiation
    });
  } catch (error) {
    console.error('Error making counter offer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to make counter offer',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Accept negotiation
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice, message } = req.body;
    const userId = req.user!.userId;

    // Validate negotiation exists and user is participant
    const negotiation = await negotiationService.getNegotiationById(id);
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const isParticipant = negotiation.buyerId === userId || negotiation.vendor.userId === userId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this negotiation',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if negotiation is still active
    if (negotiation.status !== NegotiationStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_ACTIVE',
          message: 'Negotiation is not active',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Accept negotiation
    const acceptedNegotiation = await negotiationService.acceptNegotiation(id, finalPrice || negotiation.currentOffer);

    // Create acceptance message
    if (message) {
      await prisma.message.create({
        data: {
          negotiationId: id,
          senderId: userId,
          originalText: message,
          originalLanguage: negotiation.buyerId === userId ? negotiation.buyerLanguage : negotiation.vendorLanguage,
          messageType: 'ACCEPTANCE',
          priceOffer: finalPrice || negotiation.currentOffer
        }
      });
    }

    res.json({
      success: true,
      data: acceptedNegotiation
    });
  } catch (error) {
    console.error('Error accepting negotiation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to accept negotiation',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Reject negotiation
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user!.userId;

    // Validate negotiation exists and user is participant
    const negotiation = await negotiationService.getNegotiationById(id);
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const isParticipant = negotiation.buyerId === userId || negotiation.vendor.userId === userId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this negotiation',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Check if negotiation is still active
    if (negotiation.status !== NegotiationStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_ACTIVE',
          message: 'Negotiation is not active',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Reject negotiation
    const rejectedNegotiation = await negotiationService.rejectNegotiation(id);

    // Create rejection message
    if (message) {
      await prisma.message.create({
        data: {
          negotiationId: id,
          senderId: userId,
          originalText: message,
          originalLanguage: negotiation.buyerId === userId ? negotiation.buyerLanguage : negotiation.vendorLanguage,
          messageType: 'TEXT'
        }
      });
    }

    res.json({
      success: true,
      data: rejectedNegotiation
    });
  } catch (error) {
    console.error('Error rejecting negotiation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject negotiation',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Get AI-powered response suggestions
router.get('/:id/suggestions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Validate negotiation exists and user is participant
    const negotiation = await negotiationService.getNegotiationById(id);
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const isParticipant = negotiation.buyerId === userId || negotiation.vendor.userId === userId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this negotiation',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Only provide suggestions for active negotiations
    if (negotiation.status !== NegotiationStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_ACTIVE',
          message: 'Suggestions only available for active negotiations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    // Build negotiation history for context
    const negotiationHistory = negotiation.messages
      .filter(msg => msg.priceOffer)
      .map(msg => ({
        price: parseFloat(msg.priceOffer!.toString()),
        timestamp: msg.createdAt,
        fromBuyer: msg.senderId === negotiation.buyerId
      }));

    const context = {
      productId: negotiation.productId,
      currentOffer: parseFloat(negotiation.currentOffer?.toString() || '0'),
      initialPrice: parseFloat(negotiation.initialPrice.toString()),
      negotiationHistory,
      buyerLanguage: negotiation.buyerLanguage,
      vendorLanguage: negotiation.vendorLanguage
    };

    // Get AI suggestions (only for vendors for now)
    const isVendor = negotiation.vendor.userId === userId;
    if (isVendor) {
      const suggestions = await priceAnalysisService.suggestCounterOffer(context);
      res.json({
        success: true,
        data: suggestions
      });
    } else {
      // For buyers, provide basic guidance
      res.json({
        success: true,
        data: {
          suggestedPrice: Math.max(
            parseFloat(negotiation.currentOffer?.toString() || '0') * 0.95,
            parseFloat(negotiation.initialPrice.toString()) * 0.8
          ),
          messageTemplate: "I appreciate your offer. Would you consider this price?",
          acceptanceProbability: 60,
          rationale: "Consider making a reasonable counter-offer to keep the negotiation moving forward.",
          alternativeSuggestions: [
            "Ask about bulk discounts or package deals",
            "Inquire about product condition or additional services",
            "Suggest meeting in the middle of your offers"
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error getting negotiation suggestions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get suggestions',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Get negotiation statistics
router.get('/stats/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user!.userId;

    if (role !== 'buyer' && role !== 'vendor') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be either buyer or vendor',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const stats = await negotiationService.getNegotiationStats(userId, role);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting negotiation stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get negotiation statistics',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

// Get negotiation insights and analytics
router.get('/insights/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user!.userId;

    if (role !== 'buyer' && role !== 'vendor') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be either buyer or vendor',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        }
      });
    }

    const insights = await negotiationService.getNegotiationInsights(userId, role);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting negotiation insights:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get negotiation insights',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      }
    });
  }
});

export default router;