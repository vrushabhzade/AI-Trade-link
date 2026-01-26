import { io, Socket } from 'socket.io-client';
import { Message, Negotiation } from '../types';

export interface ChatMessage extends Message {
  senderName: string;
  isFromCurrentUser: boolean;
  displayText: string;
}

export interface NegotiationDetails {
  negotiation: Negotiation;
  product: {
    id: string;
    name: Record<string, string>;
    basePrice: number;
    currency: string;
    images: string[];
  };
  userRole: 'buyer' | 'vendor';
  otherParty: {
    id: string;
    name: string;
    language: string;
  };
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  negotiationId?: string;
  lastSeen: Date;
}

export interface TypingIndicator {
  userId: string;
  negotiationId: string;
  isTyping: boolean;
}

export class ChatService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private currentUserLanguage: string = 'en';
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private presenceHandlers: ((presence: UserPresence) => void)[] = [];
  private typingHandlers: ((typing: TypingIndicator) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect(): void {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    this.socket = io(backendUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('authenticated', (data: { userId: string }) => {
      console.log('Chat authentication successful:', data.userId);
    });

    this.socket.on('authentication-error', (data: { error: string }) => {
      console.error('Chat authentication failed:', data.error);
      this.notifyError(`Authentication failed: ${data.error}`);
    });

    this.socket.on('new-message', (data: any) => {
      const chatMessage: ChatMessage = {
        ...data,
        senderName: data.senderName || 'Unknown',
        isFromCurrentUser: data.senderId === this.currentUserId,
        displayText: this.getDisplayText(data),
        createdAt: new Date(data.timestamp)
      };
      
      this.messageHandlers.forEach(handler => handler(chatMessage));
    });

    this.socket.on('user-presence-updated', (data: UserPresence) => {
      this.presenceHandlers.forEach(handler => handler(data));
    });

    this.socket.on('user-typing', (data: TypingIndicator) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('price-offer-updated', (data: any) => {
      console.log('Price offer updated:', data);
      // This could trigger a UI update for the negotiation status
    });

    this.socket.on('error', (data: { message: string }) => {
      this.notifyError(data.message);
    });

    this.socket.on('message-error', (data: { error: string }) => {
      this.notifyError(`Message error: ${data.error}`);
    });

    this.socket.on('price-offer-error', (data: { error: string }) => {
      this.notifyError(`Price offer error: ${data.error}`);
    });
  }

  public authenticate(token: string, userId: string, userLanguage: string = 'en'): void {
    this.currentUserId = userId;
    this.currentUserLanguage = userLanguage;
    
    if (!this.socket?.connected) {
      this.socket?.connect();
    }
    
    this.socket?.emit('authenticate', token);
  }

  public joinNegotiation(negotiationId: string): void {
    this.socket?.emit('join-negotiation', negotiationId);
  }

  public leaveNegotiation(negotiationId: string): void {
    this.socket?.emit('leave-negotiation', negotiationId);
  }

  public sendMessage(
    negotiationId: string, 
    text: string, 
    targetLanguage: string,
    priceOffer?: number
  ): void {
    this.socket?.emit('send-message', {
      negotiationId,
      text,
      targetLanguage,
      priceOffer,
      context: {
        type: 'negotiation',
        negotiationId
      }
    });
  }

  public sendPriceOffer(negotiationId: string, amount: number, message?: string): void {
    this.socket?.emit('price-offer', {
      negotiationId,
      amount,
      message
    });
  }

  public startTyping(negotiationId: string): void {
    this.socket?.emit('typing-start', negotiationId);
  }

  public stopTyping(negotiationId: string): void {
    this.socket?.emit('typing-stop', negotiationId);
  }

  public onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  public onPresenceUpdate(handler: (presence: UserPresence) => void): () => void {
    this.presenceHandlers.push(handler);
    return () => {
      const index = this.presenceHandlers.indexOf(handler);
      if (index > -1) {
        this.presenceHandlers.splice(index, 1);
      }
    };
  }

  public onTyping(handler: (typing: TypingIndicator) => void): () => void {
    this.typingHandlers.push(handler);
    return () => {
      const index = this.typingHandlers.indexOf(handler);
      if (index > -1) {
        this.typingHandlers.splice(index, 1);
      }
    };
  }

  public onError(handler: (error: string) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.currentUserId = null;
    this.messageHandlers = [];
    this.presenceHandlers = [];
    this.typingHandlers = [];
    this.errorHandlers = [];
  }

  private getDisplayText(messageData: any): string {
    // Show translation if available for current user's language
    if (messageData.translations && messageData.translations[this.currentUserLanguage]) {
      return messageData.translations[this.currentUserLanguage];
    }
    
    // Fall back to original text
    return messageData.originalText || messageData.text;
  }

  private notifyError(error: string): void {
    console.error('Chat error:', error);
    this.errorHandlers.forEach(handler => handler(error));
  }

  // REST API methods for fetching data
  public async getNegotiationDetails(negotiationId: string): Promise<NegotiationDetails> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat/negotiations/${negotiationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch negotiation details');
    }

    const result = await response.json();
    return result.data;
  }

  public async getMessages(negotiationId: string, language?: string): Promise<ChatMessage[]> {
    const token = localStorage.getItem('token');
    const url = new URL(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat/negotiations/${negotiationId}/messages`);
    
    if (language) {
      url.searchParams.set('language', language);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const result = await response.json();
    return result.data.messages.map((msg: any) => ({
      ...msg,
      senderName: msg.sender?.fullName || 'Unknown',
      isFromCurrentUser: msg.senderId === this.currentUserId,
      displayText: this.getDisplayText(msg),
      createdAt: new Date(msg.createdAt)
    }));
  }

  public async translateMessage(messageId: string, targetLanguage: string): Promise<string> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat/messages/${messageId}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetLanguage })
    });

    if (!response.ok) {
      throw new Error('Failed to translate message');
    }

    const result = await response.json();
    return result.data.translatedText;
  }
}

// Singleton instance
export const chatService = new ChatService();