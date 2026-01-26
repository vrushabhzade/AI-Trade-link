#!/usr/bin/env node

/**
 * Quick Fix Script for Common Deployment Issues
 * Automatically fixes common problems that prevent deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 TradeLink Deployment Quick Fix\n');
console.log('=' .repeat(50));

const fixes = [];
const skipped = [];

// Fix 1: Ensure vercel-build scripts exist
console.log('\n📦 Checking build scripts...');

try {
  const frontendPkgPath = 'frontend/package.json';
  const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
  
  if (!frontendPkg.scripts['vercel-build']) {
    frontendPkg.scripts['vercel-build'] = frontendPkg.scripts.build || 'tsc && vite build';
    fs.writeFileSync(frontendPkgPath, JSON.stringify(frontendPkg, null, 2));
    fixes.push('✓ Added vercel-build script to frontend/package.json');
  } else {
    skipped.push('⊘ Frontend vercel-build already exists');
  }
} catch (error) {
  console.error('✗ Error fixing frontend package.json:', error.message);
}

try {
  const backendPkgPath = 'backend/package.json';
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
  
  if (!backendPkg.scripts['vercel-build']) {
    backendPkg.scripts['vercel-build'] = 'npx prisma generate && npx prisma migrate deploy && tsc';
    fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2));
    fixes.push('✓ Added vercel-build script to backend/package.json');
  } else {
    skipped.push('⊘ Backend vercel-build already exists');
  }
} catch (error) {
  console.error('✗ Error fixing backend package.json:', error.message);
}

// Fix 2: Create frontend/.env.example if missing
console.log('\n🔐 Checking environment files...');

const frontendEnvExample = 'frontend/.env.example';
if (!fs.existsSync(frontendEnvExample)) {
  const envContent = `# API Base URL
VITE_API_URL="http://localhost:3001"

# WebSocket URL
VITE_WS_URL="http://localhost:3001"

# Environment
VITE_NODE_ENV="development"
`;
  fs.writeFileSync(frontendEnvExample, envContent);
  fixes.push('✓ Created frontend/.env.example');
} else {
  skipped.push('⊘ Frontend .env.example already exists');
}

// Fix 3: Ensure .vercelignore exists
console.log('\n📝 Checking .vercelignore...');

const vercelIgnorePath = '.vercelignore';
if (!fs.existsSync(vercelIgnorePath)) {
  const ignoreContent = `# Dependencies
node_modules
frontend/node_modules
backend/node_modules

# Environment files
.env
.env.local
.env.*.local
backend/.env
frontend/.env

# Build outputs
backend/dist
frontend/dist

# Test files
**/__tests__
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx

# Development files
*.log
npm-debug.log*

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db
`;
  fs.writeFileSync(vercelIgnorePath, ignoreContent);
  fixes.push('✓ Created .vercelignore');
} else {
  skipped.push('⊘ .vercelignore already exists');
}

// Fix 4: Update TypeScript config for production
console.log('\n🔨 Checking TypeScript configuration...');

try {
  const frontendTsConfigPath = 'frontend/tsconfig.json';
  if (fs.existsSync(frontendTsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(frontendTsConfigPath, 'utf8'));
    
    let modified = false;
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    
    // Ensure skipLibCheck is true for faster builds
    if (tsConfig.compilerOptions.skipLibCheck !== true) {
      tsConfig.compilerOptions.skipLibCheck = true;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(frontendTsConfigPath, JSON.stringify(tsConfig, null, 2));
      fixes.push('✓ Updated frontend/tsconfig.json for production');
    } else {
      skipped.push('⊘ Frontend TypeScript config already optimized');
    }
  }
} catch (error) {
  console.error('✗ Error updating frontend tsconfig.json:', error.message);
}

try {
  const backendTsConfigPath = 'backend/tsconfig.json';
  if (fs.existsSync(backendTsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(backendTsConfigPath, 'utf8'));
    
    let modified = false;
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    
    // Ensure skipLibCheck is true for faster builds
    if (tsConfig.compilerOptions.skipLibCheck !== true) {
      tsConfig.compilerOptions.skipLibCheck = true;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(backendTsConfigPath, JSON.stringify(tsConfig, null, 2));
      fixes.push('✓ Updated backend/tsconfig.json for production');
    } else {
      skipped.push('⊘ Backend TypeScript config already optimized');
    }
  }
} catch (error) {
  console.error('✗ Error updating backend tsconfig.json:', error.message);
}

// Fix 5: Create frontend/vercel.json if missing
console.log('\n⚙️  Checking Vercel configuration...');

const frontendVercelPath = 'frontend/vercel.json';
if (!fs.existsSync(frontendVercelPath)) {
  const config = {
    buildCommand: 'npm run vercel-build',
    outputDirectory: 'dist',
    framework: 'vite',
    installCommand: 'npm install'
  };
  fs.writeFileSync(frontendVercelPath, JSON.stringify(config, null, 2));
  fixes.push('✓ Created frontend/vercel.json');
} else {
  skipped.push('⊘ Frontend vercel.json already exists');
}

const backendVercelPath = 'backend/vercel.json';
if (!fs.existsSync(backendVercelPath)) {
  const config = {
    version: 2,
    builds: [
      {
        src: 'src/index.ts',
        use: '@vercel/node',
        config: {
          includeFiles: ['prisma/**']
        }
      }
    ],
    routes: [
      {
        src: '/(.*)',
        dest: 'src/index.ts'
      }
    ]
  };
  fs.writeFileSync(backendVercelPath, JSON.stringify(config, null, 2));
  fixes.push('✓ Created backend/vercel.json');
} else {
  skipped.push('⊘ Backend vercel.json already exists');
}

// Print Results
console.log('\n' + '='.repeat(50));
console.log('\n📊 FIX RESULTS\n');

if (fixes.length > 0) {
  console.log('✅ APPLIED FIXES (' + fixes.length + ')');
  fixes.forEach(msg => console.log('  ' + msg));
}

if (skipped.length > 0) {
  console.log('\n⊘ SKIPPED (' + skipped.length + ')');
  skipped.forEach(msg => console.log('  ' + msg));
}

console.log('\n' + '='.repeat(50));

if (fixes.length > 0) {
  console.log('\n✅ Fixes applied successfully!');
  console.log('\nNext steps:');
  console.log('  1. Review changes: git diff');
  console.log('  2. Test locally: npm run build');
  console.log('  3. Commit changes: git add . && git commit -m "Fix deployment issues"');
  console.log('  4. Push to GitHub: git push origin main');
  console.log('  5. Deploy to Vercel');
} else {
  console.log('\n✅ No fixes needed - configuration looks good!');
  console.log('\nYou can proceed with deployment.');
}

console.log('\n📖 For more help, see:');
console.log('  DEPLOYMENT_TROUBLESHOOTING.md');
console.log('');
