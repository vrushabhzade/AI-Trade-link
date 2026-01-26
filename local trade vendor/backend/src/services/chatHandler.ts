import { Server, Socket } from 'socket.io';
import { messageService } from './messageService';
import { negotiationService } from './negotiationService';
import { getTranslationService } from './translationService';
import { prisma } from '../config/database';
import { NegotiationStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

export interface SendMessageData {
  negotiationId: string;
  text: string;
  targetLanguage: string;
  priceOffer?: number;
  context?: {
    type: 'product' | 'negotiation' | 'general';
    productName?: string;
    negotiationId?: string;
  };
}

export interface PriceOfferData {
  negotiationId: string;
  amount: number;
  message?: string;
  offerType: 'initial' | 'counter' | 'final';
}

export interface NegotiationStatusUpdate {
  negotiationId: string;
  status: 'accepted' | 'rejected' | 'expired';
  finalPrice?: number;
  message?: string;
}

export interface AgreementConfirmation {
  negotiationId: string;
  agreedPrice: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  additionalNotes?: string;
}

export interface UserPresence {
  userId: string;
  socketId: string;
  negotiationId?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export class ChatHandler {
  private io: Server;
  private translationService = getTranslationService();
  private userPresence = new Map<string, UserPresence>();
  private socketToUser = new Map<string, string>();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      // Authenticate user on connection
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          const userId = decoded.userId;
          
          // Store user-socket mapping
          this.socketToUser.set(socket.id, userId);
          
          // Update user presence
          this.updateUserPresence(userId, socket.id, true);
          
          socket.emit('authenticated', { userId });
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
        } catch (error) {
          socket.emit('authentication-error', { error: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join negotiation room
      socket.on('join-negotiation', async (negotiationId: string) => {
        const userId = this.socketToUser.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          // Verify user is part of this negotiation
          const negotiation = await prisma.negotiation.findFirst({
            where: {
              id: negotiationId,
              OR: [
                { buyerId: userId },
                { vendor: { userId } }
              ]
            },
            include: {
              product: true,
              buyer: true,
              vendor: { include: { user: true } }
            }
          });

          if (!negotiation) {
            socket.emit('error', { message: 'Negotiation not found or access denied' });
            return;
          }

          socket.join(`negotiation-${negotiationId}`);
          
          // Update user presence with negotiation
          this.updateUserPresence(userId, socket.id, true, negotiationId);
          
          // Send negotiation history
          const history = await messageService.getMessagesByNegotiation(negotiationId);
          socket.emit('negotiation-history', {
            negotiation,
            messages: history
          });

          // Notify other participants that user joined
          socket.to(`negotiation-${negotiationId}`).emit('user-joined', {
            userId,
            negotiationId
          });

          console.log(`User ${userId} joined negotiation ${negotiationId}`);
        } catch (error) {
          console.error('Error joining negotiation:', error);
          socket.emit('error', { message: 'Failed to join negotiation' });
        }
      });

      // Leave negotiation room
      socket.on('leave-negotiation', (negotiationId: string) => {
        const userId = this.socketToUser.get(socket.id);
        if (!userId) return;

        socket.leave(`negotiation-${negotiationId}`);
        
        // Update user presence
        this.updateUserPresence(userId, socket.id, true);
        
        // Notify other participants that user left
        socket.to(`negotiation-${negotiationId}`).emit('user-left', {
          userId,
          negotiationId
        });

        console.log(`User ${userId} left negotiation ${negotiationId}`);
      });

      // Handle message sending
      socket.on('send-message', async (data: SendMessageData) => {
        await this.handleMessage(socket, data);
      });

      // Handle price offers
      socket.on('price-offer', async (data: PriceOfferData) => {
        await this.handlePriceOffer(socket, data);
      });

      // Handle negotiation status updates
      socket.on('negotiation-status-update', async (data: NegotiationStatusUpdate) => {
        await this.handleNegotiationStatusUpdate(socket, data);
      });

      // Handle agreement confirmation
      socket.on('agreement-confirmation', async (data: AgreementConfirmation) => {
        await this.handleAgreementConfirmation(socket, data);
      });

      // Request negotiation suggestions
      socket.on('request-suggestions', async (negotiationId: string) => {
        await this.handleSuggestionRequest(socket, negotiationId);
      });

      // Handle typing indicators
      socket.on('typing-start', (negotiationId: string) => {
        const userId = this.socketToUser.get(socket.id);
        if (!userId) return;

        socket.to(`negotiation-${negotiationId}`).emit('user-typing', {
          userId,
          negotiationId,
          isTyping: true
        });
      });

      socket.on('typing-stop', (negotiationId: string) => {
        const userId = this.socketToUser.get(socket.id);
        if (!userId) return;

        socket.to(`negotiation-${negotiationId}`).emit('user-typing', {
          userId,
          negotiationId,
          isTyping: false
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          this.updateUserPresence(userId, socket.id, false);
          this.socketToUser.delete(socket.id);
          
          // Notify all rooms that user went offline
          socket.broadcast.emit('user-offline', { userId });
        }
        console.log('User disconnected:', socket.id);
      });
    });
  }

  private async handleMessage(socket: Socket, data: SendMessageData): Promise<void> {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { negotiationId, text, targetLanguage, priceOffer, context } = data;

      // Get negotiation details to determine recipient language
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          id: negotiationId,
          OR: [
            { buyerId: userId },
            { vendor: { userId } }
          ]
        },
        include: {
          buyer: true,
          vendor: { include: { user: true } }
        }
      });

      if (!negotiation) {
        socket.emit('error', { message: 'Negotiation not found' });
        return;
      }

      // Detect sender's language
      const senderLanguage = await this.translationService.detectLanguage(text);
      
      // Determine recipient's language
      const isFromBuyer = negotiation.buyerId === userId;
      const recipientLanguage = isFromBuyer ? negotiation.vendorLanguage : negotiation.buyerLanguage;
      
      // Translate message if needed
      let translation = text;
      if (senderLanguage !== recipientLanguage) {
        translation = await this.translationService.translateText(
          text,
          senderLanguage,
          recipientLanguage,
          context || { type: 'negotiation', negotiationId }
        );
      }

      // Create message in database
      const message = await messageService.createMessage({
        negotiationId,
        senderId: userId,
        originalText: text,
        originalLanguage: senderLanguage,
        translations: { [recipientLanguage]: translation },
        messageType: priceOffer ? 'OFFER' : 'TEXT',
        priceOffer
      });

      // Get user info for sender name
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true }
      });

      // Broadcast message to negotiation room
      this.io.to(`negotiation-${negotiationId}`).emit('new-message', {
        id: message.id,
        negotiationId,
        senderId: userId,
        senderName: sender?.fullName || 'Unknown',
        originalText: text,
        originalLanguage: senderLanguage,
        translations: { [recipientLanguage]: translation },
        messageType: message.messageType,
        priceOffer: message.priceOffer,
        timestamp: message.createdAt
      });

      console.log(`Message sent in negotiation ${negotiationId} by user ${userId}`);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message-error', { 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    }
  }

  private async handlePriceOffer(socket: Socket, data: PriceOfferData): Promise<void> {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { negotiationId, amount, message: offerMessage, offerType } = data;

      // Validate negotiation exists and is active
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          id: negotiationId,
          status: NegotiationStatus.ACTIVE,
          OR: [
            { buyerId: userId },
            { vendor: { userId } }
          ]
        },
        include: {
          buyer: true,
          vendor: { include: { user: true } },
          product: true
        }
      });

      if (!negotiation) {
        socket.emit('price-offer-error', { 
          error: 'Negotiation not found or not active' 
        });
        return;
      }

      // Update negotiation with new offer
      const updatedNegotiation = await negotiationService.makeCounterOffer(negotiationId, amount);

      // Determine message type based on offer type
      let messageType: 'OFFER' | 'COUNTER_OFFER' = 'COUNTER_OFFER';
      if (offerType === 'initial') {
        messageType = 'OFFER';
      }

      // Create offer message
      const messageText = offerMessage || `${offerType === 'initial' ? 'Initial offer' : 'Counter offer'}: ${amount} ${negotiation.product.currency}`;
      
      await this.handleMessage(socket, {
        negotiationId,
        text: messageText,
        targetLanguage: negotiation.buyerId === userId ? negotiation.vendorLanguage : negotiation.buyerLanguage,
        priceOffer: amount,
        context: { type: 'negotiation', negotiationId }
      });

      // Broadcast price offer update with enhanced data
      this.io.to(`negotiation-${negotiationId}`).emit('price-offer-updated', {
        negotiationId,
        currentOffer: amount,
        offeredBy: userId,
        offerType,
        previousOffer: parseFloat(negotiation.currentOffer?.toString() || '0'),
        timestamp: new Date(),
        negotiationStatus: updatedNegotiation.status
      });

      // Send AI suggestions to the recipient (if they're a vendor)
      const recipientId = negotiation.buyerId === userId ? negotiation.vendor.userId : negotiation.buyerId;
      const recipientIsVendor = negotiation.vendor.userId === recipientId;
      
      if (recipientIsVendor) {
        try {
          const suggestions = await negotiationService.getResponseSuggestions(negotiationId, recipientId);
          this.io.to(`negotiation-${negotiationId}`).emit('ai-suggestions', {
            negotiationId,
            suggestions,
            recipientId
          });
        } catch (error) {
          console.warn('Failed to get AI suggestions:', error);
        }
      }

      console.log(`Price offer ${amount} (${offerType}) made in negotiation ${negotiationId} by user ${userId}`);
    } catch (error) {
      console.error('Error handling price offer:', error);
      socket.emit('price-offer-error', { 
        error: error instanceof Error ? error.message : 'Failed to make price offer' 
      });
    }
  }

  private async handleNegotiationStatusUpdate(socket: Socket, data: NegotiationStatusUpdate): Promise<void> {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { negotiationId, status, finalPrice, message } = data;

      // Validate negotiation exists and user is participant
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          id: negotiationId,
          OR: [
            { buyerId: userId },
            { vendor: { userId } }
          ]
        },
        include: {
          buyer: true,
          vendor: { include: { user: true } },
          product: true
        }
      });

      if (!negotiation) {
        socket.emit('negotiation-error', { 
          error: 'Negotiation not found or access denied' 
        });
        return;
      }

      let updatedNegotiation;
      
      // Update negotiation status
      if (status === 'accepted') {
        updatedNegotiation = await negotiationService.acceptNegotiation(
          negotiationId, 
          finalPrice || parseFloat(negotiation.currentOffer?.toString() || '0')
        );
      } else if (status === 'rejected') {
        updatedNegotiation = await negotiationService.rejectNegotiation(negotiationId);
      } else {
        socket.emit('negotiation-error', { 
          error: 'Invalid status update' 
        });
        return;
      }

      // Create status update message
      if (message) {
        await this.handleMessage(socket, {
          negotiationId,
          text: message,
          targetLanguage: negotiation.buyerId === userId ? negotiation.vendorLanguage : negotiation.buyerLanguage,
          context: { type: 'negotiation', negotiationId }
        });
      }

      // Broadcast status update
      this.io.to(`negotiation-${negotiationId}`).emit('negotiation-status-updated', {
        negotiationId,
        status: updatedNegotiation.status,
        finalPrice: updatedNegotiation.finalPrice,
        updatedBy: userId,
        timestamp: new Date()
      });

      console.log(`Negotiation ${negotiationId} ${status} by user ${userId}`);
    } catch (error) {
      console.error('Error handling negotiation status update:', error);
      socket.emit('negotiation-error', { 
        error: error instanceof Error ? error.message : 'Failed to update negotiation status' 
      });
    }
  }

  private async handleAgreementConfirmation(socket: Socket, data: AgreementConfirmation): Promise<void> {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { negotiationId, agreedPrice, deliveryTerms, paymentTerms, additionalNotes } = data;

      // Validate negotiation is accepted
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          id: negotiationId,
          status: NegotiationStatus.ACCEPTED,
          OR: [
            { buyerId: userId },
            { vendor: { userId } }
          ]
        },
        include: {
          buyer: true,
          vendor: { include: { user: true } },
          product: true
        }
      });

      if (!negotiation) {
        socket.emit('agreement-error', { 
          error: 'Negotiation not found, not accepted, or access denied' 
        });
        return;
      }

      // Create agreement confirmation message
      const agreementMessage = `Agreement confirmed! Price: ${agreedPrice} ${negotiation.product.currency}${deliveryTerms ? `, Delivery: ${deliveryTerms}` : ''}${paymentTerms ? `, Payment: ${paymentTerms}` : ''}${additionalNotes ? `, Notes: ${additionalNotes}` : ''}`;
      
      await this.handleMessage(socket, {
        negotiationId,
        text: agreementMessage,
        targetLanguage: negotiation.buyerId === userId ? negotiation.vendorLanguage : negotiation.buyerLanguage,
        context: { type: 'negotiation', negotiationId }
      });

      // Broadcast agreement confirmation
      this.io.to(`negotiation-${negotiationId}`).emit('agreement-confirmed', {
        negotiationId,
        agreedPrice,
        deliveryTerms,
        paymentTerms,
        additionalNotes,
        confirmedBy: userId,
        timestamp: new Date()
      });

      console.log(`Agreement confirmed for negotiation ${negotiationId} by user ${userId}`);
    } catch (error) {
      console.error('Error handling agreement confirmation:', error);
      socket.emit('agreement-error', { 
        error: error instanceof Error ? error.message : 'Failed to confirm agreement' 
      });
    }
  }

  private async handleSuggestionRequest(socket: Socket, negotiationId: string): Promise<void> {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Validate user is part of negotiation
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
        socket.emit('suggestion-error', { 
          error: 'Negotiation not found or access denied' 
        });
        return;
      }

      // Get AI suggestions
      const suggestions = await negotiationService.getResponseSuggestions(negotiationId, userId);
      
      socket.emit('ai-suggestions-response', {
        negotiationId,
        suggestions,
        timestamp: new Date()
      });

      console.log(`AI suggestions requested for negotiation ${negotiationId} by user ${userId}`);
    } catch (error) {
      console.error('Error handling suggestion request:', error);
      socket.emit('suggestion-error', { 
        error: error instanceof Error ? error.message : 'Failed to get suggestions' 
      });
    }
  }

  private updateUserPresence(
    userId: string, 
    socketId: string, 
    isOnline: boolean, 
    negotiationId?: string
  ): void {
    this.userPresence.set(userId, {
      userId,
      socketId,
      negotiationId,
      isOnline,
      lastSeen: new Date()
    });

    // Broadcast presence update
    this.io.emit('user-presence-updated', {
      userId,
      isOnline,
      negotiationId,
      lastSeen: new Date()
    });
  }

  public getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresence.get(userId);
  }

  public getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(user => user.isOnline);
  }

  public getUsersInNegotiation(negotiationId: string): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(
      user => user.isOnline && user.negotiationId === negotiationId
    );
  }

  /**
   * Get negotiation status and progress
   */
  public async getNegotiationStatus(negotiationId: string): Promise<{
    status: string;
    currentOffer?: number;
    messageCount: number;
    lastActivity: Date;
    participants: { buyer: any; vendor: any };
  } | null> {
    try {
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          buyer: { select: { id: true, fullName: true } },
          vendor: { 
            include: { 
              user: { select: { id: true, fullName: true } } 
            } 
          },
          messages: { select: { id: true } },
          _count: { select: { messages: true } }
        }
      });

      if (!negotiation) return null;

      return {
        status: negotiation.status,
        currentOffer: negotiation.currentOffer ? parseFloat(negotiation.currentOffer.toString()) : undefined,
        messageCount: negotiation._count.messages,
        lastActivity: negotiation.updatedAt,
        participants: {
          buyer: negotiation.buyer,
          vendor: negotiation.vendor.user
        }
      };
    } catch (error) {
      console.error('Error getting negotiation status:', error);
      return null;
    }
  }

  /**
   * Broadcast negotiation progress update to all participants
   */
  public async broadcastNegotiationProgress(negotiationId: string): Promise<void> {
    const status = await this.getNegotiationStatus(negotiationId);
    if (status) {
      this.io.to(`negotiation-${negotiationId}`).emit('negotiation-progress', {
        negotiationId,
        ...status,
        timestamp: new Date()
      });
    }
  }

  /**
   * Send notification to offline users about negotiation updates
   */
  public async notifyOfflineUsers(negotiationId: string, eventType: string, data: any): Promise<void> {
    // In a real implementation, this would send push notifications, emails, etc.
    // For now, we'll just log the notification
    console.log(`Notification for negotiation ${negotiationId}: ${eventType}`, data);
    
    // You could integrate with services like:
    // - Push notification services (Firebase, OneSignal)
    // - Email services (SendGrid, AWS SES)
    // - SMS services (Twilio)
  }
}