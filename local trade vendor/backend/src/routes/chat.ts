import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { messageService } from '../services/messageService';
import { getTranslationService } from '../services/translationService';
import { prisma } from '../config/database';

const router = express.Router();
const translationService = getTranslationService();

// Get negotiation messages with translations
router.get('/negotiations/:negotiationId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const { language } = req.query;
    const userId = req.user?.id;

    // Verify user has access to this negotiation
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    const messages = await messageService.getMessagesByNegotiation(
      negotiationId, 
      language as string
    );

    res.json({
      success: true,
      data: {
        negotiationId,
        messages,
        totalCount: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_MESSAGES_ERROR',
        message: 'Failed to fetch messages'
      }
    });
  }
});

// Translate a specific message to a target language
router.post('/messages/:messageId/translate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const { targetLanguage } = req.body;
    const userId = req.user?.id;

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TARGET_LANGUAGE',
          message: 'Target language is required'
        }
      });
    }

    // Get message and verify access
    const message = await messageService.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    // Get negotiation to verify access
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: message.negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      },
      include: {
        product: true
      }
    });

    if (!negotiation) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this message'
        }
      });
    }

    // Check if translation already exists
    const existingTranslations = message.translations as Record<string, string>;
    if (existingTranslations[targetLanguage]) {
      return res.json({
        success: true,
        data: {
          messageId,
          originalText: message.originalText,
          originalLanguage: message.originalLanguage,
          translatedText: existingTranslations[targetLanguage],
          targetLanguage,
          cached: true
        }
      });
    }

    // Translate the message
    const translatedText = await translationService.translateText(
      message.originalText,
      message.originalLanguage,
      targetLanguage,
      {
        type: 'negotiation',
        negotiationId: message.negotiationId,
        productName: (negotiation.product.name as any)?.en || 'Product'
      }
    );

    // Update message with new translation
    const updatedTranslations = {
      ...existingTranslations,
      [targetLanguage]: translatedText
    };

    await messageService.updateMessageTranslations(messageId, updatedTranslations);

    res.json({
      success: true,
      data: {
        messageId,
        originalText: message.originalText,
        originalLanguage: message.originalLanguage,
        translatedText,
        targetLanguage,
        cached: false
      }
    });
  } catch (error) {
    console.error('Error translating message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSLATION_ERROR',
        message: 'Failed to translate message'
      }
    });
  }
});

// Detect language of text
router.post('/detect-language', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEXT',
          message: 'Valid text is required'
        }
      });
    }

    const detectedLanguage = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        text,
        detectedLanguage
      }
    });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LANGUAGE_DETECTION_ERROR',
        message: 'Failed to detect language'
      }
    });
  }
});

// Get negotiation details for chat
router.get('/negotiations/:negotiationId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const userId = req.user?.id;

    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            currency: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            preferredLanguage: true
          }
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                preferredLanguage: true
              }
            }
          }
        }
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    // Determine user role in this negotiation
    const userRole = negotiation.buyerId === userId ? 'buyer' : 'vendor';
    const otherParty = userRole === 'buyer' ? 
      { 
        id: negotiation.vendor.user.id, 
        name: negotiation.vendor.user.fullName,
        language: negotiation.vendor.user.preferredLanguage
      } : 
      { 
        id: negotiation.buyer.id, 
        name: negotiation.buyer.fullName,
        language: negotiation.buyer.preferredLanguage
      };

    res.json({
      success: true,
      data: {
        negotiation: {
          id: negotiation.id,
          status: negotiation.status,
          initialPrice: negotiation.initialPrice,
          currentOffer: negotiation.currentOffer,
          finalPrice: negotiation.finalPrice,
          buyerLanguage: negotiation.buyerLanguage,
          vendorLanguage: negotiation.vendorLanguage,
          expiresAt: negotiation.expiresAt,
          createdAt: negotiation.createdAt,
          updatedAt: negotiation.updatedAt
        },
        product: negotiation.product,
        userRole,
        otherParty
      }
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_NEGOTIATION_ERROR',
        message: 'Failed to fetch negotiation details'
      }
    });
  }
});

// Get message statistics for a negotiation
router.get('/negotiations/:negotiationId/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const userId = req.user?.id;

    // Verify access
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    const stats = await messageService.getMessageStats(negotiationId);

    res.json({
      success: true,
      data: {
        negotiationId,
        ...stats
      }
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STATS_ERROR',
        message: 'Failed to fetch message statistics'
      }
    });
  }
});

// Get negotiation status and progress
router.get('/negotiations/:negotiationId/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const userId = req.user?.id;

    // Verify access
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      },
      include: {
        buyer: { select: { id: true, fullName: true } },
        vendor: { 
          include: { 
            user: { select: { id: true, fullName: true } } 
          } 
        },
        _count: { select: { messages: true } }
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    // Get recent activity
    const recentMessages = await prisma.message.findMany({
      where: { negotiationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: { select: { id: true, fullName: true } }
      }
    });

    res.json({
      success: true,
      data: {
        negotiationId,
        status: negotiation.status,
        currentOffer: negotiation.currentOffer ? parseFloat(negotiation.currentOffer.toString()) : null,
        finalPrice: negotiation.finalPrice ? parseFloat(negotiation.finalPrice.toString()) : null,
        messageCount: negotiation._count.messages,
        lastActivity: negotiation.updatedAt,
        expiresAt: negotiation.expiresAt,
        participants: {
          buyer: negotiation.buyer,
          vendor: negotiation.vendor.user
        },
        recentActivity: recentMessages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.sender.fullName,
          messageType: msg.messageType,
          priceOffer: msg.priceOffer ? parseFloat(msg.priceOffer.toString()) : null,
          createdAt: msg.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching negotiation status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STATUS_ERROR',
        message: 'Failed to fetch negotiation status'
      }
    });
  }
});

// Get price offer history for a negotiation
router.get('/negotiations/:negotiationId/offers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const userId = req.user?.id;

    // Verify access
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    const offerHistory = await messageService.getPriceOfferHistory(negotiationId);

    res.json({
      success: true,
      data: {
        negotiationId,
        offers: offerHistory
      }
    });
  } catch (error) {
    console.error('Error fetching offer history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_OFFERS_ERROR',
        message: 'Failed to fetch offer history'
      }
    });
  }
});

// Get negotiation timeline
router.get('/negotiations/:negotiationId/timeline', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { negotiationId } = req.params;
    const userId = req.user?.id;

    // Verify access
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { vendor: { userId } }
        ]
      }
    });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: 'Negotiation not found or access denied'
        }
      });
    }

    const timeline = await messageService.getNegotiationTimeline(negotiationId);

    res.json({
      success: true,
      data: {
        negotiationId,
        timeline
      }
    });
  } catch (error) {
    console.error('Error fetching negotiation timeline:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TIMELINE_ERROR',
        message: 'Failed to fetch negotiation timeline'
      }
    });
  }
});

export default router;