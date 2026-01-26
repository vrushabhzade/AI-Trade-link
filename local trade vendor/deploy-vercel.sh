#!/bin/bash

# TradeLink Vercel Deployment Script
# This script helps you deploy the TradeLink marketplace to Vercel

echo "🚀 TradeLink Vercel Deployment Helper"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Login to Vercel
echo "🔐 Logging in to Vercel..."
vercel login

echo ""
echo "📋 Before deploying, make sure you have:"
echo "  1. Created a PostgreSQL database"
echo "  2. Prepared your environment variables"
echo "  3. Pushed your code to GitHub"
echo ""

read -p "Are you ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Add environment variables in Vercel dashboard"
echo "  2. Run database migrations"
echo "  3. Test your deployment"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions"
