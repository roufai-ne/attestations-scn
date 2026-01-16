#!/bin/bash

# Script de déploiement pour Attestations SCN

echo "🚀 Démarrage du déploiement..."

# 1. Vérifier que Docker est installé
if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

# 2. Pull des dernières changements (si Git est utilisé)
# git pull origin main

# 3. Build et déploiement
echo "📦 Construction des images..."
docker-compose -f docker-compose.prod.yml build

echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

echo "🔥 Démarrage des nouveaux conteneurs..."
docker-compose -f docker-compose.prod.yml up -d

echo "🧹 Nettoyage des images inutilisées..."
docker image prune -f

echo "✅ Déploiement terminé !"
