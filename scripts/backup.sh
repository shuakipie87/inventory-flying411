#!/bin/sh
# Flying411 Database Backup Script
# Performs a compressed pg_dump and removes backups older than 30 days.

set -e

DB_USER="${PGUSER:-flying411}"
DB_PASSWORD="${PGPASSWORD:-securepassword}"
DB_NAME="${PGDATABASE:-flying411}"
DB_HOST="${PGHOST:-postgres}"

BACKUP_DIR="/backup"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup of database '${DB_NAME}' on host '${DB_HOST}'..."

# Run pg_dump with gzip compression
export PGPASSWORD="${DB_PASSWORD}"
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ] && [ -s "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
  echo "[$(date)] ERROR: Backup failed or produced an empty file" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Remove backups older than retention period
echo "[$(date)] Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

REMAINING=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)
echo "[$(date)] Cleanup complete. ${REMAINING} backup(s) remaining."
