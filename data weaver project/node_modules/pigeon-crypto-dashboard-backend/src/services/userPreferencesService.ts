/**
 * User Preferences Service
 * 
 * Manages user preferences and customization settings with:
 * - Preference persistence across browser sessions
 * - Validation of preference data
 * - Default preference management
 * - Session-based storage (in-memory for now, can be extended to database)
 */

import type { UserPreferences } from '../types/index.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  selectedCryptocurrencies: ['bitcoin', 'ethereum'],
  timeRange: '7d',
  selectedRegions: ['new-york', 'london', 'tokyo'],
  chartType: 'line',
  theme: 'light'
};

// In-memory storage for user preferences (in production, this would be a database)
const userPreferencesStore = new Map<string, UserPreferences>();

// Session storage for temporary preferences
const sessionPreferencesStore = new Map<string, UserPreferences>();

export class UserPreferencesService {
  /**
   * Get user preferences by session ID
   */
  async getUserPreferences(sessionId: string): Promise<UserPreferences> {
    // First check session storage
    const sessionPrefs = sessionPreferencesStore.get(sessionId);
    if (sessionPrefs) return sessionPrefs;

    // Then check cache
    const cachedPrefs = await cacheService.getCachedUserPreferences(sessionId);
    if (cachedPrefs) {
      sessionPreferencesStore.set(sessionId, cachedPrefs);
      return cachedPrefs;
    }

    // Then check persistent storage
    try {
      const persistedPrefs = await persistenceService.getUserPreferences(sessionId);
      if (persistedPrefs) {
        sessionPreferencesStore.set(sessionId, persistedPrefs);
        await cacheService.cacheUserPreferences(sessionId, persistedPrefs);
        return persistedPrefs;
      }
    } catch (error) {
      console.warn('Failed to retrieve persisted preferences:', error);
    }

    // Finally, return defaults
    const defaultPrefs = { ...DEFAULT_PREFERENCES };
    sessionPreferencesStore.set(sessionId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(sessionId: string, preferences: Partial<UserPreferences>, persist: boolean = true): Promise<UserPreferences> {
    const currentPreferences = await this.getUserPreferences(sessionId);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    // Validate preferences
    const validatedPreferences = this.validatePreferences(updatedPreferences);
    
    // Save to session storage
    sessionPreferencesStore.set(sessionId, validatedPreferences);
    
    // Cache the preferences
    await cacheService.cacheUserPreferences(sessionId, validatedPreferences);
    
    // Save to persistent storage if requested
    if (persist) {
      userPreferencesStore.set(sessionId, validatedPreferences);
      try {
        await persistenceService.storeUserPreferences(sessionId, validatedPreferences);
      } catch (error) {
        console.warn('Failed to persist user preferences:', error);
      }
    }
    
    return validatedPreferences;
  }

  /**
   * Update specific preference
   */
  async updatePreference<K extends keyof UserPreferences>(
    sessionId: string, 
    key: K, 
    value: UserPreferences[K],
    persist: boolean = true
  ): Promise<UserPreferences> {
    const preferences = { [key]: value } as Partial<UserPreferences>;
    return await this.saveUserPreferences(sessionId, preferences, persist);
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(sessionId: string): Promise<UserPreferences> {
    const defaultPrefs = { ...DEFAULT_PREFERENCES };
    sessionPreferencesStore.set(sessionId, defaultPrefs);
    userPreferencesStore.set(sessionId, defaultPrefs);
    
    // Update cache and persistence
    await cacheService.cacheUserPreferences(sessionId, defaultPrefs);
    try {
      await persistenceService.storeUserPreferences(sessionId, defaultPrefs);
    } catch (error) {
      console.warn('Failed to persist reset preferences:', error);
    }
    
    return defaultPrefs;
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(sessionId: string): Promise<void> {
    sessionPreferencesStore.delete(sessionId);
    userPreferencesStore.delete(sessionId);
    
    // Clear from cache and persistence
    await cacheService.delete(`preferences:${sessionId}`);
    try {
      await persistenceService.deleteUserPreferences(sessionId);
    } catch (error) {
      console.warn('Failed to delete persisted preferences:', error);
    }
  }

  /**
   * Validate user preferences
   */
  private validatePreferences(preferences: UserPreferences): UserPreferences {
    const validated: UserPreferences = { ...preferences };

    // Validate selectedCryptocurrencies
    if (!Array.isArray(validated.selectedCryptocurrencies) || validated.selectedCryptocurrencies.length === 0) {
      validated.selectedCryptocurrencies = DEFAULT_PREFERENCES.selectedCryptocurrencies;
    } else {
      // Filter out invalid cryptocurrencies
      const validCryptos = ['bitcoin', 'ethereum', 'dogecoin'];
      validated.selectedCryptocurrencies = validated.selectedCryptocurrencies.filter(crypto => 
        validCryptos.includes(crypto)
      );
      if (validated.selectedCryptocurrencies.length === 0) {
        validated.selectedCryptocurrencies = DEFAULT_PREFERENCES.selectedCryptocurrencies;
      }
    }

    // Validate timeRange
    const validTimeRanges = ['1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(validated.timeRange)) {
      validated.timeRange = DEFAULT_PREFERENCES.timeRange;
    }

    // Validate selectedRegions
    if (!Array.isArray(validated.selectedRegions) || validated.selectedRegions.length === 0) {
      validated.selectedRegions = DEFAULT_PREFERENCES.selectedRegions;
    } else {
      // Filter out invalid regions
      const validRegions = ['new-york', 'london', 'tokyo', 'paris', 'berlin'];
      validated.selectedRegions = validated.selectedRegions.filter(region => 
        validRegions.includes(region)
      );
      if (validated.selectedRegions.length === 0) {
        validated.selectedRegions = DEFAULT_PREFERENCES.selectedRegions;
      }
    }

    // Validate chartType
    const validChartTypes: UserPreferences['chartType'][] = ['line', 'area', 'candlestick'];
    if (!validChartTypes.includes(validated.chartType)) {
      validated.chartType = DEFAULT_PREFERENCES.chartType;
    }

    // Validate theme
    const validThemes: UserPreferences['theme'][] = ['light', 'dark'];
    if (!validThemes.includes(validated.theme)) {
      validated.theme = DEFAULT_PREFERENCES.theme;
    }

    return validated;
  }

  /**
   * Get all stored preferences (for admin/debugging)
   */
  getAllPreferences(): { sessionId: string; preferences: UserPreferences }[] {
    return Array.from(userPreferencesStore.entries()).map(([sessionId, preferences]) => ({
      sessionId,
      preferences
    }));
  }

  /**
   * Get preferences statistics
   */
  getPreferencesStats(): {
    totalUsers: number;
    activeSessions: number;
    popularCryptos: { [crypto: string]: number };
    popularRegions: { [region: string]: number };
    popularTimeRanges: { [range: string]: number };
    popularChartTypes: { [type: string]: number };
    popularThemes: { [theme: string]: number };
  } {
    const allPrefs = Array.from(userPreferencesStore.values());
    const sessionPrefs = Array.from(sessionPreferencesStore.values());
    
    const stats = {
      totalUsers: userPreferencesStore.size,
      activeSessions: sessionPreferencesStore.size,
      popularCryptos: {} as { [crypto: string]: number },
      popularRegions: {} as { [region: string]: number },
      popularTimeRanges: {} as { [range: string]: number },
      popularChartTypes: {} as { [type: string]: number },
      popularThemes: {} as { [theme: string]: number }
    };

    // Count preferences
    allPrefs.forEach(prefs => {
      // Count cryptocurrencies
      prefs.selectedCryptocurrencies.forEach(crypto => {
        stats.popularCryptos[crypto] = (stats.popularCryptos[crypto] || 0) + 1;
      });

      // Count regions
      prefs.selectedRegions.forEach(region => {
        stats.popularRegions[region] = (stats.popularRegions[region] || 0) + 1;
      });

      // Count time ranges
      stats.popularTimeRanges[prefs.timeRange] = (stats.popularTimeRanges[prefs.timeRange] || 0) + 1;

      // Count chart types
      stats.popularChartTypes[prefs.chartType] = (stats.popularChartTypes[prefs.chartType] || 0) + 1;

      // Count themes
      stats.popularThemes[prefs.theme] = (stats.popularThemes[prefs.theme] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear expired sessions (cleanup utility)
   */
  clearExpiredSessions(): number {
    // In a real implementation, this would check session expiry times
    // For now, we'll just clear sessions that aren't in persistent storage
    let cleared = 0;
    
    for (const [sessionId] of sessionPreferencesStore) {
      if (!userPreferencesStore.has(sessionId)) {
        // Session exists but no persistent preferences - could be expired
        // In production, you'd check actual expiry timestamps
        sessionPreferencesStore.delete(sessionId);
        cleared++;
      }
    }
    
    return cleared;
  }
}

// Export singleton instance
let _userPreferencesService: UserPreferencesService | null = null;

export const userPreferencesService = {
  getInstance(): UserPreferencesService {
    if (!_userPreferencesService) {
      _userPreferencesService = new UserPreferencesService();
    }
    return _userPreferencesService;
  },
  
  // Delegate methods for convenience
  getUserPreferences: (sessionId: string) => userPreferencesService.getInstance().getUserPreferences(sessionId),
  saveUserPreferences: (sessionId: string, preferences: Partial<UserPreferences>, persist?: boolean) => 
    userPreferencesService.getInstance().saveUserPreferences(sessionId, preferences, persist),
  updatePreference: <K extends keyof UserPreferences>(sessionId: string, key: K, value: UserPreferences[K], persist?: boolean) =>
    userPreferencesService.getInstance().updatePreference(sessionId, key, value, persist),
  resetPreferences: (sessionId: string) => userPreferencesService.getInstance().resetPreferences(sessionId),
  deleteUserPreferences: (sessionId: string) => userPreferencesService.getInstance().deleteUserPreferences(sessionId),
  getPreferencesStats: () => userPreferencesService.getInstance().getPreferencesStats(),
  clearExpiredSessions: () => userPreferencesService.getInstance().clearExpiredSessions()
};