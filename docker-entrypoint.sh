#!/bin/sh
# ============================================
# Docker Entrypoint - Attestations SCN
# Exécute les migrations Prisma avant le démarrage
# ============================================

set -e

echo "🚀 Démarrage Attestations SCN..."

# Vérifier si DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non défini"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => { client.end(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   PostgreSQL non prêt - nouvelle tentative dans 2s..."
  sleep 2
done

echo "✅ PostgreSQL prêt"

# Exécuter les migrations Prisma
if [ "$NODE_ENV" = "production" ]; then
    echo "📊 Application des migrations Prisma..."
    npx prisma migrate deploy
    echo "✅ Migrations appliquées"
else
    echo "⚠️ Mode développement - migrations non automatiques"
fi

# Générer le client Prisma (sécurité)
echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "✅ Initialisation terminée"
echo ""

# Exécuter la commande passée en argument
exec "$@"
