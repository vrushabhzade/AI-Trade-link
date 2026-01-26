import { prisma } from '../config/database';
import { Message, MessageType } from '@prisma/client';

export interface CreateMessageData {
  negotiationId: string;
  senderId: string;
  originalText: string;
  originalLanguage: string;
  translations?: Record<string, string>;
  messageType?: MessageType;
  priceOffer?: number;
}

export interface MessageFilters {
  negotiationId?: string;
  senderId?: string;
  messageType?: MessageType;
  language?: string;
}

export class MessageService {
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    return prisma.message.create({
      data: {
        negotiationId: messageData.negotiationId,
        senderId: messageData.senderId,
        originalText: messageData.originalText,
        originalLanguage: messageData.originalLanguage,
        translations: messageData.translations || {},
        messageType: messageData.messageType || MessageType.TEXT,
        priceOffer: messageData.priceOffer,
      },
      include: {
        sender: true,
        negotiation: {
          include: {
            product: true,
            buyer: true,
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessageById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        negotiation: {
          include: {
            product: true,
            buyer: true,
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessagesByNegotiation(negotiationId: string, language?: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { negotiationId },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // If a specific language is requested, ensure translations are available
    if (language) {
      return messages.map(message => ({
        ...message,
        displayText: this.getTranslatedText(message, language),
      })) as any;
    }

    return messages;
  }

  async updateMessageTranslations(
    id: string, 
    translations: Record<string, string>
  ): Promise<Message> {
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const updatedTranslations = {
      ...(message.translations as Record<string, string>),
      ...translations,
    };

    return prisma.message.update({
      where: { id },
      data: {
        translations: updatedTranslations,
      },
      include: {
        sender: true,
        negotiation: true,
      },
    });
  }

  async getMessages(filters: MessageFilters): Promise<Message[]> {
    const where: any = {};

    if (filters.negotiationId) where.negotiationId = filters.negotiationId;
    if (filters.senderId) where.senderId = filters.senderId;
    if (filters.messageType) where.messageType = filters.messageType;

    return prisma.message.findMany({
      where,
      include: {
        sender: true,
        negotiation: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentMessages(userId: string, limit: number = 20): Promise<Message[]> {
    // Get recent messages from negotiations where the user is involved
    const query = `
      SELECT m.*, u.full_name as sender_name, p.name as product_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      JOIN negotiations n ON m.negotiation_id = n.id
      JOIN products p ON n.product_id = p.id
      WHERE n.buyer_id = $1 OR n.vendor_id = (
        SELECT id FROM vendors WHERE user_id = $1
      )
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    return prisma.$queryRawUnsafe(query, userId, limit) as Promise<Message[]>;
  }

  async getMessageStats(negotiationId: string): Promise<{
    totalMessages: number;
    messagesByType: Record<MessageType, number>;
    averageResponseTime: number | null;
  }> {
    const messages = await prisma.message.findMany({
      where: { negotiationId },
      orderBy: { createdAt: 'asc' },
    });

    const totalMessages = messages.length;
    const messagesByType = messages.reduce((acc, message) => {
      acc[message.messageType] = (acc[message.messageType] || 0) + 1;
      return acc;
    }, {} as Record<MessageType, number>);

    // Calculate average response time between messages
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];

      // Only calculate response time if messages are from different senders
      if (currentMessage.senderId !== previousMessage.senderId) {
        const responseTime = currentMessage.createdAt.getTime() - previousMessage.createdAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const averageResponseTime = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount / 1000 / 60) // Convert to minutes
      : null;

    return {
      totalMessages,
      messagesByType,
      averageResponseTime,
    };
  }

  async deleteMessage(id: string): Promise<void> {
    await prisma.message.delete({
      where: { id },
    });
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    // This would require a read status tracking system
    // For now, we'll return 0 as a placeholder
    return 0;
  }

  private getTranslatedText(message: Message, language: string): string {
    const translations = message.translations as Record<string, string>;
    
    // Return translation if available, otherwise return original text
    return translations[language] || message.originalText;
  }

  async searchMessages(
    negotiationId: string, 
    query: string, 
    language?: string
  ): Promise<Message[]> {
    const searchQuery = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.negotiation_id = $1 
      AND (
        m.original_text ILIKE $2 OR
        m.translations::text ILIKE $2
      )
      ORDER BY m.created_at DESC
    `;

    return prisma.$queryRawUnsafe(
      searchQuery, 
      negotiationId, 
      `%${query}%`
    ) as Promise<Message[]>;
  }

  /**
   * Get price offer history for a negotiation
   */
  async getPriceOfferHistory(negotiationId: string): Promise<Array<{
    id: string;
    senderId: string;
    senderName: string;
    priceOffer: number;
    messageType: MessageType;
    createdAt: Date;
  }>> {
    const messages = await prisma.message.findMany({
      where: {
        negotiationId,
        priceOffer: { not: null }
      },
      include: {
        sender: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.fullName,
      priceOffer: parseFloat(msg.priceOffer!.toString()),
      messageType: msg.messageType,
      createdAt: msg.createdAt
    }));
  }

  /**
   * Get negotiation timeline with key events
   */
  async getNegotiationTimeline(negotiationId: string): Promise<Array<{
    id: string;
    type: 'message' | 'offer' | 'status_change';
    description: string;
    senderId?: string;
    senderName?: string;
    data?: any;
    createdAt: Date;
  }>> {
    // Get all messages for the negotiation
    const messages = await prisma.message.findMany({
      where: { negotiationId },
      include: {
        sender: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get negotiation status changes (would need to be tracked in a separate table in production)
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        buyer: { select: { id: true, fullName: true } },
        vendor: { include: { user: { select: { id: true, fullName: true } } } }
      }
    });

    const timeline: Array<{
      id: string;
      type: 'message' | 'offer' | 'status_change';
      description: string;
      senderId?: string;
      senderName?: string;
      data?: any;
      createdAt: Date;
    }> = [];

    // Add negotiation creation event
    if (negotiation) {
      timeline.push({
        id: `negotiation-${negotiation.id}`,
        type: 'status_change',
        description: 'Negotiation started',
        senderId: negotiation.buyerId,
        senderName: negotiation.buyer.fullName,
        data: { initialPrice: parseFloat(negotiation.initialPrice.toString()) },
        createdAt: negotiation.createdAt
      });
    }

    // Add message events
    messages.forEach(msg => {
      if (msg.priceOffer) {
        timeline.push({
          id: msg.id,
          type: 'offer',
          description: `${msg.messageType === 'OFFER' ? 'Initial offer' : 'Counter offer'}: ${msg.priceOffer}`,
          senderId: msg.senderId,
          senderName: msg.sender.fullName,
          data: { 
            priceOffer: parseFloat(msg.priceOffer.toString()),
            messageType: msg.messageType 
          },
          createdAt: msg.createdAt
        });
      } else {
        timeline.push({
          id: msg.id,
          type: 'message',
          description: msg.originalText.substring(0, 100) + (msg.originalText.length > 100 ? '...' : ''),
          senderId: msg.senderId,
          senderName: msg.sender.fullName,
          data: { messageType: msg.messageType },
          createdAt: msg.createdAt
        });
      }
    });

    // Add final status if negotiation is completed
    if (negotiation && negotiation.status !== 'ACTIVE') {
      timeline.push({
        id: `status-${negotiation.id}`,
        type: 'status_change',
        description: `Negotiation ${negotiation.status.toLowerCase()}`,
        data: { 
          status: negotiation.status,
          finalPrice: negotiation.finalPrice ? parseFloat(negotiation.finalPrice.toString()) : null
        },
        createdAt: negotiation.updatedAt
      });
    }

    return timeline.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Create system message for negotiation events
   */
  async createSystemMessage(
    negotiationId: string,
    messageText: string,
    eventType: 'offer_accepted' | 'offer_rejected' | 'negotiation_expired' | 'agreement_confirmed',
    data?: any
  ): Promise<Message> {
    return this.createMessage({
      negotiationId,
      senderId: 'system', // Special system user ID
      originalText: messageText,
      originalLanguage: 'en',
      messageType: MessageType.TEXT,
      ...data
    });
  }
}

export const messageService = new MessageService();