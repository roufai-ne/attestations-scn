# ============================================
# Script de déploiement Docker - Attestations SCN (Windows)
# ============================================

Write-Host "🚀 Déploiement de l'application Attestations SCN" -ForegroundColor Green
Write-Host ""

# Vérifier que le fichier .env existe
if (-not (Test-Path .env)) {
    Write-Host "❌ Erreur: Le fichier .env n'existe pas" -ForegroundColor Red
    Write-Host "   Copiez .env.production.example vers .env et configurez-le"
    exit 1
}

# Arrêter les conteneurs existants
Write-Host "📦 Arrêt des conteneurs existants..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml down

# Construire l'image
Write-Host "🔨 Construction de l'image Docker..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
Write-Host "🚀 Démarrage des services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier l'état des conteneurs
Write-Host ""
Write-Host "📊 État des conteneurs:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps

# Afficher les logs
Write-Host ""
Write-Host "📋 Derniers logs de l'application:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml logs --tail=50 app

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "   Application disponible sur: $env:NEXTAUTH_URL"
Write-Host ""
Write-Host "💡 Commandes utiles:" -ForegroundColor Yellow
Write-Host "   - Voir les logs:       docker-compose -f docker-compose.prod.yml logs -f"
Write-Host "   - Redémarrer l'app:    docker-compose -f docker-compose.prod.yml restart app"
Write-Host "   - Arrêter tout:        docker-compose -f docker-compose.prod.yml down"
Write-Host ""
