#!/usr/bin/env node

/**
 * Integration Verification Script
 * 
 * Verifies that all components work together correctly
 * Tests end-to-end data flow and error handling
 */

import axios from 'axios';
import WebSocket from 'ws';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:3001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  console.log(`${icon} ${colorize(name, color)} ${details}`);
}

class IntegrationVerifier {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    try {
      const result = await testFn();
      if (result === true || result === undefined) {
        this.results.passed++;
        logTest(name, 'PASS');
      } else if (result === 'WARN') {
        this.results.warnings++;
        logTest(name, 'WARN', '(non-critical)');
      } else {
        this.results.failed++;
        logTest(name, 'FAIL', result);
      }
    } catch (error) {
      this.results.failed++;
      logTest(name, 'FAIL', error.message);
    }
  }

  async verifyHealthEndpoints() {
    log('\n🏥 Health Endpoints', 'cyan');
    
    await this.runTest('Basic health check', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      if (response.status !== 200 || response.data.status !== 'ok') {
        throw new Error(`Expected status 'ok', got '${response.data.status}'`);
      }
    });

    await this.runTest('Detailed health check', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/health/detailed`, { timeout: 10000 });
      if (response.status !== 200 || !response.data.services) {
        throw new Error('Missing services in health response');
      }
      
      const services = response.data.services;
      const requiredServices = ['cache', 'persistence', 'websocket', 'performance', 'errors'];
      
      for (const service of requiredServices) {
        if (!services[service]) {
          throw new Error(`Missing service: ${service}`);
        }
      }
    });
  }

  async verifyAPIEndpoints() {
    log('\n🔌 API Endpoints', 'cyan');

    await this.runTest('Crypto supported currencies', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/crypto/supported`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to get supported cryptocurrencies');
      }
      
      const cryptos = response.data.data;
      const requiredCryptos = ['bitcoin', 'ethereum', 'dogecoin'];
      
      for (const crypto of requiredCryptos) {
        if (!cryptos[crypto]) {
          throw new Error(`Missing cryptocurrency: ${crypto}`);
        }
      }
    });

    await this.runTest('Pigeon areas', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/pigeon/areas`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to get pigeon areas');
      }
      
      const areas = response.data.data;
      const requiredAreas = ['new-york', 'london', 'tokyo'];
      
      for (const area of requiredAreas) {
        if (!areas[area]) {
          throw new Error(`Missing area: ${area}`);
        }
      }
    });

    await this.runTest('Dashboard data endpoint', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard-data`, {
        params: {
          timeRange: '1',
          cryptos: 'bitcoin',
          areas: 'new-york'
        },
        timeout: 15000
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Dashboard data request failed');
      }
      
      const data = response.data.data;
      const requiredFields = ['pigeonData', 'cryptoData', 'correlations', 'metadata'];
      
      for (const field of requiredFields) {
        if (!data.hasOwnProperty(field)) {
          throw new Error(`Missing field in dashboard data: ${field}`);
        }
      }
    });
  }

  async verifyErrorHandling() {
    log('\n🚨 Error Handling', 'cyan');

    await this.runTest('Error reporting endpoint', async () => {
      const errorReport = {
        error: {
          type: 'test',
          message: 'Integration test error',
          timestamp: new Date().toISOString()
        },
        context: {
          userAgent: 'Integration Test',
          url: '/test'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/api/errors/report`, errorReport, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Error reporting failed');
      }
    });

    await this.runTest('Error statistics', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/errors/stats`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Error statistics request failed');
      }
      
      const stats = response.data.data;
      const requiredFields = ['totalErrors', 'errorsByType', 'errorsBySeverity', 'offlineMode'];
      
      for (const field of requiredFields) {
        if (!stats.hasOwnProperty(field)) {
          throw new Error(`Missing field in error stats: ${field}`);
        }
      }
    });

    await this.runTest('Invalid endpoint handling', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/nonexistent`, { timeout: 5000 });
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return true; // Expected 404
        }
        throw error;
      }
    });
  }

  async verifyWebSocketConnection() {
    log('\n🔌 WebSocket Connection', 'cyan');

    await this.runTest('WebSocket connection', () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_BASE_URL}/ws`);
        let connected = false;

        const timeout = setTimeout(() => {
          if (!connected) {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        ws.on('open', () => {
          connected = true;
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    await this.runTest('WebSocket subscription', () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_BASE_URL}/ws`);
        let subscribed = false;

        const timeout = setTimeout(() => {
          if (!subscribed) {
            ws.close();
            reject(new Error('WebSocket subscription timeout'));
          }
        }, 10000);

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe-pigeon',
            areas: ['new-york']
          }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'subscription-confirmed') {
              subscribed = true;
              clearTimeout(timeout);
              ws.close();
              resolve(true);
            }
          } catch (error) {
            clearTimeout(timeout);
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  }

  async verifyPerformance() {
    log('\n⚡ Performance', 'cyan');

    await this.runTest('Performance monitoring', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/performance/status`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Performance status request failed');
      }
      
      const stats = response.data.data;
      if (typeof stats.activeUsers !== 'number') {
        throw new Error('Invalid performance stats format');
      }
    });

    await this.runTest('Cache status', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/cache/status`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Cache status request failed');
      }
    });

    await this.runTest('Response time check', async () => {
      const start = Date.now();
      await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      const responseTime = Date.now() - start;
      
      if (responseTime > 3000) {
        return 'WARN'; // Slow but not critical
      }
    });
  }

  async verifyDataFlow() {
    log('\n🔄 Data Flow', 'cyan');

    await this.runTest('End-to-end data flow', async () => {
      // Test complete data flow from API request to response
      const start = Date.now();
      
      const response = await axios.get(`${API_BASE_URL}/api/dashboard-data`, {
        params: {
          timeRange: '1',
          cryptos: 'bitcoin,ethereum',
          areas: 'new-york,london',
          optimize: 'true'
        },
        timeout: 20000
      });
      
      const duration = Date.now() - start;
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Dashboard data request failed');
      }
      
      const data = response.data.data;
      
      // Verify data structure
      if (!Array.isArray(data.pigeonData) || !Array.isArray(data.cryptoData)) {
        throw new Error('Invalid data structure');
      }
      
      // Verify correlations were calculated
      if (!Array.isArray(data.correlations)) {
        throw new Error('Missing correlations');
      }
      
      // Verify performance metrics
      if (!response.data.performance || typeof response.data.performance.responseTime !== 'number') {
        throw new Error('Missing performance metrics');
      }
      
      // Check response time
      if (duration > 10000) {
        return 'WARN'; // Slow but functional
      }
    });

    await this.runTest('Correlation analysis', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/correlations`, {
        params: {
          crypto: 'bitcoin',
          area: 'new-york',
          timeRange: '1'
        },
        timeout: 10000
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Correlation analysis failed');
      }
      
      const data = response.data.data;
      if (!Array.isArray(data.correlations)) {
        throw new Error('Invalid correlation data');
      }
    });
  }

  async verifyUserPreferences() {
    log('\n👤 User Preferences', 'cyan');

    const testSessionId = `test-${Date.now()}`;
    
    await this.runTest('Save user preferences', async () => {
      const preferences = {
        selectedCryptocurrencies: ['bitcoin', 'ethereum'],
        timeRange: '168',
        selectedRegions: ['new-york', 'london'],
        chartType: 'line',
        theme: 'dark'
      };

      const response = await axios.post(`${API_BASE_URL}/api/preferences/${testSessionId}`, {
        preferences
      }, { timeout: 5000 });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to save preferences');
      }
    });

    await this.runTest('Retrieve user preferences', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/preferences/${testSessionId}`, { timeout: 5000 });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to retrieve preferences');
      }
      
      const prefs = response.data.data;
      if (!Array.isArray(prefs.selectedCryptocurrencies) || prefs.timeRange !== '168') {
        throw new Error('Preferences not saved correctly');
      }
    });

    await this.runTest('Clean up test preferences', async () => {
      await axios.delete(`${API_BASE_URL}/api/preferences/${testSessionId}`, { timeout: 5000 });
    });
  }

  async run() {
    log('🔍 Starting Integration Verification', 'blue');
    log(`API Base URL: ${API_BASE_URL}`, 'yellow');
    log(`WebSocket URL: ${WS_BASE_URL}`, 'yellow');
    
    const startTime = Date.now();

    try {
      await this.verifyHealthEndpoints();
      await this.verifyAPIEndpoints();
      await this.verifyErrorHandling();
      await this.verifyWebSocketConnection();
      await this.verifyPerformance();
      await this.verifyDataFlow();
      await this.verifyUserPreferences();
    } catch (error) {
      log(`\n💥 Verification crashed: ${error.message}`, 'red');
      process.exit(1);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Results summary
    log('\n📊 Integration Verification Results', 'cyan');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(colorize(`Passed: ${this.results.passed}`, 'green'));
    console.log(colorize(`Failed: ${this.results.failed}`, 'red'));
    console.log(colorize(`Warnings: ${this.results.warnings}`, 'yellow'));
    console.log(`Duration: ${duration}s`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);

    if (this.results.failed > 0) {
      log('\n❌ Integration verification failed!', 'red');
      log('Some components are not working correctly.', 'red');
      process.exit(1);
    } else if (this.results.warnings > 0) {
      log('\n⚠️ Integration verification completed with warnings', 'yellow');
      log('All critical functionality works, but some performance issues detected.', 'yellow');
    } else {
      log('\n🎉 Integration verification passed!', 'green');
      log('All components are working correctly together.', 'green');
    }

    log('\nNext steps:', 'cyan');
    console.log('1. Monitor application logs for any runtime issues');
    console.log('2. Run load testing if needed');
    console.log('3. Deploy to production environment');
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⚠️ Verification interrupted by user', 'yellow');
  process.exit(130);
});

// Run verification
const verifier = new IntegrationVerifier();
verifier.run().catch((error) => {
  log(`\n💥 Verification failed: ${error.message}`, 'red');
  process.exit(1);
});