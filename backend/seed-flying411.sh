#!/bin/bash

##############################################################################
# Flying411.com Production Seed Script
# 
# This script seeds the Flying411.com database with aviation inventory data:
# - 3 Aircraft (Bonanza, Cessna 180, Seneca V)
# - 3 Engines (IO-320, CFM56-7B, CFM56-3C1)
# - 6 Certified Parts (windshields, lights, APU, etc.)
# - 19 Parts in master database with pricing history
#
# WARNING: This script DELETES all existing listings!
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Flying411.com Production Database Seed${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Check if running in Docker or local
if [ -f "/.dockerenv" ]; then
    ENVIRONMENT="docker"
    echo -e "${GREEN}✓${NC} Running inside Docker container"
else
    ENVIRONMENT="local"
    echo -e "${YELLOW}!${NC} Running on local machine"
fi

# Confirmation prompt
echo ""
echo -e "${RED}⚠️  WARNING: This will DELETE all existing listings!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Seed cancelled.${NC}"
    exit 0
fi

# Check if backup is needed
echo -e "${YELLOW}Recommendation: Backup your database before proceeding${NC}"
read -p "Do you want to create a backup first? (yes/no): " -r
echo ""

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    BACKUP_FILE="backup-flying411-$(date +%Y%m%d-%H%M%S).sql"
    echo -e "${BLUE}Creating backup...${NC}"
    
    if [ "$ENVIRONMENT" = "docker" ]; then
        # Inside Docker, connect to postgres service
        pg_dump -U flying411 -h postgres flying411_db > "/backup/$BACKUP_FILE" 2>/dev/null || \
        echo -e "${YELLOW}! Backup skipped (no backup directory mounted)${NC}"
    else
        # Local machine, use docker exec
        docker exec flying411-db-prod pg_dump -U flying411 flying411_db > "$BACKUP_FILE" 2>/dev/null || \
        echo -e "${YELLOW}! Backup failed (is database running?)${NC}"
    fi
    
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    fi
    echo ""
fi

# Run the seed script
echo -e "${BLUE}Starting seed process...${NC}"
echo ""

if [ "$ENVIRONMENT" = "docker" ]; then
    # Running inside Docker
    node /app/prisma/seed-flying411-production.js
else
    # Running on local machine
    if docker ps | grep -q flying411-backend-prod; then
        docker exec flying411-backend-prod node prisma/seed-flying411-production.js
    else
        echo -e "${RED}✗ Error: flying411-backend-prod container not running${NC}"
        echo ""
        echo "Please start the containers first:"
        echo "  docker-compose up -d"
        exit 1
    fi
fi

# Success message
echo ""
echo -e "${GREEN}✓ Seed completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify data: curl http://localhost:4001/api/listings"
echo "  2. View frontend: http://localhost:4000"
echo "  3. Login as admin: admin@flying411.com / admin123"
echo ""
