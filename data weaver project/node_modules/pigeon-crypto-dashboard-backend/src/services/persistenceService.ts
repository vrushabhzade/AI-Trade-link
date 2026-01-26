/**
 * Persistence Service using SQLite
 * 
 * Provides data persistence functionality with:
 * - SQLite database for historical data storage
 * - User preference persistence
 * - Data archival and retrieval
 * - Database schema management
 */

import type { PigeonSighting, CryptoPricePoint, CorrelationResult, UserPreferences } from '../types/index.js';

// Database configuration
interface DatabaseConfig {
  filename: string;
  maxConnections: number;
  retentionDays: {
    crypto: number;
    pigeon: number;
    correlation: number;
    preferences: number;
  };
}

const DEFAULT_CONFIG: DatabaseConfig = {
  filename: 'pigeon-crypto-dashboard.db',
  maxConnections: 10,
  retentionDays: {
    crypto: 365,      // 1 year
    pigeon: 90,       // 3 months
    correlation: 30,  // 1 month
    preferences: 365  // 1 year
  }
};

// Database schemas
const SCHEMAS = {
  crypto_prices: `
    CREATE TABLE IF NOT EXISTS crypto_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      volume REAL,
      market_cap REAL,
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_crypto_symbol_timestamp (symbol, timestamp)
    )
  `,
  
  pigeon_sightings: `
    CREATE TABLE IF NOT EXISTS pigeon_sightings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      count INTEGER NOT NULL,
      coordinates_lat REAL,
      coordinates_lng REAL,
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pigeon_location_timestamp (location, timestamp)
    )
  `,
  
  correlations: `
    CREATE TABLE IF NOT EXISTS correlations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coefficient REAL NOT NULL,
      p_value REAL NOT NULL,
      time_range_start DATETIME NOT NULL,
      time_range_end DATETIME NOT NULL,
      significance TEXT NOT NULL,
      crypto_symbol TEXT NOT NULL,
      pigeon_location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_correlation_crypto_location (crypto_symbol, pigeon_location, created_at)
    )
  `,
  
  user_preferences: `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      selected_cryptocurrencies TEXT NOT NULL,
      time_range TEXT NOT NULL,
      selected_regions TEXT NOT NULL,
      chart_type TEXT NOT NULL,
      theme TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_preferences_session (session_id)
    )
  `
};

// Mock SQLite implementation (in production, use actual SQLite library)
class MockDatabase {
  private data = new Map<string, any[]>();
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.initializeTables();
  }

  private initializeTables(): void {
    // Initialize empty tables
    this.data.set('crypto_prices', []);
    this.data.set('pigeon_sightings', []);
    this.data.set('correlations', []);
    this.data.set('user_preferences', []);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    // Mock implementation - in production, use actual SQLite
    console.log(`Mock SQL: ${sql}`, params);
    return { lastID: Date.now(), changes: 1 };
  }

  async get(sql: string, params: any[] = []): Promise<any | undefined> {
    // Mock implementation
    console.log(`Mock SQL GET: ${sql}`, params);
    return undefined;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    // Mock implementation
    console.log(`Mock SQL ALL: ${sql}`, params);
    return [];
  }

  async close(): Promise<void> {
    console.log('Mock database closed');
  }
}

export class PersistenceService {
  private config: DatabaseConfig;
  private db: MockDatabase | null = null;
  private isInitialized = false;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize database connection and schema
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In production, use actual SQLite library like better-sqlite3
      this.db = new MockDatabase(this.config.filename);
      
      // Create tables
      for (const [tableName, schema] of Object.entries(SCHEMAS)) {
        await this.db.run(schema);
      }

      this.isInitialized = true;
      console.log(`Database initialized: ${this.config.filename}`);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store cryptocurrency price data
   */
  async storeCryptoData(data: CryptoPricePoint[]): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let stored = 0;
    const sql = `
      INSERT INTO crypto_prices (symbol, price, volume, market_cap, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const point of data) {
      try {
        await this.db.run(sql, [
          point.symbol,
          point.price,
          point.volume || null,
          point.marketCap || null,
          point.timestamp.toISOString()
        ]);
        stored++;
      } catch (error) {
        console.error('Error storing crypto data:', error);
      }
    }

    return stored;
  }

  /**
   * Retrieve historical cryptocurrency data
   */
  async getCryptoData(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<CryptoPricePoint[]> {
    if (!this.db) throw new Error('Database not initialized');

    const placeholders = symbols.map(() => '?').join(',');
    const sql = `
      SELECT symbol, price, volume, market_cap, timestamp
      FROM crypto_prices
      WHERE symbol IN (${placeholders})
        AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `;

    const params = [...symbols, startDate.toISOString(), endDate.toISOString()];
    const rows = await this.db.all(sql, params);

    return rows.map((row: any) => ({
      symbol: row.symbol,
      price: row.price,
      volume: row.volume,
      marketCap: row.market_cap,
      timestamp: new Date(row.timestamp)
    }));
  }

  /**
   * Store pigeon sighting data
   */
  async storePigeonData(data: PigeonSighting[]): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let stored = 0;
    const sql = `
      INSERT INTO pigeon_sightings (location, count, coordinates_lat, coordinates_lng, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const sighting of data) {
      try {
        await this.db.run(sql, [
          sighting.location,
          sighting.count,
          sighting.coordinates?.lat || null,
          sighting.coordinates?.lng || null,
          sighting.timestamp.toISOString()
        ]);
        stored++;
      } catch (error) {
        console.error('Error storing pigeon data:', error);
      }
    }

