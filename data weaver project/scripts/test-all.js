#!/usr/bin/env node

/**
 * Comprehensive test runner for Pigeon-Crypto Dashboard
 * Runs all tests and generates a comprehensive report
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'blue');
  console.log('-'.repeat(40));
}

// Test runner function
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'yellow');
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Test results tracking
const testResults = {
  frontend: { unit: null, integration: null, property: null },
  backend: { unit: null, integration: null, property: null },
  e2e: null,
  build: null,
  lint: null
};

async function runTests() {
  logHeader('🧪 Pigeon-Crypto Dashboard - Comprehensive Test Suite');
  
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // 1. Lint checks
    logSection('📝 Running Lint Checks');
    try {
      await runCommand('npm', ['run', 'lint:frontend']);
      await runCommand('npm', ['run', 'lint:backend']);
      testResults.lint = 'PASSED';
      passedTests++;
      log('✅ Lint checks passed', 'green');
    } catch (error) {
      testResults.lint = 'FAILED';
      failedTests++;
      log('❌ Lint checks failed', 'red');
    }
    totalTests++;

    // 2. Frontend tests
    logSection('⚛️ Running Frontend Tests');
    
    // Frontend unit tests
    try {
      await runCommand('npm', ['test', '--', '--passWithNoTests', '--watchAll=false'], 'frontend');
      testResults.frontend.unit = 'PASSED';
      passedTests++;
      log('✅ Frontend unit tests passed', 'green');
    } catch (error) {
      testResults.frontend.unit = 'FAILED';
      failedTests++;
      log('❌ Frontend unit tests failed', 'red');
    }
    totalTests++;

    // Frontend property-based tests
    try {
      await runCommand('npm', ['test', 'Dashboard.property.test.tsx', '--', '--passWithNoTests', '--watchAll=false'], 'frontend');
      testResults.frontend.property = 'PASSED';
      passedTests++;
      log('✅ Frontend property tests passed', 'green');
    } catch (error) {
      testResults.frontend.property = 'FAILED';
      failedTests++;
      log('❌ Frontend property tests failed', 'red');
    }
    totalTests++;

    // Frontend integration tests
    try {
      await runCommand('npm', ['test', 'Dashboard.integration.test.tsx', '--', '--passWithNoTests', '--watchAll=false'], 'frontend');
      testResults.frontend.integration = 'PASSED';
      passedTests++;
      log('✅ Frontend integration tests passed', 'green');
    } catch (error) {
      testResults.frontend.integration = 'FAILED';
      failedTests++;
      log('❌ Frontend integration tests failed', 'red');
    }
    totalTests++;

    // 3. Backend tests
    logSection('🔧 Running Backend Tests');
    
    // Backend unit tests
    try {
      await runCommand('npm', ['test', '--', '--passWithNoTests'], 'backend');
      testResults.backend.unit = 'PASSED';
      passedTests++;
      log('✅ Backend unit tests passed', 'green');
    } catch (error) {
      testResults.backend.unit = 'FAILED';
      failedTests++;
      log('❌ Backend unit tests failed', 'red');
    }
    totalTests++;

    // Backend property-based tests
    try {
      await runCommand('npm', ['test', '-- --testNamePattern="Property"', '--passWithNoTests'], 'backend');
      testResults.backend.property = 'PASSED';
      passedTests++;
      log('✅ Backend property tests passed', 'green');
    } catch (error) {
      testResults.backend.property = 'FAILED';
      failedTests++;
      log('❌ Backend property tests failed', 'red');
    }
    totalTests++;

    // Backend integration tests
    try {
      await runCommand('npm', ['test', 'integration.test.ts', '--', '--passWithNoTests'], 'backend');
      testResults.backend.integration = 'PASSED';
      passedTests++;
      log('✅ Backend integration tests passed', 'green');
    } catch (error) {
      testResults.backend.integration = 'FAILED';
      failedTests++;
      log('❌ Backend integration tests failed', 'red');
    }
    totalTests++;

    // 4. Build test
    logSection('🏗️ Testing Production Build');
    try {
      await runCommand('npm', ['run', 'build:frontend']);
      await runCommand('npm', ['run', 'build:backend']);
      testResults.build = 'PASSED';
      passedTests++;
      log('✅ Production build successful', 'green');
    } catch (error) {
      testResults.build = 'FAILED';
      failedTests++;
      log('❌ Production build failed', 'red');
    }
    totalTests++;

  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'red');
  }

  // Generate test report
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  logHeader('📊 Test Results Summary');
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(colorize(`Passed: ${passedTests}`, 'green'));
  console.log(colorize(`Failed: ${failedTests}`, 'red'));
  console.log(`Duration: ${duration}s`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  console.log('\nDetailed Results:');
  console.log('Frontend:');
  console.log(`  Unit Tests: ${colorize(testResults.frontend.unit || 'SKIPPED', testResults.frontend.unit === 'PASSED' ? 'green' : 'red')}`);
  console.log(`  Property Tests: ${colorize(testResults.frontend.property || 'SKIPPED', testResults.frontend.property === 'PASSED' ? 'green' : 'red')}`);
  console.log(`  Integration Tests: ${colorize(testResults.frontend.integration || 'SKIPPED', testResults.frontend.integration === 'PASSED' ? 'green' : 'red')}`);
  
  console.log('Backend:');
  console.log(`  Unit Tests: ${colorize(testResults.backend.unit || 'SKIPPED', testResults.backend.unit === 'PASSED' ? 'green' : 'red')}`);
  console.log(`  Property Tests: ${colorize(testResults.backend.property || 'SKIPPED', testResults.backend.property === 'PASSED' ? 'green' : 'red')}`);
  console.log(`  Integration Tests: ${colorize(testResults.backend.integration || 'SKIPPED', testResults.backend.integration === 'PASSED' ? 'green' : 'red')}`);
  
  console.log('Build & Quality:');
  console.log(`  Lint Checks: ${colorize(testResults.lint || 'SKIPPED', testResults.lint === 'PASSED' ? 'green' : 'red')}`);
  console.log(`  Production Build: ${colorize(testResults.build || 'SKIPPED', testResults.build === 'PASSED' ? 'green' : 'red')}`);

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    duration: duration,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    },
    results: testResults,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }

  const reportPath = `reports/test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📄 Test report saved to: ${reportPath}`, 'cyan');

  // Exit with appropriate code
  if (failedTests > 0) {
    logHeader('❌ Some tests failed!');
    process.exit(1);
  } else {
    logHeader('🎉 All tests passed!');
    
    console.log('\nNext steps:');
    console.log('1. Review test coverage reports');
    console.log('2. Run deployment: npm run deploy');
    console.log('3. Monitor application health');
    
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⚠️ Test run interrupted by user', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️ Test run terminated', 'yellow');
  process.exit(143);
});

// Run tests
runTests().catch((error) => {
  log(`\n💥 Test runner crashed: ${error.message}`, 'red');
  process.exit(1);
});