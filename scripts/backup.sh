#!/bin/bash
# =============================================================================
# Script de backup de la base de données PostgreSQL
# Usage: ./backup.sh [nom_backup]
# =============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/attestations}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"

# Variables de connexion
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-attestations_db}"
DB_USER="${DB_USER:-postgres}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

log_info "Démarrage du backup de la base de données..."
log_info "Base: $DB_NAME @ $DB_HOST:$DB_PORT"

# Nom du fichier de backup
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

# Effectuer le backup
log_info "Création du backup: $BACKUP_FILE"

PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --format=custom \
    | gzip > "$BACKUP_FILE"

# Vérifier le résultat
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "✅ Backup créé avec succès: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_error "❌ Échec du backup"
    exit 1
fi

# Backup des fichiers d'upload (attestations PDFs, signatures)
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
if [ -d "$UPLOAD_DIR" ]; then
    UPLOAD_BACKUP="$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz"
    log_info "Backup des fichiers uploadés..."
    tar -czf "$UPLOAD_BACKUP" -C "$(dirname $UPLOAD_DIR)" "$(basename $UPLOAD_DIR)"
    log_info "✅ Fichiers uploadés sauvegardés: $UPLOAD_BACKUP"
fi

# Nettoyage des anciens backups
log_info "Nettoyage des backups de plus de ${RETENTION_DAYS} jours..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*_uploads.tar.gz" -mtime +$RETENTION_DAYS -delete

CLEANED=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log_info "Anciens backups supprimés: $CLEANED"

# Liste des backups actuels
log_info "Backups disponibles:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5

log_info "✅ Backup terminé avec succès"
