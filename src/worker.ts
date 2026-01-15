/**
 * Worker standalone pour l'extraction de texte des arrêtés PDF
 * À exécuter dans un terminal séparé : npm run worker
 */

import './lib/services/queue.service';

console.log('✅ Worker d\'extraction de texte démarré et en attente de jobs...');
console.log('📡 Connecté à Redis sur localhost:6379');
console.log('🔄 Appuyez sur Ctrl+C pour arrêter le worker\n');

// Garder le processus actif
process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du worker d\'extraction...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Arrêt du worker d\'extraction...');
    process.exit(0);
});
