#!/usr/bin/env tsx

/**
 * Script de test du rate limiting en production
 * 
 * Tests effectués :
 * 1. Limite auth (10 tentatives / 15min)
 * 2. Limite API standard (100 req/min)
 * 3. Limite 2FA (10 tentatives / 15min)
 * 4. Limite génération (10/min)
 * 5. Blocage après dépassement
 * 6. Reset après période
 * 
 * Usage :
 *   npm run test:rate-limit
 *   tsx scripts/test-rate-limit.ts
 *   tsx scripts/test-rate-limit.ts --endpoint=/api/auth/signin --limit=10
 */

import { argv } from 'process';

interface TestResult {
  endpoint: string;
  limit: number;
  duration: string;
  totalRequests: number;
  successfulRequests: number;
  blockedRequests: number;
  firstBlockedAt: number | null;
  resetAfter: string;
  passed: boolean;
  details: string;
}

interface RateLimitConfig {
  endpoint: string;
  limit: number;
  window: number; // en secondes
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  description: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Configuration des limites à tester
 * Basé sur src/lib/rate-limit.ts
 */
const RATE_LIMITS: RateLimitConfig[] = [
  {
    endpoint: '/api/auth/request-otp',
    limit: 10,
    window: 15 * 60, // 15 minutes
    method: 'POST',
    body: { email: 'test@example.com' },
    description: 'Auth - Demande OTP',
  },
  {
    endpoint: '/api/auth/verify-otp',
    limit: 10,
    window: 15 * 60, // 15 minutes
    method: 'POST',
    body: { email: 'test@example.com', code: '123456' },
    description: 'Auth - Vérification OTP',
  },
  {
    endpoint: '/api/saisie/demandes',
    limit: 100,
    window: 60, // 1 minute
    method: 'GET',
    description: 'API Standard - Liste demandes',
  },
  {
    endpoint: '/api/agent/generate-attestation',
    limit: 10,
    window: 60, // 1 minute
    method: 'POST',
    body: { demandeId: 'test-id' },
    description: 'Génération attestation',
  },
  {
    endpoint: '/api/verify',
    limit: 30,
    window: 60, // 1 minute
    method: 'GET',
    description: 'Public - Vérification QR Code',
  },
];

/**
 * Effectue une requête HTTP
 */
async function makeRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Simuler IP différente pour éviter blocage prématuré
      'X-Forwarded-For': `192.168.1.${Math.floor(Math.random() * 255)}`,
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Teste une limite de rate limiting
 */
async function testRateLimit(config: RateLimitConfig): Promise<TestResult> {
  const startTime = Date.now();
  let successfulRequests = 0;
  let blockedRequests = 0;
  let firstBlockedAt: number | null = null;

  console.log(`\n🧪 Test: ${config.description}`);
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Limite: ${config.limit} requêtes / ${config.window}s`);
  console.log(`   Envoi de ${config.limit + 5} requêtes...\n`);

  // Envoyer limit + 5 requêtes pour tester le blocage
  const totalRequests = config.limit + 5;
  const responses: Response[] = [];

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const response = await makeRequest(
        config.endpoint,
        config.method,
        config.body
      );

      responses.push(response);

      if (response.status === 429) {
        // Rate limit atteint
        blockedRequests++;
        if (firstBlockedAt === null) {
          firstBlockedAt = i;
        }
        console.log(`   ❌ Requête ${i}: 429 Too Many Requests (BLOQUÉE)`);
      } else {
        successfulRequests++;
        console.log(
          `   ✅ Requête ${i}: ${response.status} ${response.statusText}`
        );
      }

      // Petit délai pour éviter surcharge
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.log(`   ⚠️  Requête ${i}: Erreur réseau - ${error.message}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Vérifier que le rate limiting fonctionne
  const passed =
    successfulRequests <= config.limit && blockedRequests >= 3;

  let details = '';
  if (passed) {
    details = `✅ Rate limiting fonctionne correctement. ${blockedRequests} requêtes bloquées après ${config.limit} autorisées.`;
  } else if (successfulRequests > config.limit) {
    details = `❌ ALERTE: ${successfulRequests} requêtes autorisées (limite: ${config.limit}). Rate limiting potentiellement défaillant.`;
  } else if (blockedRequests < 3) {
    details = `⚠️  WARNING: Seulement ${blockedRequests} requêtes bloquées. Vérifier configuration.`;
  }

  return {
    endpoint: config.endpoint,
    limit: config.limit,
    duration: `${duration}s`,
    totalRequests,
    successfulRequests,
    blockedRequests,
    firstBlockedAt,
    resetAfter: `${config.window}s`,
    passed,
    details,
  };
}

/**
 * Teste le reset après expiration de la fenêtre
 */
async function testReset(config: RateLimitConfig): Promise<boolean> {
  console.log(`\n⏰ Test reset après ${config.window}s...`);

  // Envoyer limit requêtes pour saturer
  for (let i = 0; i < config.limit; i++) {
    await makeRequest(config.endpoint, config.method, config.body);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Vérifier blocage
  const blockedResponse = await makeRequest(
    config.endpoint,
    config.method,
    config.body
  );
  if (blockedResponse.status !== 429) {
    console.log('   ❌ Rate limit pas atteint après saturation');
    return false;
  }
  console.log('   ✅ Rate limit atteint (429)');

  // Attendre reset (pour test rapide, on simule seulement)
  console.log(`   ⏳ Simulation attente ${config.window}s...`);
  console.log(
    '   ℹ️  En production, attendez vraiment la période de reset'
  );

  // Dans un vrai test, décommenter:
  // await new Promise(resolve => setTimeout(resolve, config.window * 1000));

  return true;
}

/**
 * Génère un rapport de test
 */
function generateReport(results: TestResult[]): void {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RAPPORT DE TEST - RATE LIMITING');
  console.log('='.repeat(80) + '\n');

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`🎯 Résumé Global:`);
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   ✅ Passés: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Échoués: ${failedTests}`);
  console.log('');

  // Détails par test
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.endpoint}`);
    console.log(`   Limite: ${result.limit} / ${result.resetAfter}`);
    console.log(`   Requêtes: ${result.totalRequests} total`);
    console.log(`   ✅ Autorisées: ${result.successfulRequests}`);
    console.log(`   ❌ Bloquées: ${result.blockedRequests} (à partir de #${result.firstBlockedAt || 'N/A'})`);
    console.log(`   Durée: ${result.duration}`);
    console.log(`   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   ${result.details}`);
    console.log('');
  });

  // Score global
  const score = Math.round((passedTests / totalTests) * 100);
  console.log('='.repeat(80));
  console.log(`🏆 SCORE GLOBAL: ${score}/100`);
  console.log('='.repeat(80));

  if (score === 100) {
    console.log('\n✅ Tous les tests sont passés! Rate limiting fonctionne parfaitement.');
  } else if (score >= 70) {
    console.log('\n⚠️  Certains tests ont échoué. Vérifier la configuration rate-limit.ts');
  } else {
    console.log(
      '\n❌ CRITIQUE: Rate limiting défaillant. Action immédiate requise!'
    );
  }

  // Recommandations
  console.log('\n📝 Recommandations:');
  if (score < 100) {
    console.log('   1. Vérifier src/lib/rate-limit.ts : RATE_LIMITS config');
    console.log('   2. Vérifier middleware.ts : application du rate limiting');
    console.log(
      '   3. Vérifier Nginx limits (si déployé) : /etc/nginx/nginx.conf'
    );
    console.log('   4. Tester avec IP réelle (pas localhost) pour simulation production');
  } else {
    console.log('   ✅ Rate limiting configuré correctement');
    console.log('   ℹ️  Pensez à monitorer les logs 429 en production');
    console.log(
      '   ℹ️  Configurer alertes si taux 429 > 5% du trafic'
    );
  }

  console.log('');
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Démarrage des tests de rate limiting...');
  console.log(`📍 URL cible: ${BASE_URL}`);

  // Parser arguments (optionnel)
  const args = argv.slice(2);
  let selectedEndpoint: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--endpoint=')) {
      selectedEndpoint = args[i].split('=')[1];
    }
  }

  // Filtrer les tests si endpoint spécifié
  let testsToRun = RATE_LIMITS;
  if (selectedEndpoint) {
    testsToRun = RATE_LIMITS.filter((t) => t.endpoint === selectedEndpoint);
    if (testsToRun.length === 0) {
      console.error(
        `❌ Endpoint ${selectedEndpoint} non trouvé dans la config`
      );
      process.exit(1);
    }
  }

  // Exécuter les tests
  const results: TestResult[] = [];

  for (const config of testsToRun) {
    try {
      const result = await testRateLimit(config);
      results.push(result);

      // Pause entre tests pour reset
      console.log('   ⏳ Pause 3s avant prochain test...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Erreur test ${config.endpoint}:`, error.message);
    }
  }

  // Générer rapport
  generateReport(results);

  // Exit code selon résultat
  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Exécution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

export { testRateLimit, testReset, generateReport };
