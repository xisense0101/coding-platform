#!/bin/bash
# Vercel Environment Variables Setup Script
# This script helps you copy environment variables to Vercel CLI

echo "==================================="
echo "Vercel Environment Variables Setup"
echo "==================================="
echo ""
echo "Copy and paste each command below into your terminal"
echo "Make sure to replace YOUR_VALUE with your actual values"
echo ""
echo "Run from project root directory"
echo ""

cat << 'EOF'
# Required Environment Variables for Vercel

# 1. Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Paste your Supabase Anon Key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase Service Role Key

# 2. Redis Configuration (Upstash)
vercel env add UPSTASH_REDIS_REST_URL
# Paste your Upstash Redis REST URL

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your Upstash Redis REST Token

# 3. Judge0 API Configuration
vercel env add JUDGE0_API_URL
# Paste: https://judge0-ce.p.rapidapi.com

vercel env add JUDGE0_API_KEY
# Paste your Judge0 API Key

# 4. App Configuration
vercel env add NODE_ENV
# Paste: production

# 5. Optional - App URLs (will be auto-set by Vercel)
vercel env add NEXT_PUBLIC_APP_URL
# Paste your production URL (e.g., https://yourapp.vercel.app)

vercel env add NEXT_PUBLIC_API_URL
# Paste your API URL (e.g., https://yourapp.vercel.app/api)

EOF

echo ""
echo "==================================="
echo "Alternative: Use Vercel Dashboard"
echo "==================================="
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add each variable manually"
echo "5. Select all environments: Production, Preview, Development"
echo ""
echo "Environment Variables Needed:"
echo "  ✓ NEXT_PUBLIC_SUPABASE_URL"
echo "  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  ✓ SUPABASE_SERVICE_ROLE_KEY"
echo "  ✓ UPSTASH_REDIS_REST_URL"
echo "  ✓ UPSTASH_REDIS_REST_TOKEN"
echo "  ✓ JUDGE0_API_URL"
echo "  ✓ JUDGE0_API_KEY"
echo "  ✓ NODE_ENV"
echo ""
echo "After adding all variables, redeploy your project!"
echo ""
