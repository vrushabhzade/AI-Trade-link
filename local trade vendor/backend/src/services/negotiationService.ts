import { prisma } from '../config/database';
import { Negotiation, NegotiationStatus } from '@prisma/client';
import { getPriceAnalysisService } from './priceAnalysisService';

export interface CreateNegotiationData {
  productId: string;
  buyerId: string;
  vendorId: string;
  initialPrice: number;
  buyerLanguage: string;
  vendorLanguage: string;
  expiresAt?: Date;
}

export interface UpdateNegotiationData {
  status?: NegotiationStatus;
  currentOffer?: number;
  finalPrice?: number;
  expiresAt?: Date;
}

export interface NegotiationFilters {
  buyerId?: string;
  vendorId?: string;
  productId?: string;
  status?: NegotiationStatus;
  language?: string;
}

export interface NegotiationLifecycleEvent {
  negotiationId: string;
  eventType: 'created' | 'offer_made' | 'counter_offer' | 'accepted' | 'rejected' | 'expired';
  userId: string;
  data?: any;
  timestamp: Date;
}

export interface AgreementTracking {
  negotiationId: string;
  agreedPrice: number;
  agreedTerms?: Record<string, any>;
  agreementDate: Date;
  deliveryTerms?: string;
  paymentTerms?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'disputed';
}

export class NegotiationService {
  private priceAnalysisService = getPriceAnalysisService();
  private lifecycleEvents: NegotiationLifecycleEvent[] = [];

