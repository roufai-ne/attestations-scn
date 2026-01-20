#!/bin/bash
# ============================================
# Script de déploiement Docker - Attestations SCN
# ============================================

set -e

echo "🚀 Déploiement Attestations SCN"
echo "================================"

# Vérifier que Docker est installé
if ! [ -x "$(command -v docker)" ]; then
    echo '❌ Error: docker is not installed.' >&2
    exit 1
fi

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé!"
    echo "   Copiez .env.production.example vers .env et configurez les variables"
    exit 1
fi

# Charger les variables d'environnement
source .env

# Build de l'image Docker
echo ""
echo "📦 Build de l'image Docker..."
docker compose -f docker-compose.prod.yml build --no-cache

# Arrêter les anciens conteneurs
echo ""
echo "🛑 Arrêt des anciens conteneurs..."
docker compose -f docker-compose.prod.yml down

# Démarrer les nouvelles instances
echo ""
echo "🚀 Démarrage des conteneurs..."
docker compose -f docker-compose.prod.yml up -d

# Attendre que la base de données soit prête
echo ""
echo "⏳ Attente de la base de données..."
sleep 10

# Appliquer les migrations Prisma
echo ""
echo "📊 Application des migrations..."
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Nettoyage des images inutilisées
echo ""
echo "🧹 Nettoyage des images inutilisées..."
docker image prune -f

# Afficher le statut
echo ""
echo "✅ Déploiement terminé!"
echo ""
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📡 Application accessible sur: ${NEXTAUTH_URL:-http://localhost:3000}"
echo "📊 Health check: ${NEXTAUTH_URL:-http://localhost:3000}/api/health"