    return stored;
  }

  /**
   * Retrieve historical pigeon sighting data
   */
  async getPigeonData(
    locations: string[],
    startDate: Date,
    endDate: Date
  ): Promise<PigeonSighting[]> {
    if (!this.db) throw new Error('Database not initialized');

    const placeholders = locations.map(() => '?').join(',');
    const sql = `
      SELECT location, count, coordinates_lat, coordinates_lng, timestamp
      FROM pigeon_sightings
      WHERE location IN (${placeholders})
        AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `;

    const params = [...locations, startDate.toISOString(), endDate.toISOString()];
    const rows = await this.db.all(sql, params);

    return rows.map((row: any) => ({
      location: row.location,
      count: row.count,
      coordinates: row.coordinates_lat && row.coordinates_lng ? {
        lat: row.coordinates_lat,
        lng: row.coordinates_lng
      } : undefined,
      timestamp: new Date(row.timestamp)
    }));
  }

  /**
   * Store correlation results
   */
  async storeCorrelationData(data: CorrelationResult[], cryptoSymbol: string, pigeonLocation: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let stored = 0;
    const sql = `
      INSERT INTO correlations (
        coefficient, p_value, time_range_start, time_range_end, 
        significance, crypto_symbol, pigeon_location
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const correlation of data) {
      try {
        await this.db.run(sql, [
          correlation.coefficient,
          correlation.pValue,
          correlation.timeRange.start.toISOString(),
          correlation.timeRange.end.toISOString(),
          correlation.significance,
          cryptoSymbol,
          pigeonLocation
        ]);
        stored++;
      } catch (error) {
        console.error('Error storing correlation data:', error);
      }
    }

    return stored;
  }

  /**
   * Retrieve historical correlation data
   */
  async getCorrelationData(
    cryptoSymbol: string,
    pigeonLocation: string,
    startDate: Date,
    endDate: Date
  ): Promise<CorrelationResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT coefficient, p_value, time_range_start, time_range_end, significance
      FROM correlations
      WHERE crypto_symbol = ? AND pigeon_location = ?
        AND created_at BETWEEN ? AND ?
      ORDER BY created_at ASC
    `;

    const params = [cryptoSymbol, pigeonLocation, startDate.toISOString(), endDate.toISOString()];
    const rows = await this.db.all(sql, params);

    return rows.map((row: any) => ({
      coefficient: row.coefficient,
      pValue: row.p_value,
      timeRange: {
        start: new Date(row.time_range_start),
        end: new Date(row.time_range_end)
      },
      significance: row.significance as 'high' | 'medium' | 'low' | 'none'
    }));
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(sessionId: string, preferences: UserPreferences): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO user_preferences (
        session_id, selected_cryptocurrencies, time_range, 
        selected_regions, chart_type, theme, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.db.run(sql, [
      sessionId,
      JSON.stringify(preferences.selectedCryptocurrencies),
      preferences.timeRange,
      JSON.stringify(preferences.selectedRegions),
      preferences.chartType,
      preferences.theme
    ]);
  }

  /**
   * Retrieve user preferences
   */
  async getUserPreferences(sessionId: string): Promise<UserPreferences | null> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT selected_cryptocurrencies, time_range, selected_regions, chart_type, theme
      FROM user_preferences
      WHERE session_id = ?
    `;

    const row = await this.db.get(sql, [sessionId]);
    if (!row) return null;

    return {
      selectedCryptocurrencies: JSON.parse(row.selected_cryptocurrencies),
      timeRange: row.time_range,
      selectedRegions: JSON.parse(row.selected_regions),
      chartType: row.chart_type,
      theme: row.theme
    };
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(sessionId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'DELETE FROM user_preferences WHERE session_id = ?';
    const result = await this.db.run(sql, [sessionId]);
    return result.changes > 0;
  }

  /**
   * Clean up old data based on retention policies
   */
  async cleanupOldData(): Promise<{ crypto: number; pigeon: number; correlation: number; preferences: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const results = { crypto: 0, pigeon: 0, correlation: 0, preferences: 0 };

    // Clean crypto data
    const cryptoCutoff = new Date(now.getTime() - this.config.retentionDays.crypto * 24 * 60 * 60 * 1000);
    const cryptoResult = await this.db.run(
      'DELETE FROM crypto_prices WHERE created_at < ?',
      [cryptoCutoff.toISOString()]
    );
    results.crypto = cryptoResult.changes;

    // Clean pigeon data
    const pigeonCutoff = new Date(now.getTime() - this.config.retentionDays.pigeon * 24 * 60 * 60 * 1000);
    const pigeonResult = await this.db.run(
      'DELETE FROM pigeon_sightings WHERE created_at < ?',
      [pigeonCutoff.toISOString()]
    );
    results.pigeon = pigeonResult.changes;

    // Clean correlation data
    const correlationCutoff = new Date(now.getTime() - this.config.retentionDays.correlation * 24 * 60 * 60 * 1000);
    const correlationResult = await this.db.run(
      'DELETE FROM correlations WHERE created_at < ?',
      [correlationCutoff.toISOString()]
    );
    results.correlation = correlationResult.changes;

    // Clean old preferences
    const preferencesCutoff = new Date(now.getTime() - this.config.retentionDays.preferences * 24 * 60 * 60 * 1000);
    const preferencesResult = await this.db.run(
      'DELETE FROM user_preferences WHERE updated_at < ?',
      [preferencesCutoff.toISOString()]
    );
    results.preferences = preferencesResult.changes;

    return results;
  }

  /**
   * Health check for persistence service
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.db) {
        return {
          status: 'error',
          details: { error: 'Database not initialized' }
        };
      }

      // Test database connectivity
      await this.db.get('SELECT 1');
      
      const stats = await this.getStats();
      const totalRows = Object.values(stats.tables).reduce((sum, count) => sum + count, 0);
      
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          totalRows,
          tables: stats.tables
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    tables: { [tableName: string]: number };
    size: string;
    config: DatabaseConfig;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const tables: { [tableName: string]: number } = {};

    // Count rows in each table
    for (const tableName of Object.keys(SCHEMAS)) {
      try {
        const result = await this.db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
        tables[tableName] = result?.count || 0;
      } catch (error) {
        tables[tableName] = 0;
      }
    }

    return {
      tables,
      size: 'Unknown (mock implementation)',
      config: this.config
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
let _persistenceService: PersistenceService | null = null;

export const persistenceService = {
  getInstance(): PersistenceService {
    if (!_persistenceService) {
      _persistenceService = new PersistenceService();
    }
    return _persistenceService;
  },
  
  // Delegate methods for convenience
  initialize: () => persistenceService.getInstance().initialize(),
  storeCryptoData: (data: CryptoPricePoint[]) => persistenceService.getInstance().storeCryptoData(data),
  getCryptoData: (symbols: string[], startDate: Date, endDate: Date) => 
    persistenceService.getInstance().getCryptoData(symbols, startDate, endDate),
  storePigeonData: (data: PigeonSighting[]) => persistenceService.getInstance().storePigeonData(data),
  getPigeonData: (locations: string[], startDate: Date, endDate: Date) => 
    persistenceService.getInstance().getPigeonData(locations, startDate, endDate),
  storeCorrelationData: (data: CorrelationResult[], cryptoSymbol: string, pigeonLocation: string) => 
    persistenceService.getInstance().storeCorrelationData(data, cryptoSymbol, pigeonLocation),
  getCorrelationData: (cryptoSymbol: string, pigeonLocation: string, startDate: Date, endDate: Date) => 
    persistenceService.getInstance().getCorrelationData(cryptoSymbol, pigeonLocation, startDate, endDate),
  storeUserPreferences: (sessionId: string, preferences: UserPreferences) => 
    persistenceService.getInstance().storeUserPreferences(sessionId, preferences),
  getUserPreferences: (sessionId: string) => persistenceService.getInstance().getUserPreferences(sessionId),
  deleteUserPreferences: (sessionId: string) => persistenceService.getInstance().deleteUserPreferences(sessionId),
  cleanupOldData: () => persistenceService.getInstance().cleanupOldData(),
  getStats: () => persistenceService.getInstance().getStats(),
  close: () => persistenceService.getInstance().close()
};