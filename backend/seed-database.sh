#!/bin/bash
# Database Seeding Script for Production
# Seeds the database with initial data

set -e  # Exit on error

echo "🌱 Flying411 Database Seeding Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL is not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  WARNING: This will populate the database with seed data${NC}"
echo -e "${YELLOW}   This should only be run once on initial deployment${NC}"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Seeding cancelled."
    exit 0
fi
echo ""

# Check if seed file exists
if [ -f "prisma/seed.js" ]; then
    SEED_FILE="prisma/seed.js"
elif [ -f "prisma/seed-production.js" ]; then
    SEED_FILE="prisma/seed-production.js"
elif [ -f "dist/prisma/seed.js" ]; then
    SEED_FILE="dist/prisma/seed.js"
else
    echo -e "${RED}❌ No seed file found${NC}"
    echo "Looking for: prisma/seed.js, prisma/seed-production.js, or dist/prisma/seed.js"
    exit 1
fi

echo -e "${BLUE}📄 Using seed file: $SEED_FILE${NC}"
echo ""

# Run seeding
echo "🌱 Seeding database..."
node $SEED_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================="
    echo -e "${GREEN}🎉 Database seeded successfully!${NC}"
    echo ""
    echo "Seeded data includes:"
    echo "  ✅ Sample users (admin, seller, buyer)"
    echo "  ✅ Sample aircraft listings"
    echo "  ✅ Sample parts/components"
    echo "  ✅ Sample categories"
    echo ""
    echo "Next steps:"
    echo "1. Run: bash test-api.sh (to verify API endpoints)"
    echo "2. Test login with admin credentials"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Seeding failed${NC}"
    echo "Check the error messages above"
    exit 1
fi
