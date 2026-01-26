#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TradeLink Marketplace Setup...\n');

const checks = [
  {
    name: 'Root package.json exists',
    check: () => fs.existsSync('package.json'),
  },
  {
    name: 'Frontend package.json exists',
    check: () => fs.existsSync('frontend/package.json'),
  },
  {
    name: 'Backend package.json exists',
    check: () => fs.existsSync('backend/package.json'),
  },
  {
    name: 'Frontend TypeScript config exists',
    check: () => fs.existsSync('frontend/tsconfig.json'),
  },
  {
    name: 'Backend TypeScript config exists',
    check: () => fs.existsSync('backend/tsconfig.json'),
  },
  {
    name: 'Prisma schema exists',
    check: () => fs.existsSync('backend/prisma/schema.prisma'),
  },
  {
    name: 'Database migration exists',
    check: () => fs.existsSync('backend/prisma/migrations/001_init/migration.sql'),
  },
  {
    name: 'Frontend source structure exists',
    check: () => fs.existsSync('frontend/src/App.tsx') && 
                 fs.existsSync('frontend/src/types/index.ts') &&
                 fs.existsSync('frontend/src/stores/authStore.ts'),
  },
  {
    name: 'Backend source structure exists',
    check: () => fs.existsSync('backend/src/index.ts') && 
                 fs.existsSync('backend/src/types/index.ts') &&
                 fs.existsSync('backend/src/config/database.ts'),
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('backend/.env.example'),
  },
  {
    name: 'README exists',
    check: () => fs.existsSync('README.md'),
  },
  {
    name: 'GitIgnore exists',
    check: () => fs.existsSync('.gitignore'),
  },
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`);
    failed++;
  }
});

console.log(`\n📊 Setup Verification Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 TradeLink Marketplace setup is complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Copy backend/.env.example to backend/.env and configure your environment variables');
  console.log('2. Set up PostgreSQL database with PostGIS extension');
  console.log('3. Run "cd backend && npm run db:migrate" to set up the database schema');
  console.log('4. Run "npm run dev" from the root directory to start both servers');
  console.log('\n🚀 Happy coding!');
} else {
  console.log('\n⚠️  Some setup checks failed. Please review the errors above.');
  process.exit(1);
}