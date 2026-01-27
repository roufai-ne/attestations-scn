/**
 * Script de copie des assets pour le mode standalone de Next.js
 * Copie les fichiers statiques et public dans le dossier standalone
 * Compatible Windows et Linux
 */

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

/**
 * Copie récursive d'un dossier
 */
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`⚠️  Source n'existe pas: ${src}`);
        return;
    }

    // Créer le dossier de destination
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('\n📦 Copie des assets pour le mode standalone...\n');

// Vérifier que le dossier standalone existe
if (!fs.existsSync(standaloneDir)) {
    console.error('❌ Le dossier .next/standalone n\'existe pas.');
    console.error('   Assurez-vous que output: "standalone" est configuré dans next.config.ts');
    process.exit(1);
}

// Copier .next/static
console.log('📁 Copie de .next/static...');
try {
    copyRecursive(staticSrc, staticDest);
    console.log('   ✅ .next/static copié');
} catch (error) {
    console.error('   ❌ Erreur lors de la copie de .next/static:', error.message);
}

// Copier public
console.log('📁 Copie de public...');
try {
    copyRecursive(publicSrc, publicDest);
    console.log('   ✅ public copié');
} catch (error) {
    console.error('   ❌ Erreur lors de la copie de public:', error.message);
}

console.log('\n✅ Assets copiés avec succès!');
console.log(`   Standalone prêt dans: ${standaloneDir}`);
console.log('\n💡 Pour démarrer: npm start\n');
