/**
 * Script de test pour le système de mapping des colonnes Excel
 * 
 * Usage:
 * 1. Créer un fichier Excel test avec des colonnes non standard
 * 2. Modifier ARRETE_ID et FILE_PATH ci-dessous
 * 3. Exécuter: npx tsx scripts/test-excel-mapping.ts
 */

import { excelParserService } from '../src/lib/services/excel-parser.service';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'public', 'uploads', 'test-appeles.xlsx');

async function testMapping() {
    console.log('🧪 Test du système de mapping des colonnes Excel\n');

    try {
        // 1. Preview du fichier
        console.log('📋 Étape 1: Analyse du fichier...');
        const preview = await excelParserService.previewExcelFile(FILE_PATH);

        console.log('\n✅ En-têtes détectés:');
        preview.headers.forEach((header, index) => {
            console.log(`   Colonne ${index + 1}: "${header}"`);
        });

        console.log('\n🗺️ Mapping suggéré automatiquement:');
        console.log(JSON.stringify(preview.suggestedMapping, null, 2));

        console.log(`\n📊 Échantillon de données (${preview.sampleRows.length} premières lignes):`);
        preview.sampleRows.forEach((row, i) => {
            console.log(`   Ligne ${i + 1}:`, row);
        });

        console.log(`\n📈 Total: ${preview.totalRows} lignes de données\n`);

        // 2. Test avec auto-détection
        console.log('📋 Étape 2: Import avec auto-détection...');
        const resultAuto = await excelParserService.parseExcelFile(FILE_PATH);

        if (resultAuto.success) {
            console.log(`✅ Import réussi: ${resultAuto.appeles.length} appelés extraits`);
            console.log('\n   Premier appelé:');
            console.log(JSON.stringify(resultAuto.appeles[0], null, 2));
        } else {
            console.log('❌ Échec de l\'import avec auto-détection:');
            resultAuto.errors.forEach(err => console.log(`   - ${err}`));
        }

        // 3. Test avec mapping personnalisé
        console.log('\n📋 Étape 3: Import avec mapping personnalisé...');
        
        // Exemple: colonnes dans un ordre différent
        const customMapping = {
            numero: 1,
            nom: 2,
            prenoms: 3,
            dateNaissance: 4,
            lieuNaissance: 5,
            diplome: 6,
            lieuService: 7
        };

        console.log('   Mapping utilisé:', customMapping);
        const resultCustom = await excelParserService.parseExcelFile(FILE_PATH, customMapping);

        if (resultCustom.success) {
            console.log(`✅ Import réussi: ${resultCustom.appeles.length} appelés extraits`);
            
            if (resultCustom.warnings.length > 0) {
                console.log('\n⚠️ Avertissements:');
                resultCustom.warnings.forEach(warn => console.log(`   - ${warn}`));
            }
        } else {
            console.log('❌ Échec de l\'import avec mapping personnalisé:');
            resultCustom.errors.forEach(err => console.log(`   - ${err}`));
        }

        // 4. Test avec mapping par nom de colonne
        console.log('\n📋 Étape 4: Import avec mapping par nom de colonne...');
        
        const mappingByName = {
            numero: preview.headers[0],
            nom: preview.headers[1],
            prenoms: preview.headers[2],
            dateNaissance: preview.headers[3],
            lieuNaissance: preview.headers[4],
            diplome: preview.headers[5]
        };

        console.log('   Mapping utilisé:', mappingByName);
        const resultByName = await excelParserService.parseExcelFile(FILE_PATH, mappingByName);

        if (resultByName.success) {
            console.log(`✅ Import réussi: ${resultByName.appeles.length} appelés extraits`);
        } else {
            console.log('❌ Échec:');
            resultByName.errors.forEach(err => console.log(`   - ${err}`));
        }

        console.log('\n🎉 Tests terminés!\n');

    } catch (error) {
        console.error('\n❌ Erreur lors des tests:', error);
        process.exit(1);
    }
}

// Vérifier que le fichier existe
console.log(`Fichier de test: ${FILE_PATH}\n`);

testMapping().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
});
