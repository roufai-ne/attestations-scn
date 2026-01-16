#!/bin/bash
# =============================================================================
# Script de restauration de la base de données PostgreSQL
# Usage: ./restore.sh <fichier_backup>
# =============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/attestations}"

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

# Vérifier les arguments
if [ -z "$1" ]; then
    log_error "Usage: $0 <fichier_backup.sql.gz>"
    log_info "Backups disponibles:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "Aucun backup trouvé dans $BACKUP_DIR"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    # Essayer dans le répertoire de backup
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        log_error "Fichier de backup introuvable: $BACKUP_FILE"
        exit 1
    fi
fi

log_info "Fichier de backup: $BACKUP_FILE"
log_info "Base cible: $DB_NAME @ $DB_HOST:$DB_PORT"

# Confirmation
echo ""
log_warn "⚠️  ATTENTION: Cette opération va SUPPRIMER toutes les données actuelles!"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    log_info "Restauration annulée."
    exit 0
fi

# Créer un backup avant la restauration
log_info "Création d'un backup de sécurité avant restauration..."
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    | gzip > "$SAFETY_BACKUP" 2>/dev/null || true

log_info "Backup de sécurité créé: $SAFETY_BACKUP"

# Fermer les connexions existantes
log_info "Fermeture des connexions existantes..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

# Drop et recréer la base
log_info "Suppression de la base existante..."
PGPASSWORD="${DB_PASSWORD}" dropdb \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    "$DB_NAME" \
    --if-exists

log_info "Création de la nouvelle base..."
PGPASSWORD="${DB_PASSWORD}" createdb \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    "$DB_NAME"

# Restaurer le backup
log_info "Restauration du backup..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD}" pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --verbose

# Vérifier
if [ $? -eq 0 ]; then
    log_info "✅ Restauration terminée avec succès!"
    
    # Afficher quelques stats
    log_info "Vérification des données..."
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT 'Utilisateurs' as table, count(*) as total FROM users UNION ALL SELECT 'Demandes', count(*) FROM demandes UNION ALL SELECT 'Attestations', count(*) FROM attestations;"
else
    log_error "❌ Erreur lors de la restauration"
    log_info "Un backup de sécurité est disponible: $SAFETY_BACKUP"
    exit 1
fi

# Restaurer les fichiers uploadés si disponibles
UPLOADS_BACKUP="${BACKUP_FILE%.sql.gz}_uploads.tar.gz"
if [ -f "$UPLOADS_BACKUP" ]; then
    UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
    log_info "Restauration des fichiers uploadés..."
    tar -xzf "$UPLOADS_BACKUP" -C "$(dirname $UPLOAD_DIR)"
    log_info "✅ Fichiers restaurés"
fi

log_info "✅ Restauration complète terminée!"
