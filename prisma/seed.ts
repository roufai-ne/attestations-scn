import { PrismaClient, Role, StatutDemande, TypePiece, StatutIndexation } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Début du seeding...')

    // Nettoyer la base de données
    console.log('🧹 Nettoyage de la base de données...')
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.attestation.deleteMany()
    await prisma.pieceDossier.deleteMany()
    await prisma.appele.deleteMany()
    await prisma.demande.deleteMany()
    await prisma.arrete.deleteMany()
    await prisma.templateAttestation.deleteMany()
    await prisma.directeurSignature.deleteMany()
    await prisma.configSystem.deleteMany()
    await prisma.user.deleteMany()

    // 1. Créer les utilisateurs
    console.log('👥 Création des utilisateurs...')

    const admin = await prisma.user.create({
        data: {
            email: 'admin@servicecivique.ne',
            password: await hashPassword('Admin123!'),
            nom: 'ADMIN',
            prenom: 'Système',
            role: Role.ADMIN,
            actif: true,
        },
    })

    const agent1 = await prisma.user.create({
        data: {
            email: 'agent@servicecivique.ne',
            password: await hashPassword('Agent123!'),
            nom: 'MOUSSA',
            prenom: 'Aïcha',
            role: Role.AGENT,
            actif: true,
        },
    })

    const agent2 = await prisma.user.create({
        data: {
            email: 'agent2@servicecivique.ne',
            password: await hashPassword('Agent123!'),
            nom: 'IBRAHIM',
            prenom: 'Fatima',
            role: Role.AGENT,
            actif: true,
        },
    })

    const directeur = await prisma.user.create({
        data: {
            email: 'directeur@servicecivique.ne',
            password: await hashPassword('Directeur123!'),
            nom: 'ABDOU',
            prenom: 'Dr. Moussa',
            role: Role.DIRECTEUR,
            actif: true,
        },
    })

    console.log(`✅ ${4} utilisateurs créés`)

    // 2. Créer des arrêtés de test
    console.log('📄 Création des arrêtés...')

    const arrete1 = await prisma.arrete.create({
        data: {
            numero: '2023/045/MJS/SCN',
            dateArrete: new Date('2023-03-15'),
            promotion: '2023',
            annee: '2023',
            fichierPath: '/uploads/arretes/arrete-2023-045.pdf',
            contenuOCR: 'RÉPUBLIQUE DU NIGER\nMINISTÈRE DE LA JEUNESSE ET DES SPORTS\nARRÊTÉ N° 2023/045/MJS/SCN\nPortant admission au Service Civique National - Promotion 2023\n\nListe des appelés:\n1. ABDOU Ibrahim - Licence en Informatique\n2. MAHAMADOU Fatima - Master en Gestion\n3. SOULEY Amadou - Licence en Droit',
            statutIndexation: StatutIndexation.INDEXE,
            dateIndexation: new Date(),
        },
    })

    const arrete2 = await prisma.arrete.create({
        data: {
            numero: '2024/012/MJS/SCN',
            dateArrete: new Date('2024-01-10'),
            promotion: '2024',
            annee: '2024',
            fichierPath: '/uploads/arretes/arrete-2024-012.pdf',
            contenuOCR: 'RÉPUBLIQUE DU NIGER\nMINISTÈRE DE LA JEUNESSE ET DES SPORTS\nARRÊTÉ N° 2024/012/MJS/SCN\nPortant admission au Service Civique National - Promotion 2024\n\nListe des appelés:\n1. HASSAN Aïssata - Licence en Économie\n2. OUMAROU Salissou - Master en Agronomie',
            statutIndexation: StatutIndexation.INDEXE,
            dateIndexation: new Date(),
        },
    })

    console.log(`✅ ${2} arrêtés créés`)

    // 3. Créer des demandes de test
    console.log('📋 Création des demandes...')

    const demande1 = await prisma.demande.create({
        data: {
            numeroEnregistrement: 'SCN-2024-001',
            dateEnregistrement: new Date('2024-01-15'),
            statut: StatutDemande.EN_TRAITEMENT,
            agentId: agent1.id,
            observations: 'Dossier complet, en cours de vérification',
            appele: {
                create: {
                    nom: 'ABDOU',
                    prenom: 'Ibrahim',
                    dateNaissance: new Date('1995-03-15'),
                    lieuNaissance: 'Niamey',
                    email: 'ibrahim.abdou@example.com',
                    telephone: '+22790123456',
                    whatsapp: '+22790123456',
                    diplome: 'Licence en Informatique',
                    promotion: '2023',
                    numeroArrete: '2023/045/MJS/SCN',
                    structure: 'Ministère de l\'Éducation Nationale',
                    dateDebutService: new Date('2023-04-01'),
                    dateFinService: new Date('2024-03-31'),
                },
            },
            pieces: {
                createMany: {
                    data: [
                        {
                            type: TypePiece.DEMANDE_MANUSCRITE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_ASSIDUITE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_CESSATION,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_PRISE_SERVICE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.COPIE_ARRETE,
                            present: false,
                            conforme: null,
                        },
                    ],
                },
            },
        },
    })

    const demande2 = await prisma.demande.create({
        data: {
            numeroEnregistrement: 'SCN-2024-002',
            dateEnregistrement: new Date('2024-01-16'),
            statut: StatutDemande.VALIDEE,
            agentId: agent1.id,
            observations: 'Dossier validé, prêt pour génération',
            dateValidation: new Date('2024-01-17'),
            appele: {
                create: {
                    nom: 'MAHAMADOU',
                    prenom: 'Fatima',
                    dateNaissance: new Date('1996-07-20'),
                    lieuNaissance: 'Maradi',
                    email: 'fatima.mahamadou@example.com',
                    telephone: '+22791234567',
                    whatsapp: '+22791234567',
                    diplome: 'Master en Gestion',
                    promotion: '2023',
                    numeroArrete: '2023/045/MJS/SCN',
                    structure: 'Ministère de la Santé Publique',
                    dateDebutService: new Date('2023-04-01'),
                    dateFinService: new Date('2024-03-31'),
                },
            },
            pieces: {
                createMany: {
                    data: [
                        {
                            type: TypePiece.DEMANDE_MANUSCRITE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_ASSIDUITE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_CESSATION,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.CERTIFICAT_PRISE_SERVICE,
                            present: true,
                            conforme: true,
                        },
                        {
                            type: TypePiece.COPIE_ARRETE,
                            present: true,
                            conforme: true,
                        },
                    ],
                },
            },
        },
    })

    const demande3 = await prisma.demande.create({
        data: {
            numeroEnregistrement: 'SCN-2024-003',
            dateEnregistrement: new Date('2024-01-18'),
            statut: StatutDemande.ENREGISTREE,
            agentId: agent2.id,
            appele: {
                create: {
                    nom: 'HASSAN',
                    prenom: 'Aïssata',
                    dateNaissance: new Date('1997-11-05'),
                    lieuNaissance: 'Zinder',
                    email: 'aissata.hassan@example.com',
                    telephone: '+22792345678',
                    diplome: 'Licence en Économie',
                    promotion: '2024',
                    numeroArrete: '2024/012/MJS/SCN',
                    structure: 'Ministère du Commerce',
                    dateDebutService: new Date('2024-02-01'),
                    dateFinService: new Date('2025-01-31'),
                },
            },
            pieces: {
                createMany: {
                    data: [
                        {
                            type: TypePiece.DEMANDE_MANUSCRITE,
                            present: true,
                            conforme: null,
                        },
                        {
                            type: TypePiece.CERTIFICAT_ASSIDUITE,
                            present: false,
                            conforme: null,
                        },
                        {
                            type: TypePiece.CERTIFICAT_CESSATION,
                            present: false,
                            conforme: null,
                        },
                        {
                            type: TypePiece.CERTIFICAT_PRISE_SERVICE,
                            present: true,
                            conforme: null,
                        },
                        {
                            type: TypePiece.COPIE_ARRETE,
                            present: false,
                            conforme: null,
                        },
                    ],
                },
            },
        },
    })

    console.log(`✅ ${3} demandes créées`)

    // 4. Créer des configurations système
    console.log('⚙️ Création des configurations système...')

    await prisma.configSystem.createMany({
        data: [
            {
                cle: 'nom_organisme',
                valeur: 'Service Civique National du Niger',
            },
            {
                cle: 'adresse_organisme',
                valeur: 'BP 123, Niamey, Niger',
            },
            {
                cle: 'email_contact',
                valeur: 'contact@servicecivique.ne',
            },
            {
                cle: 'telephone_contact',
                valeur: '+227 20 XX XX XX',
            },
        ],
    })

    console.log('✅ Configurations système créées')

    console.log('\n🎉 Seeding terminé avec succès!')
    console.log('\n📊 Résumé:')
    console.log(`   - ${4} utilisateurs`)
    console.log(`   - ${2} arrêtés`)
    console.log(`   - ${3} demandes`)
    console.log('\n🔐 Comptes de test:')
    console.log('   Admin:     admin@servicecivique.ne / Admin123!')
    console.log('   Agent:     agent@servicecivique.ne / Agent123!')
    console.log('   Directeur: directeur@servicecivique.ne / Directeur123!')
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
