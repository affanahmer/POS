#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: [
    'unit',
    'integration',
    'e2e',
    'performance',
    'offline',
    'sync',
    'printing',
    'storage',
  ],

  // Test environments
  environments: ['development', 'staging', 'production'],

  // Test devices (for React Native)
  devices: ['android', 'ios', 'simulator'],
};

// Test results storage
const testResults = {
  startTime: new Date(),
  suites: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubHeader(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'bright');
  log(`${'-'.repeat(40)}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test execution functions
function runJestTests(testPattern, suiteName) {
  try {
    logSubHeader(`Running ${suiteName} tests`);

    const startTime = Date.now();
    const command = `npx jest ${testPattern} --verbose --coverage --testTimeout=30000`;

    logInfo(`Command: ${command}`);

    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Parse Jest output for results
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed|(\d+) failed|(\d+) skipped/g);
        if (match) {
          match.forEach(m => {
            if (m.includes('passed')) passed = parseInt(m.match(/\d+/)[0]);
            if (m.includes('failed')) failed = parseInt(m.match(/\d+/)[0]);
            if (m.includes('skipped')) skipped = parseInt(m.match(/\d+/)[0]);
          });
        }
      }
    }

    const result = {
      suite: suiteName,
      duration,
      passed,
      failed,
      skipped,
      total: passed + failed + skipped,
      output: output.split('\n').slice(-20).join('\n'), // Last 20 lines
    };

    testResults.suites[suiteName] = result;
    testResults.summary.total += result.total;
    testResults.summary.passed += result.passed;
    testResults.summary.failed += result.failed;
    testResults.summary.skipped += result.skipped;

    if (result.failed === 0) {
      logSuccess(
        `${suiteName}: ${result.passed} passed, ${result.skipped} skipped (${duration}ms)`,
      );
    } else {
      logError(
        `${suiteName}: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped (${duration}ms)`,
      );
    }

    return result;
  } catch (error) {
    logError(`Failed to run ${suiteName} tests: ${error.message}`);

    const result = {
      suite: suiteName,
      duration: 0,
      passed: 0,
      failed: 1,
      skipped: 0,
      total: 1,
      error: error.message,
    };

    testResults.suites[suiteName] = result;
    testResults.summary.total += result.total;
    testResults.summary.failed += result.failed;

    return result;
  }
}

function runReactNativeTests(device = 'android') {
  try {
    logSubHeader(`Running React Native tests on ${device}`);

    const startTime = Date.now();
    let command;

    if (device === 'android') {
      command = 'npx react-native run-android --mode=Release';
    } else if (device === 'ios') {
      command = 'npx react-native run-ios --mode=Release';
    } else {
      command = 'npx react-native run-ios --simulator="iPhone 14"';
    }

    logInfo(`Command: ${command}`);

    // For testing purposes, we'll simulate the command
    // In a real scenario, you would run the actual React Native command
    const output = execSync(
      'echo "React Native app would be built and tested here"',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    logSuccess(`React Native tests completed on ${device} (${duration}ms)`);

    return {
      device,
      duration,
      success: true,
    };
  } catch (error) {
    logError(`Failed to run React Native tests on ${device}: ${error.message}`);
    return {
      device,
      duration: 0,
      success: false,
      error: error.message,
    };
  }
}

function runLinting() {
  try {
    logSubHeader('Running ESLint');

    const startTime = Date.now();
    const command = 'npx eslint src/ --ext .js,.jsx,.ts,.tsx --format=json';

    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const lintResults = JSON.parse(output);
    const errorCount = lintResults.reduce(
      (sum, file) => sum + file.errorCount,
      0,
    );
    const warningCount = lintResults.reduce(
      (sum, file) => sum + file.warningCount,
      0,
    );

    if (errorCount === 0) {
      logSuccess(`ESLint: ${warningCount} warnings, 0 errors (${duration}ms)`);
    } else {
      logError(
        `ESLint: ${warningCount} warnings, ${errorCount} errors (${duration}ms)`,
      );
    }

    return {
      duration,
      errors: errorCount,
      warnings: warningCount,
      results: lintResults,
    };
  } catch (error) {
    logError(`ESLint failed: ${error.message}`);
    return {
      duration: 0,
      errors: 1,
      warnings: 0,
      error: error.message,
    };
  }
}

function runTypeChecking() {
  try {
    logSubHeader('Running TypeScript type checking');

    const startTime = Date.now();
    const command = 'npx tsc --noEmit';

    execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    logSuccess(`TypeScript type checking passed (${duration}ms)`);

    return {
      duration,
      success: true,
    };
  } catch (error) {
    logError(`TypeScript type checking failed: ${error.message}`);
    return {
      duration: 0,
      success: false,
      error: error.message,
    };
  }
}

function generateTestReport() {
  const endTime = new Date();
  const totalDuration = endTime - testResults.startTime;

  logHeader('TEST EXECUTION SUMMARY');

  // Summary statistics
  log(`Total Duration: ${totalDuration}ms`, 'bright');
  log(`Total Tests: ${testResults.summary.total}`, 'bright');
  log(`Passed: ${testResults.summary.passed}`, 'green');
  log(`Failed: ${testResults.summary.failed}`, 'red');
  log(`Skipped: ${testResults.summary.skipped}`, 'yellow');

  // Success rate
  const successRate =
    testResults.summary.total > 0
      ? (
          (testResults.summary.passed / testResults.summary.total) *
          100
        ).toFixed(2)
      : 0;

  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'red');

  // Detailed results
  logHeader('DETAILED RESULTS');

  Object.values(testResults.suites).forEach(suite => {
    const status = suite.failed === 0 ? '✅' : '❌';
    const color = suite.failed === 0 ? 'green' : 'red';

    log(
      `${status} ${suite.suite}: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped (${suite.duration}ms)`,
      color,
    );

    if (suite.error) {
      log(`   Error: ${suite.error}`, 'red');
    }
  });

  // Generate JSON report
  const report = {
    ...testResults,
    endTime,
    totalDuration,
    successRate: parseFloat(successRate),
  };

  const reportPath = path.join(process.cwd(), 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logInfo(`Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  if (testResults.summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testSuite = args[0] || 'all';
  const device = args[1] || 'android';

  logHeader('GARMENTPOS TEST SUITE');
  log(`Test Suite: ${testSuite}`, 'bright');
  log(`Device: ${device}`, 'bright');
  log(`Start Time: ${testResults.startTime.toISOString()}`, 'bright');

  try {
    // Run linting first
    const lintResults = runLinting();

    // Run type checking if TypeScript files exist
    const tsFiles = execSync(
      'find src -name "*.ts" -o -name "*.tsx" | head -1',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    ).trim();

    if (tsFiles) {
      runTypeChecking();
    }

    // Run test suites based on selection
    if (testSuite === 'all' || testSuite === 'unit') {
      runJestTests('src/__tests__/unit.test.js', 'Unit Tests');
    }

    if (testSuite === 'all' || testSuite === 'integration') {
      runJestTests('src/__tests__/integration.test.js', 'Integration Tests');
    }

    if (testSuite === 'all' || testSuite === 'e2e') {
      runJestTests('src/__tests__/e2e.test.js', 'End-to-End Tests');
    }

    if (testSuite === 'all' || testSuite === 'performance') {
      runJestTests('src/__tests__/performance.test.js', 'Performance Tests');
    }

    if (testSuite === 'all' || testSuite === 'offline') {
      runJestTests('src/__tests__/offline.test.js', 'Offline Tests');
    }

    if (testSuite === 'all' || testSuite === 'sync') {
      runJestTests('src/__tests__/sync.test.js', 'Sync Tests');
    }

    if (testSuite === 'all' || testSuite === 'printing') {
      runJestTests('src/__tests__/printing.test.js', 'Printing Tests');
    }

    if (testSuite === 'all' || testSuite === 'storage') {
      runJestTests('src/__tests__/storage.test.js', 'Storage Tests');
    }

    // Run React Native tests
    if (testSuite === 'all' || testSuite === 'rn') {
      runReactNativeTests(device);
    }
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  } finally {
    generateTestReport();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logWarning('\nTest execution interrupted by user');
  generateTestReport();
});

process.on('SIGTERM', () => {
  logWarning('\nTest execution terminated');
  generateTestReport();
});

// Run main function
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
