#!/bin/bash

# Environment Setup Script
# Configures development environment variables

set -e

echo "⚙️  Despachr Environment Setup"
echo "=============================="
echo ""

if [ -f .env.local ]; then
    echo "✓ .env.local already exists"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local"
        exit 0
    fi
fi

# Check if credentials are available
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Using default values from .env.local.example"
    cp .env.local.example .env.local
    echo ""
    echo "⚠️  Update .env.local with your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Environment
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
    echo "✓ .env.local created with environment variables"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. npm install (if not already done)"
echo "2. npm run dev (start development server)"
