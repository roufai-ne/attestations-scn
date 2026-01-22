# Test Rate Limiting - Documentation

## Vue d'ensemble

Le script `test-rate-limit.ts` permet de valider que le rate limiting fonctionne correctement sur les endpoints critiques de l'application.

## Objectifs

✅ Vérifier les limites configurées dans `src/lib/rate-limit.ts`  
✅ Tester le blocage après dépassement (429 Too Many Requests)  
✅ Valider le reset après la fenêtre temporelle  
✅ Détecter les endpoints non protégés  
✅ Générer un rapport de sécurité  

## Configuration testée

Basé sur `src/lib/rate-limit.ts` :

| Endpoint | Limite | Fenêtre | Description |
|----------|--------|---------|-------------|
| `/api/auth/request-otp` | 10 req | 15 min | Demande OTP Email |
| `/api/auth/verify-otp` | 10 req | 15 min | Vérification OTP |
| `/api/saisie/demandes` | 100 req | 1 min | API Standard |
| `/api/agent/generate-attestation` | 10 req | 1 min | Génération PDF |
| `/api/verify` | 30 req | 1 min | Vérification publique |

## Usage

### Test tous les endpoints

```bash
npm run test:rate-limit
```

### Test endpoint spécifique

```bash
npm run test:rate-limit -- --endpoint=/api/auth/request-otp
```

### Avec tsx directement

```bash
tsx scripts/test-rate-limit.ts
tsx scripts/test-rate-limit.ts --endpoint=/api/auth/verify-otp
```

## Fonctionnement

### 1. Saturation de la limite

Pour chaque endpoint, le script :
- Envoie `limit + 5` requêtes successives
- Compte les requêtes autorisées (200, 201, 400, etc.)
- Compte les requêtes bloquées (429)
- Note le numéro de la première requête bloquée

### 2. Validation

Un test passe si :
- ✅ `successfulRequests <= limit`
- ✅ `blockedRequests >= 3` (au moins 3 requêtes bloquées)

Un test échoue si :
- ❌ Plus de `limit` requêtes autorisées
- ❌ Aucune requête bloquée

### 3. Rapport

