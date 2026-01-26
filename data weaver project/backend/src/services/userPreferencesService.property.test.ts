/**
 * Property-based tests for User Preferences Service
 * 
 * **Feature: pigeon-crypto-dashboard, Property 15: Preference persistence**
 * **Validates: Requirements 5.5**
 * 
 * Tests that user preferences are correctly persisted across browser sessions
 * and maintain data integrity through cache and database layers.
 */

import fc from 'fast-check';
import { userPreferencesService, UserPreferencesService } from './userPreferencesService.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';
import type { UserPreferences } from '../types/index.js';

describe('UserPreferencesService Property Tests', () => {
  let service: UserPreferencesService;

  beforeEach(async () => {
    service = userPreferencesService.getInstance();
    // Clear cache and initialize persistence for clean tests
    await cacheService.clearAll();
    await persistenceService.initialize();
  });

  afterEach(async () => {
    // Cleanup after each test
    await cacheService.clearAll();
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 15: Preference persistence**
   * 
   * Property: For any valid user preferences and session ID, storing preferences
   * should allow retrieval of the exact same preferences in a new session.
   */
  test('Property 15: Preference persistence across sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid session IDs
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        
        // Generate valid user preferences
        fc.record({
          selectedCryptocurrencies: fc.shuffledSubarray(
            ['bitcoin', 'ethereum', 'dogecoin'], 
            { minLength: 1, maxLength: 3 }
          ),
          timeRange: fc.constantFrom('1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'),
          selectedRegions: fc.shuffledSubarray(
            ['new-york', 'london', 'tokyo', 'paris', 'berlin'], 
            { minLength: 1, maxLength: 5 }
          ),
          chartType: fc.constantFrom('line', 'area', 'candlestick') as fc.Arbitrary<'line' | 'area' | 'candlestick'>,
          theme: fc.constantFrom('light', 'dark') as fc.Arbitrary<'light' | 'dark'>
        }),
        
        async (sessionId: string, preferences: UserPreferences) => {
          // Store preferences with persistence enabled
          const storedPreferences = await service.saveUserPreferences(sessionId, preferences, true);
          
          // Verify stored preferences match input
          expect(storedPreferences.selectedCryptocurrencies).toEqual(preferences.selectedCryptocurrencies);
          expect(storedPreferences.timeRange).toBe(preferences.timeRange);
          expect(storedPreferences.selectedRegions).toEqual(preferences.selectedRegions);
          expect(storedPreferences.chartType).toBe(preferences.chartType);
          expect(storedPreferences.theme).toBe(preferences.theme);
          
          // Clear session cache to simulate new session
          await cacheService.delete(`preferences:${sessionId}`);
          
          // Retrieve preferences in "new session"
          const retrievedPreferences = await service.getUserPreferences(sessionId);
          
          // Verify persistence: retrieved preferences should match stored preferences
          expect(retrievedPreferences.selectedCryptocurrencies).toEqual(storedPreferences.selectedCryptocurrencies);
          expect(retrievedPreferences.timeRange).toBe(storedPreferences.timeRange);
          expect(retrievedPreferences.selectedRegions).toEqual(storedPreferences.selectedRegions);
          expect(retrievedPreferences.chartType).toBe(storedPreferences.chartType);
          expect(retrievedPreferences.theme).toBe(storedPreferences.theme);
        }
      ),
      { numRuns: 100, timeout: 10000 }
    );
  });

  /**
   * Property: Preference updates should maintain consistency across cache and persistence layers
   */
  test('Property: Preference update consistency across layers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.constantFrom('selectedCryptocurrencies', 'timeRange', 'selectedRegions', 'chartType', 'theme') as fc.Arbitrary<keyof UserPreferences>,
        fc.oneof(
          fc.shuffledSubarray(['bitcoin', 'ethereum', 'dogecoin'], { minLength: 1, maxLength: 3 }),
          fc.constantFrom('1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'),
          fc.shuffledSubarray(['new-york', 'london', 'tokyo', 'paris', 'berlin'], { minLength: 1, maxLength: 5 }),
          fc.constantFrom('line', 'area', 'candlestick'),
          fc.constantFrom('light', 'dark')
        ),
        
        async (sessionId: string, key: keyof UserPreferences, value: any) => {
          // Set initial preferences
          const initialPrefs: UserPreferences = {
            selectedCryptocurrencies: ['bitcoin'],
            timeRange: '7d',
            selectedRegions: ['new-york'],
            chartType: 'line',
            theme: 'light'
          };
          
          await service.saveUserPreferences(sessionId, initialPrefs, true);
          
          // Update specific preference
          const updatedPreferences = await service.updatePreference(sessionId, key, value, true);
          
          // Verify the update was applied
          expect(updatedPreferences[key]).toEqual(value);
          
          // Clear cache to force retrieval from persistence
          await cacheService.clearByPattern(`preferences:*`);
          
          // Retrieve and verify persistence
          const persistedPreferences = await service.getUserPreferences(sessionId);
          expect(persistedPreferences[key]).toEqual(value);
          
          // Verify other preferences remain unchanged
          Object.keys(initialPrefs).forEach(otherKey => {
            if (otherKey !== key) {
              expect(persistedPreferences[otherKey as keyof UserPreferences])
                .toEqual(initialPrefs[otherKey as keyof UserPreferences]);
            }
          });
        }
      ),
      { numRuns: 100, timeout: 10000 }
    );
  });

  /**
   * Property: Preference deletion should remove data from all layers
   */
  test('Property: Preference deletion completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.record({
          selectedCryptocurrencies: fc.shuffledSubarray(['bitcoin', 'ethereum', 'dogecoin'], { minLength: 1, maxLength: 3 }),
          timeRange: fc.constantFrom('1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'),
          selectedRegions: fc.shuffledSubarray(['new-york', 'london', 'tokyo', 'paris', 'berlin'], { minLength: 1, maxLength: 5 }),
          chartType: fc.constantFrom('line', 'area', 'candlestick') as fc.Arbitrary<'line' | 'area' | 'candlestick'>,
          theme: fc.constantFrom('light', 'dark') as fc.Arbitrary<'light' | 'dark'>
        }),
        
        async (sessionId: string, preferences: UserPreferences) => {
          // Store preferences
          await service.saveUserPreferences(sessionId, preferences, true);
          
          // Verify preferences exist
          const storedPrefs = await service.getUserPreferences(sessionId);
          expect(storedPrefs).toEqual(preferences);
          
          // Delete preferences
          await service.deleteUserPreferences(sessionId);
          
          // Verify preferences are deleted - should return defaults
          const defaultPrefs = await service.getUserPreferences(sessionId);
          
          // Should return default preferences, not the stored ones
          expect(defaultPrefs.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
          expect(defaultPrefs.timeRange).toBe('7d');
          expect(defaultPrefs.selectedRegions).toEqual(['new-york', 'london', 'tokyo']);
          expect(defaultPrefs.chartType).toBe('line');
          expect(defaultPrefs.theme).toBe('light');
        }
      ),
      { numRuns: 100, timeout: 10000 }
    );
  });

  /**
   * Property: Preference reset should restore defaults and persist them
   */
  test('Property: Preference reset consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.record({
          selectedCryptocurrencies: fc.shuffledSubarray(['bitcoin', 'ethereum', 'dogecoin'], { minLength: 1, maxLength: 3 }),
          timeRange: fc.constantFrom('1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'),
          selectedRegions: fc.shuffledSubarray(['new-york', 'london', 'tokyo', 'paris', 'berlin'], { minLength: 1, maxLength: 5 }),
          chartType: fc.constantFrom('line', 'area', 'candlestick') as fc.Arbitrary<'line' | 'area' | 'candlestick'>,
          theme: fc.constantFrom('light', 'dark') as fc.Arbitrary<'light' | 'dark'>
        }),
        
        async (sessionId: string, customPreferences: UserPreferences) => {
          // Store custom preferences
          await service.saveUserPreferences(sessionId, customPreferences, true);
          
          // Reset preferences
          const resetPreferences = await service.resetPreferences(sessionId);
          
          // Verify reset returns defaults
          expect(resetPreferences.selectedCryptocurrencies).toEqual(['bitcoin', 'ethereum']);
          expect(resetPreferences.timeRange).toBe('7d');
          expect(resetPreferences.selectedRegions).toEqual(['new-york', 'london', 'tokyo']);
          expect(resetPreferences.chartType).toBe('line');
          expect(resetPreferences.theme).toBe('light');
          
          // Clear cache and verify persistence of reset
          await cacheService.clearByPattern(`preferences:*`);
          
          const persistedDefaults = await service.getUserPreferences(sessionId);
          expect(persistedDefaults).toEqual(resetPreferences);
        }
      ),
      { numRuns: 100, timeout: 10000 }
    );
  });

  /**
   * Property: Invalid preferences should be validated and corrected
   */
  test('Property: Preference validation and correction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        
        async (sessionId: string) => {
          // Test various invalid preference combinations
          const invalidPreferences = [
            { selectedCryptocurrencies: [] }, // Empty array
            { selectedCryptocurrencies: ['invalid-crypto'] }, // Invalid crypto
            { timeRange: 'invalid-range' }, // Invalid time range
            { selectedRegions: [] }, // Empty regions
            { selectedRegions: ['invalid-region'] }, // Invalid region
            { chartType: 'invalid-chart' }, // Invalid chart type
            { theme: 'invalid-theme' } // Invalid theme
          ];
          
          for (const invalidPrefs of invalidPreferences) {
            const result = await service.saveUserPreferences(sessionId, invalidPrefs as any, true);
            
            // Verify that invalid preferences are corrected to valid defaults
            expect(result.selectedCryptocurrencies).toEqual(
              expect.arrayContaining(['bitcoin', 'ethereum'])
            );
            expect(['1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'])
              .toContain(result.timeRange);
            expect(result.selectedRegions.length).toBeGreaterThan(0);
            expect(['line', 'area', 'candlestick']).toContain(result.chartType);
            expect(['light', 'dark']).toContain(result.theme);
          }
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  /**
   * Property: Concurrent preference operations should maintain consistency
   */
  test('Property: Concurrent preference operation consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(
          fc.record({
            selectedCryptocurrencies: fc.shuffledSubarray(['bitcoin', 'ethereum', 'dogecoin'], { minLength: 1, maxLength: 3 }),
            timeRange: fc.constantFrom('1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', '90d', '1y'),
            selectedRegions: fc.shuffledSubarray(['new-york', 'london', 'tokyo', 'paris', 'berlin'], { minLength: 1, maxLength: 5 }),
            chartType: fc.constantFrom('line', 'area', 'candlestick') as fc.Arbitrary<'line' | 'area' | 'candlestick'>,
            theme: fc.constantFrom('light', 'dark') as fc.Arbitrary<'light' | 'dark'>
          }),
          { minLength: 2, maxLength: 5 }
        ),
        
        async (sessionId: string, preferenceUpdates: UserPreferences[]) => {
          // Perform concurrent preference updates
          const updatePromises = preferenceUpdates.map((prefs, index) => 
            service.saveUserPreferences(`${sessionId}-${index}`, prefs, true)
          );
          
          const results = await Promise.all(updatePromises);
          
          // Verify each update was processed correctly
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const expected = preferenceUpdates[i];
            
            expect(result.selectedCryptocurrencies).toEqual(expected.selectedCryptocurrencies);
            expect(result.timeRange).toBe(expected.timeRange);
            expect(result.selectedRegions).toEqual(expected.selectedRegions);
            expect(result.chartType).toBe(expected.chartType);
            expect(result.theme).toBe(expected.theme);
            
            // Verify persistence
            const retrieved = await service.getUserPreferences(`${sessionId}-${i}`);
            expect(retrieved).toEqual(result);
          }
        }
      ),
      { numRuns: 50, timeout: 15000 }
    );
  });
});