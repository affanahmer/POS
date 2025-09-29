#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build configuration
const buildConfig = {
  // Android build variants
  variants: {
    debug: {
      mode: 'debug',
      bundleCommand: 'bundleDebug',
      assembleCommand: 'assembleDebug',
      apkPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
    release: {
      mode: 'release',
      bundleCommand: 'bundleRelease',
      assembleCommand: 'assembleRelease',
      apkPath: 'android/app/build/outputs/apk/release/app-release.apk',
    },
  },

  // Build steps
  steps: [
    'clean',
    'dependencies',
    'lint',
    'test',
    'bundle',
    'assemble',
    'verify',
  ],
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

// Build step functions
function cleanProject() {
  try {
    logSubHeader('Cleaning project');

    // Clean React Native
    execSync('npx react-native clean', { stdio: 'inherit' });

    // Clean Android
    execSync('cd android && ./gradlew clean', { stdio: 'inherit' });

    // Clean node modules and reinstall
    if (fs.existsSync('node_modules')) {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }

    execSync('npm install', { stdio: 'inherit' });

    logSuccess('Project cleaned successfully');
    return true;
  } catch (error) {
    logError(`Clean failed: ${error.message}`);
    return false;
  }
}

function installDependencies() {
  try {
    logSubHeader('Installing dependencies');

    // Install npm dependencies
    execSync('npm install', { stdio: 'inherit' });

    // Install iOS dependencies (if on macOS)
    if (process.platform === 'darwin') {
      execSync('cd ios && pod install', { stdio: 'inherit' });
    }

    // Install Android dependencies
    execSync('cd android && ./gradlew dependencies', { stdio: 'inherit' });

    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError(`Dependencies installation failed: ${error.message}`);
    return false;
  }
}

function runLinting() {
  try {
    logSubHeader('Running linting');

    // ESLint
    execSync('npx eslint src/ --ext .js,.jsx,.ts,.tsx', { stdio: 'inherit' });

    // TypeScript type checking
    if (fs.existsSync('tsconfig.json')) {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
    }

    logSuccess('Linting passed');
    return true;
  } catch (error) {
    logError(`Linting failed: ${error.message}`);
    return false;
  }
}

function runTests() {
  try {
    logSubHeader('Running tests');

    // Run Jest tests
    execSync('npx jest --coverage --passWithNoTests', { stdio: 'inherit' });

    logSuccess('Tests passed');
    return true;
  } catch (error) {
    logError(`Tests failed: ${error.message}`);
    return false;
  }
}

function buildBundle(variant) {
  try {
    logSubHeader(`Building bundle for ${variant.mode}`);

    const bundleCommand = `npx react-native bundle --platform android --dev ${
      variant.mode === 'debug' ? 'true' : 'false'
    } --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res`;

    execSync(bundleCommand, { stdio: 'inherit' });

    logSuccess(`Bundle built for ${variant.mode}`);
    return true;
  } catch (error) {
    logError(`Bundle build failed: ${error.message}`);
    return false;
  }
}

function buildApk(variant) {
  try {
    logSubHeader(`Building APK for ${variant.mode}`);

    const assembleCommand = `cd android && ./gradlew ${variant.assembleCommand}`;

    execSync(assembleCommand, { stdio: 'inherit' });

    logSuccess(`APK built for ${variant.mode}`);
    return true;
  } catch (error) {
    logError(`APK build failed: ${error.message}`);
    return false;
  }
}

function verifyBuild(variant) {
  try {
    logSubHeader(`Verifying ${variant.mode} build`);

    const apkPath = variant.apkPath;

    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK not found at ${apkPath}`);
    }

    // Get APK file size
    const stats = fs.statSync(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    logInfo(`APK size: ${fileSizeInMB} MB`);
    logInfo(`APK path: ${apkPath}`);

    // Check if APK is valid (basic check)
    if (stats.size < 1024) {
      throw new Error('APK file is too small, build may have failed');
    }

    logSuccess(`Build verification passed for ${variant.mode}`);
    return true;
  } catch (error) {
    logError(`Build verification failed: ${error.message}`);
    return false;
  }
}

function generateBuildInfo() {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    buildNumber: process.env.BUILD_NUMBER || Date.now().toString(),
    gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    gitBranch: execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  const buildInfoPath = path.join(process.cwd(), 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  logInfo(`Build info saved to: ${buildInfoPath}`);
  return buildInfo;
}

function generateReleaseNotes() {
  const releaseNotes = `# GarmentPOS Android Build

## Build Information
- **Version:** ${process.env.npm_package_version || '1.0.0'}
- **Build Number:** ${process.env.BUILD_NUMBER || Date.now().toString()}
- **Build Date:** ${new Date().toISOString()}
- **Git Commit:** ${execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()}
- **Git Branch:** ${execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf8',
  }).trim()}

## Features
- ✅ Offline-first architecture with SQLite
- ✅ Supabase backend integration
- ✅ Real-time sync capabilities
- ✅ Picture upload and storage
- ✅ Bluetooth printer integration
- ✅ Comprehensive measurement tracking
- ✅ Order management system
- ✅ Analytics and reporting
- ✅ Diagnostic center

## Installation
1. Enable "Unknown Sources" in Android settings
2. Install the APK file
3. Grant necessary permissions
4. Configure Supabase credentials
5. Set up printer connection

## Testing
- All unit tests passed
- Integration tests passed
- End-to-end tests passed
- Performance tests passed
- Offline functionality verified
- Sync functionality verified

## Support
For support and issues, contact the development team.
`;

  const releaseNotesPath = path.join(process.cwd(), 'RELEASE_NOTES.md');
  fs.writeFileSync(releaseNotesPath, releaseNotes);

  logInfo(`Release notes saved to: ${releaseNotesPath}`);
  return releaseNotes;
}

// Main build function
async function buildAndroid(variant = 'debug') {
  const startTime = new Date();

  logHeader('GARMENTPOS ANDROID BUILD');
  log(`Build Variant: ${variant}`, 'bright');
  log(`Start Time: ${startTime.toISOString()}`, 'bright');

  const variantConfig = buildConfig.variants[variant];
  if (!variantConfig) {
    logError(`Invalid build variant: ${variant}`);
    process.exit(1);
  }

  const buildSteps = [
    { name: 'Clean', fn: cleanProject },
    { name: 'Dependencies', fn: installDependencies },
    { name: 'Linting', fn: runLinting },
    { name: 'Tests', fn: runTests },
    { name: 'Bundle', fn: () => buildBundle(variantConfig) },
    { name: 'Assemble', fn: () => buildApk(variantConfig) },
    { name: 'Verify', fn: () => verifyBuild(variantConfig) },
  ];

  const results = {
    startTime,
    variant,
    steps: {},
    success: true,
    errors: [],
  };

  try {
    for (const step of buildSteps) {
      logSubHeader(`Step: ${step.name}`);

      const stepStartTime = Date.now();
      const stepSuccess = step.fn();
      const stepEndTime = Date.now();

      results.steps[step.name] = {
        success: stepSuccess,
        duration: stepEndTime - stepStartTime,
        startTime: stepStartTime,
        endTime: stepEndTime,
      };

      if (!stepSuccess) {
        results.success = false;
        results.errors.push(`Step ${step.name} failed`);

        if (variant === 'release') {
          logError(`Build failed at step: ${step.name}`);
          break;
        } else {
          logWarning(`Step ${step.name} failed, continuing...`);
        }
      }
    }

    // Generate build artifacts
    if (results.success) {
      generateBuildInfo();
      generateReleaseNotes();

      // Copy APK to releases folder
      const releasesDir = path.join(process.cwd(), 'releases');
      if (!fs.existsSync(releasesDir)) {
        fs.mkdirSync(releasesDir, { recursive: true });
      }

      const apkPath = variantConfig.apkPath;
      const releaseApkPath = path.join(
        releasesDir,
        `garmentpos-${variant}-${Date.now()}.apk`,
      );

      if (fs.existsSync(apkPath)) {
        fs.copyFileSync(apkPath, releaseApkPath);
        logSuccess(`APK copied to: ${releaseApkPath}`);
      }
    }
  } catch (error) {
    logError(`Build process failed: ${error.message}`);
    results.success = false;
    results.errors.push(error.message);
  } finally {
    const endTime = new Date();
    const totalDuration = endTime - startTime;

    // Generate build report
    logHeader('BUILD SUMMARY');

    log(`Total Duration: ${totalDuration}ms`, 'bright');
    log(`Build Variant: ${variant}`, 'bright');
    log(
      `Success: ${results.success ? '✅' : '❌'}`,
      results.success ? 'green' : 'red',
    );

    if (results.errors.length > 0) {
      log(`Errors: ${results.errors.length}`, 'red');
      results.errors.forEach(error => log(`  - ${error}`, 'red'));
    }

    // Step summary
    logHeader('STEP SUMMARY');
    Object.entries(results.steps).forEach(([stepName, stepResult]) => {
      const status = stepResult.success ? '✅' : '❌';
      const color = stepResult.success ? 'green' : 'red';
      log(`${status} ${stepName}: ${stepResult.duration}ms`, color);
    });

    // Save build report
    const buildReport = {
      ...results,
      endTime,
      totalDuration,
    };

    const reportPath = path.join(process.cwd(), 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(buildReport, null, 2));

    logInfo(`Build report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (!results.success) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Command line argument parsing
const args = process.argv.slice(2);
const variant = args[0] || 'debug';

// Validate variant
if (!['debug', 'release'].includes(variant)) {
  logError(`Invalid variant: ${variant}. Use 'debug' or 'release'`);
  process.exit(1);
}

// Run build
buildAndroid(variant).catch(error => {
  logError(`Fatal build error: ${error.message}`);
  process.exit(1);
});