  async createNegotiation(negotiationData: CreateNegotiationData): Promise<Negotiation> {
    // Set default expiration to 7 days from now if not provided
    const expiresAt = negotiationData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const negotiation = await prisma.negotiation.create({
      data: {
        productId: negotiationData.productId,
        buyerId: negotiationData.buyerId,
        vendorId: negotiationData.vendorId,
        initialPrice: negotiationData.initialPrice,
        currentOffer: negotiationData.initialPrice,
        buyerLanguage: negotiationData.buyerLanguage,
        vendorLanguage: negotiationData.vendorLanguage,
        expiresAt,
      },
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Track lifecycle event
    await this.trackLifecycleEvent({
      negotiationId: negotiation.id,
      eventType: 'created',
      userId: negotiationData.buyerId,
      data: {
        initialPrice: negotiationData.initialPrice,
        productId: negotiationData.productId
      },
      timestamp: new Date()
    });

    return negotiation;
  }

  async getNegotiationById(id: string): Promise<Negotiation | null> {
    return prisma.negotiation.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
          },
        },
      },
    });
  }

  async updateNegotiation(id: string, updateData: UpdateNegotiationData): Promise<Negotiation> {
    return prisma.negotiation.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getNegotiations(filters: NegotiationFilters): Promise<Negotiation[]> {
    const where: any = {};

    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status;

    return prisma.negotiation.findMany({
      where,
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async makeCounterOffer(id: string, counterOffer: number): Promise<Negotiation> {
    const negotiation = await this.updateNegotiation(id, {
      currentOffer: counterOffer,
    });

    // Track lifecycle event
    await this.trackLifecycleEvent({
      negotiationId: id,
      eventType: 'counter_offer',
      userId: 'system', // Will be updated by the calling route with actual user ID
      data: { counterOffer },
      timestamp: new Date()
    });

    return negotiation;
  }

  async acceptNegotiation(id: string, finalPrice: number): Promise<Negotiation> {
    const negotiation = await this.updateNegotiation(id, {
      status: NegotiationStatus.ACCEPTED,
      finalPrice,
    });

    // Track lifecycle event
    await this.trackLifecycleEvent({
      negotiationId: id,
      eventType: 'accepted',
      userId: 'system', // Will be updated by the calling route with actual user ID
      data: { finalPrice },
      timestamp: new Date()
    });

    // Create agreement tracking record
    await this.createAgreementTracking({
      negotiationId: id,
      agreedPrice: finalPrice,
      agreementDate: new Date(),
      status: 'pending'
    });

    return negotiation;
  }

  async rejectNegotiation(id: string): Promise<Negotiation> {
    const negotiation = await this.updateNegotiation(id, {
      status: NegotiationStatus.REJECTED,
    });

    // Track lifecycle event
    await this.trackLifecycleEvent({
      negotiationId: id,
      eventType: 'rejected',
      userId: 'system', // Will be updated by the calling route with actual user ID
      data: {},
      timestamp: new Date()
    });

    return negotiation;
  }

  async expireNegotiation(id: string): Promise<Negotiation> {
    return this.updateNegotiation(id, {
      status: NegotiationStatus.EXPIRED,
    });
  }

  async getActiveNegotiationsForUser(userId: string, role: 'buyer' | 'vendor'): Promise<Negotiation[]> {
    const where = {
      status: NegotiationStatus.ACTIVE,
      ...(role === 'buyer' ? { buyerId: userId } : { vendorId: userId }),
    };

    return prisma.negotiation.findMany({
      where,
      include: {
        product: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async expireOldNegotiations(): Promise<number> {
    const result = await prisma.negotiation.updateMany({
      where: {
        status: NegotiationStatus.ACTIVE,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: NegotiationStatus.EXPIRED,
      },
    });

    return result.count;
  }

  async getNegotiationStats(userId: string, role: 'buyer' | 'vendor'): Promise<{
    total: number;
    active: number;
    accepted: number;
    rejected: number;
    expired: number;
  }> {
    const where = role === 'buyer' ? { buyerId: userId } : { vendorId: userId };

    const [total, active, accepted, rejected, expired] = await Promise.all([
      prisma.negotiation.count({ where }),
      prisma.negotiation.count({ where: { ...where, status: NegotiationStatus.ACTIVE } }),
      prisma.negotiation.count({ where: { ...where, status: NegotiationStatus.ACCEPTED } }),
      prisma.negotiation.count({ where: { ...where, status: NegotiationStatus.REJECTED } }),
      prisma.negotiation.count({ where: { ...where, status: NegotiationStatus.EXPIRED } }),
    ]);

    return { total, active, accepted, rejected, expired };
  }

  /**
   * Track negotiation lifecycle events
   */
  private async trackLifecycleEvent(event: NegotiationLifecycleEvent): Promise<void> {
    // Store in memory for now - in production, this would go to a proper event store
    this.lifecycleEvents.push(event);
    
    // Log the event
    console.log(`Negotiation lifecycle event: ${event.eventType} for negotiation ${event.negotiationId} by user ${event.userId}`);
    
    // Here you could also emit WebSocket events, send notifications, etc.
  }

  /**
   * Get negotiation lifecycle events
   */
  async getLifecycleEvents(negotiationId: string): Promise<NegotiationLifecycleEvent[]> {
    return this.lifecycleEvents.filter(event => event.negotiationId === negotiationId);
  }

  /**
   * Create agreement tracking record
   */
  private async createAgreementTracking(agreement: AgreementTracking): Promise<void> {
    // In a real implementation, this would create a record in an agreements table
    console.log(`Agreement created for negotiation ${agreement.negotiationId} at price ${agreement.agreedPrice}`);
    
    // For now, we'll store this as metadata in the negotiation
    await prisma.negotiation.update({
      where: { id: agreement.negotiationId },
      data: {
        // We could add an agreements JSON field to store this data
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get AI-powered response suggestions for a negotiation
   */
  async getResponseSuggestions(negotiationId: string, userId: string): Promise<any> {
    const negotiation = await this.getNegotiationById(negotiationId);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    // Build negotiation context
    const negotiationHistory = ((negotiation as any).messages || [])
      .filter((msg: any) => msg.priceOffer)
      .map((msg: any) => ({
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

    // Get AI suggestions from price analysis service
    return await this.priceAnalysisService.suggestCounterOffer(context);
  }

  /**
   * Auto-expire old negotiations
   */
  async processExpirations(): Promise<number> {
    const expiredCount = await this.expireOldNegotiations();
    
    // Track lifecycle events for expired negotiations
    const expiredNegotiations = await prisma.negotiation.findMany({
      where: {
        status: NegotiationStatus.EXPIRED,
        updatedAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      }
    });

    for (const negotiation of expiredNegotiations) {
      await this.trackLifecycleEvent({
        negotiationId: negotiation.id,
        eventType: 'expired',
        userId: 'system',
        data: {},
        timestamp: new Date()
      });
    }

    return expiredCount;
  }

  /**
   * Get negotiation insights and analytics
   */
  async getNegotiationInsights(userId: string, role: 'buyer' | 'vendor'): Promise<{
    averageNegotiationTime: number;
    successRate: number;
    averageDiscount: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    const where = role === 'buyer' ? { buyerId: userId } : { vendorId: userId };
    
    const negotiations = await prisma.negotiation.findMany({
      where,
      include: {
        product: true,
        messages: true
      }
    });

    // Calculate average negotiation time (in hours)
    const completedNegotiations = negotiations.filter(n => 
      n.status === NegotiationStatus.ACCEPTED || n.status === NegotiationStatus.REJECTED
    );
    
    const averageNegotiationTime = completedNegotiations.length > 0
      ? completedNegotiations.reduce((sum, n) => {
          const duration = n.updatedAt.getTime() - n.createdAt.getTime();
          return sum + (duration / (1000 * 60 * 60)); // Convert to hours
        }, 0) / completedNegotiations.length
      : 0;

    // Calculate success rate
    const successfulNegotiations = negotiations.filter(n => n.status === NegotiationStatus.ACCEPTED);
    const successRate = negotiations.length > 0 
      ? (successfulNegotiations.length / negotiations.length) * 100 
      : 0;

    // Calculate average discount
    const averageDiscount = successfulNegotiations.length > 0
      ? successfulNegotiations.reduce((sum, n) => {
          const initialPrice = parseFloat(n.initialPrice.toString());
          const finalPrice = parseFloat(n.finalPrice?.toString() || '0');
          const discount = ((initialPrice - finalPrice) / initialPrice) * 100;
          return sum + discount;
        }, 0) / successfulNegotiations.length
      : 0;

    // Get top categories
    const categoryCount = negotiations.reduce((acc, n) => {
      const category = n.product.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageNegotiationTime,
      successRate,
      averageDiscount,
      topCategories
    };
  }
}

export const negotiationService = new NegotiationService();