Le script génère un rapport détaillé avec :
- Nombre de requêtes autorisées/bloquées par endpoint
- Première requête bloquée (#12 par exemple)
- Durée du test
- Score global (/100)
- Recommandations

## Exemple de sortie

```
🚀 Démarrage des tests de rate limiting...
📍 URL cible: http://localhost:3000

🧪 Test: Auth - Demande OTP
   Endpoint: /api/auth/request-otp
   Limite: 10 requêtes / 900s
   Envoi de 15 requêtes...

   ✅ Requête 1: 200 OK
   ✅ Requête 2: 200 OK
   ...
   ✅ Requête 10: 200 OK
   ❌ Requête 11: 429 Too Many Requests (BLOQUÉE)
   ❌ Requête 12: 429 Too Many Requests (BLOQUÉE)
   ❌ Requête 13: 429 Too Many Requests (BLOQUÉE)
   ❌ Requête 14: 429 Too Many Requests (BLOQUÉE)
   ❌ Requête 15: 429 Too Many Requests (BLOQUÉE)

   ⏳ Pause 3s avant prochain test...

================================================================================
📊 RAPPORT DE TEST - RATE LIMITING
================================================================================

🎯 Résumé Global:
   Total tests: 5
   ✅ Passés: 5 (100.0%)
   ❌ Échoués: 0

1. /api/auth/request-otp
   Limite: 10 / 900s
   Requêtes: 15 total
   ✅ Autorisées: 10
   ❌ Bloquées: 5 (à partir de #11)
   Durée: 2.34s
   Status: ✅ PASS
   ✅ Rate limiting fonctionne correctement. 5 requêtes bloquées après 10 autorisées.

2. /api/auth/verify-otp
   Limite: 10 / 900s
   Requêtes: 15 total
   ✅ Autorisées: 10
   ❌ Bloquées: 5 (à partir de #11)
   Durée: 2.18s
   Status: ✅ PASS
   ✅ Rate limiting fonctionne correctement. 5 requêtes bloquées après 10 autorisées.

...

================================================================================
🏆 SCORE GLOBAL: 100/100
================================================================================

✅ Tous les tests sont passés! Rate limiting fonctionne parfaitement.

📝 Recommandations:
   ✅ Rate limiting configuré correctement
   ℹ️  Pensez à monitorer les logs 429 en production
   ℹ️  Configurer alertes si taux 429 > 5% du trafic
```

## Cas d'échec

### Rate limiting défaillant

```
1. /api/auth/request-otp
   Limite: 10 / 900s
   Requêtes: 15 total
   ✅ Autorisées: 15  ⚠️ PROBLÈME
   ❌ Bloquées: 0
   Durée: 2.50s
   Status: ❌ FAIL
   ❌ ALERTE: 15 requêtes autorisées (limite: 10). Rate limiting potentiellement défaillant.

🏆 SCORE GLOBAL: 0/100

❌ CRITIQUE: Rate limiting défaillant. Action immédiate requise!

📝 Recommandations:
   1. Vérifier src/lib/rate-limit.ts : RATE_LIMITS config
   2. Vérifier middleware.ts : application du rate limiting
   3. Vérifier Nginx limits (si déployé) : /etc/nginx/nginx.conf
   4. Tester avec IP réelle (pas localhost) pour simulation production
```

## Intégration CI/CD

### GitHub Actions

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  rate-limit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: sleep 5
      - run: npm run test:rate-limit
```

### GitLab CI

```yaml
rate_limit_test:
  stage: security
  script:
    - npm ci
    - npm run build
    - npm run dev &
    - sleep 5
    - npm run test:rate-limit
  only:
    - main
    - develop
```

## Ajouter un nouveau test

Éditer `scripts/test-rate-limit.ts` :

```typescript
const RATE_LIMITS: RateLimitConfig[] = [
  // ... tests existants ...
  {
    endpoint: '/api/mon-nouveau-endpoint',
    limit: 50,
    window: 60, // 1 minute
    method: 'POST',
    body: { foo: 'bar' },
    description: 'Mon nouvel endpoint',
  },
];
```

## Limitations

### Localhost vs Production

Le test depuis `localhost` peut différer de la production :
- IP `127.0.0.1` unique pour tous les tests
- Nginx rate limiting additionnel en production
- Redis vs MemoryStore selon env

**Recommandation** : Tester aussi depuis une IP externe.

### Fenêtres temporelles

Le script ne teste pas le reset complet (attente 15 min trop longue).  
En production, vérifier manuellement :

```bash
# Saturer limite
for i in {1..11}; do curl http://localhost:3000/api/auth/request-otp; done

# Vérifier blocage
curl -i http://localhost:3000/api/auth/request-otp
# HTTP/1.1 429 Too Many Requests

# Attendre 15 min
sleep 900

# Vérifier reset
curl -i http://localhost:3000/api/auth/request-otp
# HTTP/1.1 200 OK
```

### Redis persistence

Si Redis utilisé (`REDIS_URL` configuré) :
- Les compteurs persistent entre restarts app
- Vider Redis avant test : `redis-cli FLUSHALL`

## Troubleshooting

### Erreur "Cannot connect to localhost:3000"

```bash
# Vérifier serveur lancé
npm run dev

# Ou configurer URL
export NEXT_PUBLIC_APP_URL=http://localhost:3001
npm run test:rate-limit
```

### Erreur "fetch is not defined"

Versions Node.js < 18 nécessitent `node-fetch` :

```bash
npm install node-fetch@2
```

Puis dans `test-rate-limit.ts` :
```typescript
import fetch from 'node-fetch';
```

### Tous les tests échouent

1. Vérifier `src/lib/rate-limit.ts` existe
2. Vérifier `middleware.ts` applique `rateLimit()`
3. Vérifier `.env` : pas de `DISABLE_RATE_LIMIT=true`
4. Vérifier logs serveur pour erreurs

### Faux négatifs

Si tests passent mais rate limiting ne fonctionne pas :
- Vérifier IP extraction (`x-forwarded-for`)
- Tester avec tool externe : Postman, curl, Apache Bench
- Vérifier store utilisé (Memory vs Redis)

## Monitoring production

### Logs Nginx

```nginx
# /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

server {
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        limit_req_status 429;
        # ...
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        # ...
    }
}
```

### Logs Application

Ajouter dans `src/lib/rate-limit.ts` :

```typescript
export function rateLimit(limitType: keyof typeof RATE_LIMITS = 'standard') {
  return async (req: NextRequest) => {
    const { isBlocked, remaining } = await checkRateLimit(identifier, limit);

    if (isBlocked) {
      // Log pour monitoring
      console.warn(`[RATE_LIMIT] ${req.method} ${req.url} - Blocked (IP: ${identifier})`);
      
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': resetTime.toString(),
          'X-RateLimit-Limit': limit.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  };
}
```

### Alertes

Configurer alertes si taux 429 > 5% :

```bash
# Prometheus query
rate(http_requests_total{status="429"}[5m]) / rate(http_requests_total[5m]) > 0.05
```

## Références

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)

## Support

Pour questions ou bugs :
- Consulter `src/lib/rate-limit.ts`
- Consulter logs serveur : `npm run dev`
- Tester manuellement avec `curl`
- Ouvrir issue GitHub

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026
