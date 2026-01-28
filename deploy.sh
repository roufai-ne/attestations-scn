#!/bin/bash
# ============================================
# Script de déploiement Docker - Attestations SCN
# ============================================

set -e

echo "🚀 Déploiement de l'application Attestations SCN"
echo ""

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Erreur: Le fichier .env n'existe pas"
    echo "   Copiez .env.production.example vers .env et configurez-le"
    exit 1
fi

# Arrêter les conteneurs existants
echo "📦 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Construire l'image
echo "🔨 Construction de l'image Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des conteneurs
echo ""
echo "📊 État des conteneurs:"
docker-compose -f docker-compose.prod.yml ps

# Afficher les logs
echo ""
echo "📋 Derniers logs de l'application:"
docker-compose -f docker-compose.prod.yml logs --tail=50 app

echo ""
echo "✅ Déploiement terminé!"
echo "   Application disponible sur: $NEXTAUTH_URL"
echo ""
echo "💡 Commandes utiles:"
echo "   - Voir les logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Redémarrer l'app:    docker-compose -f docker-compose.prod.yml restart app"
echo "   - Arrêter tout:        docker-compose -f docker-compose.prod.yml down"
echo ""
