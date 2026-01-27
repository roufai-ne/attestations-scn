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

# Extraire host et port de DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo "⏳ Attente de PostgreSQL ($DB_HOST:$DB_PORT)..."

# Attendre que PostgreSQL soit prêt (max 60 secondes)
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "✅ PostgreSQL accessible"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   PostgreSQL non prêt - tentative $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL non accessible après $MAX_RETRIES tentatives"
    exit 1
fi

# Attendre encore 2 secondes pour que PostgreSQL soit vraiment prêt
sleep 2
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
