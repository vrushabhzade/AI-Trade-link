#!/usr/bin/env node

/**
 * Deployment Diagnostic Script
 * Checks for common deployment issues before deploying to Vercel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 TradeLink Deployment Diagnostic\n');
console.log('=' .repeat(50));

const issues = [];
const warnings = [];
const success = [];

// Check 1: Verify project structure
console.log('\n📁 Checking project structure...');
const requiredFiles = [
  'vercel.json',
  'frontend/package.json',
  'backend/package.json',
  'backend/prisma/schema.prisma',
  'frontend/vite.config.ts',
  'backend/src/index.ts'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✓ Found ${file}`);
  } else {
    issues.push(`✗ Missing ${file}`);
  }
});

// Check 2: Verify package.json scripts
console.log('\n📦 Checking build scripts...');
try {
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));

  if (frontendPkg.scripts && frontendPkg.scripts.build) {
    success.push('✓ Frontend build script exists');
  } else {
    issues.push('✗ Frontend build script missing');
  }

  if (frontendPkg.scripts && frontendPkg.scripts['vercel-build']) {
    success.push('✓ Frontend vercel-build script exists');
  } else {
    warnings.push('⚠ Frontend vercel-build script missing (will use build)');
  }

  if (backendPkg.scripts && backendPkg.scripts.build) {
    success.push('✓ Backend build script exists');
  } else {
    issues.push('✗ Backend build script missing');
  }

  if (backendPkg.scripts && backendPkg.scripts['vercel-build']) {
    success.push('✓ Backend vercel-build script exists');
  } else {
    warnings.push('⚠ Backend vercel-build script missing (will use build)');
  }
} catch (error) {
  issues.push(`✗ Error reading package.json: ${error.message}`);
}

// Check 3: Test TypeScript compilation
console.log('\n🔨 Testing TypeScript compilation...');
try {
  console.log('  Testing frontend...');
  execSync('cd frontend && npx tsc --noEmit', { stdio: 'pipe' });
  success.push('✓ Frontend TypeScript compiles');
} catch (error) {
  issues.push('✗ Frontend TypeScript has errors');
  console.log('  Run: cd frontend && npx tsc --noEmit');
}

try {
  console.log('  Testing backend...');
  execSync('cd backend && npx tsc --noEmit', { stdio: 'pipe' });
  success.push('✓ Backend TypeScript compiles');
} catch (error) {
  issues.push('✗ Backend TypeScript has errors');
  console.log('  Run: cd backend && npx tsc --noEmit');
}

// Check 4: Verify environment variables
console.log('\n🔐 Checking environment configuration...');
const envExample = 'backend/.env.example';
const envFile = 'backend/.env';

if (fs.existsSync(envExample)) {
  success.push('✓ .env.example exists');
  
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL',
    'ANTHROPIC_API_KEY'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      success.push(`✓ ${varName} documented in .env.example`);
    } else {
      warnings.push(`⚠ ${varName} not in .env.example`);
    }
  });
} else {
  warnings.push('⚠ .env.example not found');
}

if (fs.existsSync(envFile)) {
  success.push('✓ .env file exists (for local development)');
} else {
  warnings.push('⚠ .env file not found (needed for local testing)');
}

// Check 5: Verify Prisma schema
console.log('\n🗄️  Checking database configuration...');
try {
  const schemaPath = 'backend/prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('provider = "postgresql"')) {
      success.push('✓ PostgreSQL configured in Prisma');
    } else {
      warnings.push('⚠ Database provider not PostgreSQL');
    }

    if (schema.includes('env("DATABASE_URL")')) {
      success.push('✓ DATABASE_URL environment variable used');
    } else {
      issues.push('✗ DATABASE_URL not configured in schema');
    }
  }
} catch (error) {
  warnings.push(`⚠ Could not read Prisma schema: ${error.message}`);
}

// Check 6: Verify vercel.json configuration
console.log('\n⚙️  Checking Vercel configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.builds.length > 0) {
    success.push('✓ Vercel builds configured');
  } else {
    issues.push('✗ No builds configured in vercel.json');
  }

  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    success.push('✓ Vercel routes configured');
  } else {
    warnings.push('⚠ No routes configured in vercel.json');
  }
} catch (error) {
  issues.push(`✗ Error reading vercel.json: ${error.message}`);
}

// Check 7: Check for common issues
console.log('\n🔍 Checking for common issues...');

// Check for hardcoded localhost
const filesToCheck = [
  'frontend/src/utils/apiHelpers.ts',
  'frontend/src/hooks/useAuth.ts',
  'backend/src/index.ts'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('localhost:3000') || content.includes('localhost:3001')) {
      warnings.push(`⚠ Hardcoded localhost found in ${file}`);
    }
  }
});

// Check for .env in .gitignore
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    success.push('✓ .env files ignored in git');
  } else {
    warnings.push('⚠ .env not in .gitignore');
  }
}

// Print Results
console.log('\n' + '='.repeat(50));
console.log('\n📊 DIAGNOSTIC RESULTS\n');

if (success.length > 0) {
  console.log('✅ SUCCESS (' + success.length + ')');
  success.forEach(msg => console.log('  ' + msg));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + warnings.length + ')');
  warnings.forEach(msg => console.log('  ' + msg));
}

if (issues.length > 0) {
  console.log('\n❌ ISSUES (' + issues.length + ')');
  issues.forEach(msg => console.log('  ' + msg));
}

// Final recommendation
console.log('\n' + '='.repeat(50));
if (issues.length === 0) {
  console.log('\n✅ Ready to deploy!');
  console.log('\nNext steps:');
  console.log('  1. Push code to GitHub: git push origin main');
  console.log('  2. Go to https://vercel.com/new');
  console.log('  3. Import your repository');
  console.log('  4. Add environment variables');
  console.log('  5. Deploy!');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Address warnings for best results');
  }
} else {
  console.log('\n❌ Fix issues before deploying');
  console.log('\nRun this script again after fixing issues:');
  console.log('  node scripts/diagnose-deployment.js');
}

console.log('\n📖 For detailed troubleshooting, see:');
console.log('  DEPLOYMENT_TROUBLESHOOTING.md');
console.log('  VERCEL_DEPLOYMENT.md');
console.log('');

process.exit(issues.length > 0 ? 1 : 0);
