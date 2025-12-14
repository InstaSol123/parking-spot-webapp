#!/bin/bash

# Daily backup script for PostgreSQL database
# This script runs pg_dump once per day and stores backups in /backups directory
# Old backups are automatically deleted after 30 days

BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_USER="postgres"
DB_NAME="parking_spot"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to perform backup
perform_backup() {
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/parking_spot_$TIMESTAMP.sql.gz"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..."

  # Create compressed backup
  if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"

    # Delete old backups (older than RETENTION_DAYS)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up old backups..."
    DELETED_COUNT=0
    while IFS= read -r old_backup; do
      rm -f "$old_backup"
      ((DELETED_COUNT++))
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleted old backup: $(basename "$old_backup")"
    done < <(find "$BACKUP_DIR" -name "parking_spot_*.sql.gz" -mtime +$RETENTION_DAYS)

    if [ $DELETED_COUNT -eq 0 ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] No old backups to delete"
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleted $DELETED_COUNT old backups"
    fi

    # List available backups
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Available backups:"
    ls -lh "$BACKUP_DIR"/parking_spot_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}'

  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup failed!"
    exit 1
  fi
}

# Initial wait for database to be ready
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for database to be ready..."
for i in {1..30}; do
  if pg_isready -h "$DB_HOST" -U "$DB_USER" > /dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database is ready"
    break
  fi
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting... ($i/30)"
  sleep 1
done

# Perform initial backup
perform_backup

# Then backup every 24 hours
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next backup in 24 hours..."
  sleep 86400

  perform_backup
done
