#!/bin/bash
# ============================================================
# Flying411 Full Data Restore Script
# Created: 2026-02-10
#
# Restores all database data + uploaded image files from backup.
# Run from the project root: ./backups/restore.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
BACKUP_SQL="$SCRIPT_DIR/full-data-backup-2026-02-10.sql"
FULL_DUMP="$SCRIPT_DIR/full-schema-and-data-2026-02-10.sql"
UPLOADS_DIR="$SCRIPT_DIR/uploads"

DB_CONTAINER="flying411-db-prod"
BACKEND_CONTAINER="flying411-backend"
DB_USER="flying411"
DB_NAME="flying411"

echo ""
echo "========================================="
echo "  Flying411 Data Restore"
echo "  Backup date: 2026-02-10"
echo "========================================="
echo ""

# Check containers are running
if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
    echo "ERROR: Database container '$DB_CONTAINER' is not running."
    echo "Start it with: docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "$BACKEND_CONTAINER"; then
    echo "WARNING: Backend container '$BACKEND_CONTAINER' is not running."
    echo "Image uploads will be skipped."
fi

echo "Choose restore method:"
echo "  1) Data only (INSERT into existing tables - use after fresh migration)"
echo "  2) Full restore (DROP + recreate everything from full dump)"
echo "  3) Just copy images (no database changes)"
echo ""
read -p "Enter choice [1/2/3]: " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "[1/3] Clearing existing data..."
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
            TRUNCATE TABLE listing_images, price_history, reviews, audit_logs, listings, parts, users CASCADE;
        "

        echo "[2/3] Restoring data from SQL backup..."
        docker cp "$BACKUP_SQL" "$DB_CONTAINER":/tmp/restore.sql
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/restore.sql
        docker exec "$DB_CONTAINER" rm /tmp/restore.sql

        echo "[3/3] Copying upload files..."
        if docker ps --format '{{.Names}}' | grep -q "$BACKEND_CONTAINER"; then
            for f in "$UPLOADS_DIR"/*; do
                [ -f "$f" ] && docker cp "$f" "$BACKEND_CONTAINER":/app/uploads/
            done
            echo "  Copied $(ls "$UPLOADS_DIR" | wc -l) files to backend container."
        fi
        ;;
    2)
        echo ""
        echo "[1/3] Dropping and recreating database..."
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
        "
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

        echo "[2/3] Restoring full dump (schema + data)..."
        docker cp "$FULL_DUMP" "$DB_CONTAINER":/tmp/full-restore.sql
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/full-restore.sql
        docker exec "$DB_CONTAINER" rm /tmp/full-restore.sql

        echo "[3/3] Copying upload files..."
        if docker ps --format '{{.Names}}' | grep -q "$BACKEND_CONTAINER"; then
            for f in "$UPLOADS_DIR"/*; do
                [ -f "$f" ] && docker cp "$f" "$BACKEND_CONTAINER":/app/uploads/
            done
            echo "  Copied $(ls "$UPLOADS_DIR" | wc -l) files to backend container."
        fi
        ;;
    3)
        echo ""
        echo "Copying upload files only..."
        if docker ps --format '{{.Names}}' | grep -q "$BACKEND_CONTAINER"; then
            for f in "$UPLOADS_DIR"/*; do
                [ -f "$f" ] && docker cp "$f" "$BACKEND_CONTAINER":/app/uploads/
            done
            echo "  Copied $(ls "$UPLOADS_DIR" | wc -l) files to backend container."
        else
            echo "ERROR: Backend container not running."
            exit 1
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "  Restore complete!"
echo "========================================="
echo ""

# Verify
echo "Verifying data counts:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 'users' as table_name, count(*) FROM users
    UNION ALL SELECT 'listings', count(*) FROM listings
    UNION ALL SELECT 'listing_images', count(*) FROM listing_images
    UNION ALL SELECT 'parts', count(*) FROM parts
    UNION ALL SELECT 'price_history', count(*) FROM price_history
    ORDER BY table_name;
"

echo ""
echo "Login credentials:"
echo "  Admin:  admin@flying411.com / admin123"
echo "  Seller: kelly@barteltaviation.com / bartelt123"
echo "  Seller: sales@hangar-24.com / hangar123"
echo "  Seller: andres@r44sales.com / heli123"
echo "  Seller: juleigh@airspaceauctions.com / auction123"
echo "  Demo:   demo@flying411.com / demo123"
echo ""
