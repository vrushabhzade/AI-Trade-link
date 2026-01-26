/**
 * Unit tests for UserPreferencesService
 * Tests user preference management functionality including persistence,
 * validation, and session management
 */

import { UserPreferencesService } from './userPreferencesService.js';
import type { UserPreferences } from '../types/index.js';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    service = new UserPreferencesService();
  });

  describe('Default Preferences', () => {
    it('should return default preferences for new session', () => {
      const preferences = service.getUserPreferences('new-session');
      
      expect(preferences).toEqual({
        selectedCryptocurrencies: ['bitcoin', 'ethereum'],
        timeRange: '7d',
        selectedRegions: ['new-york', 'london', 'tokyo'],
        chartType: 'line',
        theme: 'light'
      });
    });
  });

  describe('Preference Management', () => {
    it('should save and retrieve user preferences', () => {
      const sessionId = 'test-session-1';
      const newPreferences: Partial<UserPreferences> = {
        selectedCryptocurrencies: ['bitcoin', 'dogecoin'],
        timeRange: '1d',
        theme: 'dark'
      };

      const saved = service.saveUserPreferences(sessionId, newPreferences);
      const retrieved = service.getUserPreferences(sessionId);

      expect(saved).toEqual(retrieved);
      expect(retrieved.selectedCryptocurrencies).toEqual(['bitcoin', 'dogecoin']);
      expect(retrieved.timeRange).toBe('1d');
      expect(retrieved.theme).toBe('dark');
      // Should preserve other defaults
      expect(retrieved.selectedRegions).toEqual(['new-york', 'london', 'tokyo']);
      expect(retrieved.chartType).toBe('line');
    });

    it('should update individual preferences', () => {
      const sessionId = 'test-session-2';
      
      const updated = service.updatePreference(sessionId, 'chartType', 'area');
      
      expect(updated.chartType).toBe('area');
      // Should preserve other defaults
      expect(updated.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
      expect(updated.theme).toBe('light');
    });

    it('should reset preferences to defaults', () => {
      const sessionId = 'test-session-3';
      
      // First modify preferences
      service.updatePreference(sessionId, 'theme', 'dark');
      service.updatePreference(sessionId, 'timeRange', '30d');
      
      // Then reset
      const reset = service.resetPreferences(sessionId);
      
      expect(reset).toEqual({
        selectedCryptocurrencies: ['bitcoin', 'ethereum'],
        timeRange: '7d',
        selectedRegions: ['new-york', 'london', 'tokyo'],
        chartType: 'line',
        theme: 'light'
      });
    });

    it('should delete user preferences', () => {
      const sessionId = 'test-session-4';
      
      // Set some preferences
      service.updatePreference(sessionId, 'theme', 'dark');
      
      // Delete preferences
      service.deleteUserPreferences(sessionId);
      
      // Should return defaults again
      const preferences = service.getUserPreferences(sessionId);
      expect(preferences.theme).toBe('light'); // Back to default
    });
  });

  describe('Preference Validation', () => {
    it('should validate and correct invalid cryptocurrencies', () => {
      const sessionId = 'test-session-5';
      const invalidPreferences: Partial<UserPreferences> = {
        selectedCryptocurrencies: ['bitcoin', 'invalid-crypto', 'ethereum', 'another-invalid'] as any
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
    });

    it('should validate and correct invalid time ranges', () => {
      const sessionId = 'test-session-6';
      const invalidPreferences: Partial<UserPreferences> = {
        timeRange: 'invalid-range' as any
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.timeRange).toBe('7d'); // Default
    });

    it('should validate and correct invalid regions', () => {
      const sessionId = 'test-session-7';
      const invalidPreferences: Partial<UserPreferences> = {
        selectedRegions: ['new-york', 'invalid-region', 'london'] as any
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.selectedRegions).toEqual(['new-york', 'london']);
    });

    it('should validate and correct invalid chart types', () => {
      const sessionId = 'test-session-8';
      const invalidPreferences: Partial<UserPreferences> = {
        chartType: 'invalid-chart' as any
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.chartType).toBe('line'); // Default
    });

    it('should validate and correct invalid themes', () => {
      const sessionId = 'test-session-9';
      const invalidPreferences: Partial<UserPreferences> = {
        theme: 'invalid-theme' as any
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.theme).toBe('light'); // Default
    });

    it('should handle empty arrays by using defaults', () => {
      const sessionId = 'test-session-10';
      const invalidPreferences: Partial<UserPreferences> = {
        selectedCryptocurrencies: [],
        selectedRegions: []
      };

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      expect(saved.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
      expect(saved.selectedRegions).toEqual(['new-york', 'london', 'tokyo']);
    });
  });

  describe('Session Management', () => {
    it('should handle persistent vs session-only preferences', () => {
      const sessionId = 'test-session-11';
      
      // Save with persistence
      service.saveUserPreferences(sessionId, { theme: 'dark' }, true);
      
      // Save without persistence (session only)
      service.saveUserPreferences(sessionId, { timeRange: '1d' }, false);
      
      const preferences = service.getUserPreferences(sessionId);
      expect(preferences.theme).toBe('dark');
      expect(preferences.timeRange).toBe('1d');
    });

    it('should provide statistics about preferences usage', () => {
      // Create some test preferences
      service.saveUserPreferences('user1', { theme: 'dark', chartType: 'area' });
      service.saveUserPreferences('user2', { theme: 'light', chartType: 'line' });
      service.saveUserPreferences('user3', { theme: 'dark', chartType: 'area' });
      
      const stats = service.getPreferencesStats();
      
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.popularThemes).toHaveProperty('dark');
      expect(stats.popularThemes).toHaveProperty('light');
      expect(stats.popularChartTypes).toHaveProperty('area');
      expect(stats.popularChartTypes).toHaveProperty('line');
    });

    it('should clear expired sessions', () => {
      // This is a simplified test since the actual implementation
      // would need real session expiry logic
      const cleared = service.clearExpiredSessions();
      
      expect(typeof cleared).toBe('number');
      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined preference values', () => {
      const sessionId = 'test-session-12';
      const invalidPreferences = {
        selectedCryptocurrencies: null,
        timeRange: undefined,
        selectedRegions: null,
        chartType: undefined,
        theme: null
      } as any;

      const saved = service.saveUserPreferences(sessionId, invalidPreferences);
      
      // Should fall back to defaults for all invalid values
      expect(saved.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
      expect(saved.timeRange).toBe('7d');
      expect(saved.selectedRegions).toEqual(['new-york', 'london', 'tokyo']);
      expect(saved.chartType).toBe('line');
      expect(saved.theme).toBe('light');
    });

    it('should handle very long session IDs', () => {
      const longSessionId = 'a'.repeat(1000);
      
      const preferences = service.getUserPreferences(longSessionId);
      
      expect(preferences).toBeDefined();
      expect(preferences.theme).toBe('light');
    });

    it('should handle special characters in session IDs', () => {
      const specialSessionId = 'session-with-special-chars-!@#$%^&*()';
      
      const saved = service.saveUserPreferences(specialSessionId, { theme: 'dark' });
      const retrieved = service.getUserPreferences(specialSessionId);
      
      expect(retrieved.theme).toBe('dark');
    });
  });
});