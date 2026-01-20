#!/bin/bash
# ============================================
# Script de backup - Attestations SCN
# ============================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Backup Attestations SCN"
echo "=========================="

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# 1. Backup de la base de données PostgreSQL
echo ""
echo "📊 Backup de la base de données..."
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres attestations_db > "$BACKUP_DIR/db_backup_$DATE.sql"
gzip "$BACKUP_DIR/db_backup_$DATE.sql"
echo "   ✅ Base de données sauvegardée: db_backup_$DATE.sql.gz"

# 2. Backup des fichiers uploadés
echo ""
echo "📁 Backup des fichiers..."
docker compose -f docker-compose.prod.yml exec -T app tar -czf - /app/uploads /app/public/attestations /app/public/arretes 2>/dev/null > "$BACKUP_DIR/files_backup_$DATE.tar.gz" || true
echo "   ✅ Fichiers sauvegardés: files_backup_$DATE.tar.gz"

# 3. Nettoyage des anciens backups (garder les 7 derniers jours)
echo ""
echo "🧹 Nettoyage des anciens backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
echo "   ✅ Anciens backups supprimés"

# Afficher la taille des backups
echo ""
echo "📦 Backups créés:"
ls -lh "$BACKUP_DIR"/*$DATE* 2>/dev/null || echo "   Aucun backup créé"

echo ""
echo "✅ Backup terminé!"
