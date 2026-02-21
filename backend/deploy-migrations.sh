#!/bin/bash
# Database Migration Deployment Script for Coolify
# Run this in Coolify Terminal after first deployment

set -e  # Exit on error

echo "🚀 Flying411 Database Migration Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL is not set${NC}"
    echo "Please set DATABASE_URL environment variable"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo ""

# Step 2: Run database migrations
echo "🔄 Step 2: Running database migrations..."
npx prisma migrate deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations deployed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "This might be the first deployment. Trying to push schema..."
    npx prisma db push --accept-data-loss
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database schema pushed${NC}"
    else
        echo -e "${RED}❌ Failed to push schema${NC}"
        exit 1
    fi
fi
echo ""

# Step 3: Check database connection
echo "🔍 Step 3: Verifying database connection..."
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection verified${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi
echo ""

echo "======================================="
echo -e "${GREEN}🎉 Migration deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: bash seed-database.sh (to populate initial data)"
echo "2. Run: bash test-api.sh (to verify API endpoints)"
echo ""
