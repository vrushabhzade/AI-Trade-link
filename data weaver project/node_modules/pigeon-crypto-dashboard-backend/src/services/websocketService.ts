/**
 * WebSocket Service for Real-time Data Updates
 * 
 * Provides real-time data streaming with:
 * - WebSocket connection management
 * - Real-time pigeon and crypto data updates
 * - Client subscription management
 * - Automatic data refresh and broadcasting
 * - Connection health monitoring
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WebSocketMessage, PigeonSighting, CryptoPricePoint, CorrelationResult } from '../types/index.js';
import { pigeonService, type UrbanArea } from './pigeonService.js';
import { cryptoService, type SupportedCrypto } from './cryptoService.js';
import { correlationService } from './correlationService.js';

// Client subscription information
interface ClientSubscription {
  id: string;
  ws: WebSocket;
  subscriptions: {
    pigeonData?: { areas: UrbanArea[] };
    cryptoData?: { cryptos: SupportedCrypto[] };
    correlations?: { crypto: SupportedCrypto; area: UrbanArea };
  };
  lastActivity: Date;
}

// Update intervals (in milliseconds)
const UPDATE_INTERVALS = {
  pigeon: 30 * 1000, // 30 seconds - meets requirement 2.3
  crypto: 30 * 1000, // 30 seconds - meets requirement 3.3
  correlation: 60 * 1000 // 1 minute for correlation updates
};

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientSubscription>();
  private updateTimers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      console.log(`WebSocket client connected: ${clientId}`);

      const client: ClientSubscription = {
        id: clientId,
        ws,
        subscriptions: {},
        lastActivity: new Date()
      };

      this.clients.set(clientId, client);

      // Set up message handling
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        this.cleanupClientTimers(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
        this.cleanupClientTimers(clientId);
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: 'connection',
        data: {
          clientId,
          message: 'Connected to Pigeon-Crypto Dashboard WebSocket',
          timestamp: new Date().toISOString()
        }
      });
    });

    this.isRunning = true;
    this.startGlobalUpdates();
    console.log('WebSocket server initialized');
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (message.type) {
      case 'subscribe-pigeon':
        this.subscribePigeonData(clientId, message.areas || ['new-york', 'london', 'tokyo']);
        break;

      case 'subscribe-crypto':
        this.subscribeCryptoData(clientId, message.cryptos || ['bitcoin', 'ethereum']);
        break;

      case 'subscribe-correlations':
        this.subscribeCorrelations(clientId, message.crypto || 'bitcoin', message.area || 'new-york');
        break;

      case 'unsubscribe':
        this.unsubscribe(clientId, message.dataType);
        break;

      case 'ping':
        this.sendMessage(clientId, { type: 'pong', data: { timestamp: new Date().toISOString() } });
        break;

      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Subscribe client to pigeon data updates
   */
  private subscribePigeonData(clientId: string, areas: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate areas
    const validAreas = areas.filter(area => area in { 'new-york': 1, 'london': 1, 'tokyo': 1, 'paris': 1, 'berlin': 1 }) as UrbanArea[];
    
    client.subscriptions.pigeonData = { areas: validAreas };
    
    this.sendMessage(clientId, {
      type: 'subscription-confirmed',
      data: {
        dataType: 'pigeon',
        areas: validAreas,
        updateInterval: UPDATE_INTERVALS.pigeon
      }
    });

    // Send initial data
    this.sendPigeonUpdate(clientId);
  }

  /**
   * Subscribe client to crypto data updates
   */
  private subscribeCryptoData(clientId: string, cryptos: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate cryptos
    const validCryptos = cryptos.filter(crypto => crypto in { 'bitcoin': 1, 'ethereum': 1, 'dogecoin': 1 }) as SupportedCrypto[];
    
    client.subscriptions.cryptoData = { cryptos: validCryptos };
    
    this.sendMessage(clientId, {
      type: 'subscription-confirmed',
      data: {
        dataType: 'crypto',
        cryptos: validCryptos,
        updateInterval: UPDATE_INTERVALS.crypto
      }
    });

    // Send initial data
    this.sendCryptoUpdate(clientId);
  }

  /**
   * Subscribe client to correlation updates
   */
  private subscribeCorrelations(clientId: string, crypto: string, area: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate parameters
    if (!(crypto in { 'bitcoin': 1, 'ethereum': 1, 'dogecoin': 1 }) || 
        !(area in { 'new-york': 1, 'london': 1, 'tokyo': 1, 'paris': 1, 'berlin': 1 })) {
      this.sendError(clientId, 'Invalid crypto or area for correlation subscription');
      return;
    }

    client.subscriptions.correlations = { 
      crypto: crypto as SupportedCrypto, 
      area: area as UrbanArea 
    };
    
    this.sendMessage(clientId, {
      type: 'subscription-confirmed',
      data: {
        dataType: 'correlations',
        crypto,
        area,
        updateInterval: UPDATE_INTERVALS.correlation
      }
    });

    // Send initial data
    this.sendCorrelationUpdate(clientId);
  }

  /**
   * Unsubscribe client from data type
   */
  private unsubscribe(clientId: string, dataType: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (dataType) {
      case 'pigeon':
        delete client.subscriptions.pigeonData;
        break;
      case 'crypto':
        delete client.subscriptions.cryptoData;
        break;
      case 'correlations':
        delete client.subscriptions.correlations;
        break;
      case 'all':
        client.subscriptions = {};
        break;
    }

    this.sendMessage(clientId, {
      type: 'unsubscribed',
      data: { dataType }
    });
  }

  /**
   * Send pigeon data update to client
   */
  private async sendPigeonUpdate(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.subscriptions.pigeonData) return;

    try {
      const sightings = await pigeonService.getCurrentSightings(client.subscriptions.pigeonData.areas);
      
      this.sendMessage(clientId, {
        type: 'pigeon-update',
        data: {
          sightings,
          areas: client.subscriptions.pigeonData.areas,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending pigeon update:', error);
      this.sendError(clientId, 'Failed to fetch pigeon data');
    }
  }

  /**
   * Send crypto data update to client
   */
  private async sendCryptoUpdate(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.subscriptions.cryptoData) return;

    try {
      const prices = await cryptoService.getCurrentPrices(client.subscriptions.cryptoData.cryptos);
      
      this.sendMessage(clientId, {
        type: 'crypto-update',
        data: {
          prices,
          cryptos: client.subscriptions.cryptoData.cryptos,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending crypto update:', error);
      this.sendError(clientId, 'Failed to fetch crypto data');
    }
  }

  /**
   * Send correlation update to client
   */
  private async sendCorrelationUpdate(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.subscriptions.correlations) return;

    try {
      const { crypto, area } = client.subscriptions.correlations;
      
      // Fetch recent data for correlation
      const pigeonData = await pigeonService.getHistoricalSightings([area], 1);
      const cryptoData = await cryptoService.getHistoricalPrices(crypto, 1);
      
      // Calculate correlation
      const dashboardData = await correlationService.aggregateAndCorrelate(pigeonData, cryptoData);
      const highlights = correlationService.getCorrelationHighlights(dashboardData.correlations);
      
      this.sendMessage(clientId, {
        type: 'correlation-update',
        data: {
          correlations: dashboardData.correlations,
          highlights: highlights.highlighted,
          commentary: highlights.commentary,
          crypto,
          area,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending correlation update:', error);
      this.sendError(clientId, 'Failed to calculate correlations');
    }
  }

  /**
   * Send message to specific client
   */
  private sendMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Send error message to client
   */
  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'error',
      data: {
        error,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast message to all subscribed clients
   */
  private broadcastToSubscribed(dataType: 'pigeon' | 'crypto' | 'correlations', message: any): void {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions[`${dataType}Data` as keyof typeof client.subscriptions] || 
          (dataType === 'correlations' && client.subscriptions.correlations)) {
        this.sendMessage(clientId, message);
      }
    }
  }

  /**
   * Start global update timers
   */
  private startGlobalUpdates(): void {
    // Pigeon data updates
    const pigeonTimer = setInterval(async () => {
      for (const [clientId] of this.clients) {
        await this.sendPigeonUpdate(clientId);
      }
    }, UPDATE_INTERVALS.pigeon);

    // Crypto data updates
    const cryptoTimer = setInterval(async () => {
      for (const [clientId] of this.clients) {
        await this.sendCryptoUpdate(clientId);
      }
    }, UPDATE_INTERVALS.crypto);

    // Correlation updates
    const correlationTimer = setInterval(async () => {
      for (const [clientId] of this.clients) {
        await this.sendCorrelationUpdate(clientId);
      }
    }, UPDATE_INTERVALS.correlation);

    this.updateTimers.set('global-pigeon', pigeonTimer);
    this.updateTimers.set('global-crypto', cryptoTimer);
    this.updateTimers.set('global-correlation', correlationTimer);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup timers for disconnected client
   */
  private cleanupClientTimers(clientId: string): void {
    // Individual client timers would be cleaned up here
    // Currently using global timers, so no individual cleanup needed
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    subscriptions: {
      pigeon: number;
      crypto: number;
      correlations: number;
    };
  } {
    let pigeonSubs = 0;
    let cryptoSubs = 0;
    let correlationSubs = 0;

    for (const client of this.clients.values()) {
      if (client.subscriptions.pigeonData) pigeonSubs++;
      if (client.subscriptions.cryptoData) cryptoSubs++;
      if (client.subscriptions.correlations) correlationSubs++;
    }

    return {
      totalConnections: this.clients.size,
      activeConnections: Array.from(this.clients.values()).filter(c => c.ws.readyState === WebSocket.OPEN).length,
      subscriptions: {
        pigeon: pigeonSubs,
        crypto: cryptoSubs,
        correlations: correlationSubs
      }
    };
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (!this.isRunning) return;

    // Clear all timers
    for (const timer of this.updateTimers.values()) {
      clearInterval(timer);
    }
    this.updateTimers.clear();

    // Close all client connections
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.isRunning = false;
    console.log('WebSocket server shutdown complete');
  }
}

// Export singleton instance
let _websocketService: WebSocketService | null = null;

export const websocketService = {
  getInstance(): WebSocketService {
    if (!_websocketService) {
      _websocketService = new WebSocketService();
    }
    return _websocketService;
  },
  
  // Delegate methods for convenience
  initialize: (server: Server) => websocketService.getInstance().initialize(server),
  getStats: () => websocketService.getInstance().getStats(),
  shutdown: () => websocketService.getInstance().shutdown()
};