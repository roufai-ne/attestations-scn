/**
 * Script de validation des variables d'environnement
 * Vérifie que toutes les variables nécessaires sont définies et valides
 */

interface EnvCheck {
  name: string;
  required: boolean;
  validator?: (value: string) => { valid: boolean; message?: string };
  description: string;
}

const ENV_CHECKS: EnvCheck[] = [
  // Base de données
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => {
      if (!value.startsWith('postgresql://')) {
        return { valid: false, message: 'Doit commencer par postgresql://' };
      }
      return { valid: true };
    },
    description: 'URL de connexion PostgreSQL',
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validator: (value) => {
      if (value === 'default-secret-key-change-me' || value.length < 32) {
        return { valid: false, message: 'Clé trop faible (min 32 caractères)' };
      }
      return { valid: true };
    },
    description: 'Clé secrète NextAuth (JWT)',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validator: (value) => {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return { valid: false, message: 'Doit commencer par http:// ou https://' };
      }
      return { valid: true };
    },
    description: 'URL publique de l\'application',
  },

  // QR Code
  {
    name: 'QR_SECRET_KEY',
    required: true,
    validator: (value) => {
      if (value === 'default-secret-key' || value.length < 32) {
        return { valid: false, message: 'Clé trop faible (min 32 caractères)' };
      }
      return { valid: true };
    },
    description: 'Clé secrète HMAC pour QR Codes',
  },

  // Redis
  {
    name: 'REDIS_URL',
    required: false,
    validator: (value) => {
      if (!value.startsWith('redis://')) {
        return { valid: false, message: 'Doit commencer par redis://' };
      }
      return { valid: true };
    },
    description: 'URL Redis pour OTP store (production)',
  },

  // Email (SMTP)
  {
    name: 'SMTP_HOST',
    required: true,
    description: 'Serveur SMTP',
  },
  {
    name: 'SMTP_PORT',
    required: true,
    validator: (value) => {
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return { valid: false, message: 'Port invalide (1-65535)' };
      }
      return { valid: true };
    },
    description: 'Port SMTP (587, 465, 25)',
  },
  {
    name: 'SMTP_USER',
    required: true,
    description: 'Utilisateur SMTP',
  },
  {
    name: 'SMTP_PASS',
    required: true,
    description: 'Mot de passe SMTP',
  },
  {
    name: 'SMTP_FROM',
    required: true,
    validator: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Email invalide' };
      }
      return { valid: true };
    },
    description: 'Email expéditeur',
  },

  // SMS (Twilio)
  {
    name: 'TWILIO_ACCOUNT_SID',
    required: false,
    description: 'Twilio Account SID (SMS)',
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    required: false,
    description: 'Twilio Auth Token (SMS)',
  },
  {
    name: 'TWILIO_PHONE_NUMBER',
    required: false,
    validator: (value) => {
      if (value && !value.startsWith('+')) {
        return { valid: false, message: 'Doit commencer par + (format international)' };
      }
      return { valid: true };
    },
    description: 'Numéro Twilio (format: +227XXXXXXXX)',
  },

  // WhatsApp
  {
    name: 'WHATSAPP_PHONE_NUMBER_ID',
    required: false,
    description: 'WhatsApp Business Phone Number ID',
  },
  {
    name: 'WHATSAPP_ACCESS_TOKEN',
    required: false,
    description: 'WhatsApp Business API Access Token',
  },

  // Uploads
  {
    name: 'UPLOAD_DIR',
    required: false,
    description: 'Dossier uploads (défaut: ./uploads)',
  },

  // Environnement
  {
    name: 'NODE_ENV',
    required: false,
    validator: (value) => {
      const valid = ['development', 'production', 'test'].includes(value);
      if (!valid) {
        return { valid: false, message: 'Doit être: development, production ou test' };
      }
      return { valid: true };
    },
    description: 'Environnement Node.js',
  },
];

interface CheckResult {
  name: string;
  status: 'OK' | 'WARNING' | 'ERROR' | 'MISSING';
  message: string;
}

function checkEnvVariable(check: EnvCheck): CheckResult {
  const value = process.env[check.name];

  // Variable manquante
  if (!value) {
    if (check.required) {
      return {
        name: check.name,
        status: 'ERROR',
        message: `Manquante (requise): ${check.description}`,
      };
    }
    return {
      name: check.name,
      status: 'WARNING',
      message: `Manquante (optionnelle): ${check.description}`,
    };
  }

  // Variable présente, valider
  if (check.validator) {
    const result = check.validator(value);
    if (!result.valid) {
      return {
        name: check.name,
        status: check.required ? 'ERROR' : 'WARNING',
        message: result.message || 'Validation échouée',
      };
    }
  }

  return {
    name: check.name,
    status: 'OK',
    message: check.description,
  };
}

function main() {
  console.log('🔍 VALIDATION DES VARIABLES D\'ENVIRONNEMENT');
  console.log('Date:', new Date().toISOString());
  console.log('Environnement:', process.env.NODE_ENV || 'non défini');
  console.log('');

  const results: CheckResult[] = [];

  for (const check of ENV_CHECKS) {
    const result = checkEnvVariable(check);
    results.push(result);

    const symbol =
      result.status === 'OK'
        ? '✅'
        : result.status === 'WARNING'
        ? '⚠️'
        : result.status === 'ERROR'
        ? '❌'
        : '⚪';

    console.log(`${symbol} ${result.name}`);
    console.log(`   ${result.message}`);
    console.log('');
  }

  // Rapport
  console.log('='.repeat(60));
  console.log('📊 RÉSUMÉ\n');

  const ok = results.filter((r) => r.status === 'OK').length;
  const warnings = results.filter((r) => r.status === 'WARNING').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;
  const total = results.length;

  console.log(`Total variables: ${total}`);
  console.log(`✅ OK: ${ok}`);
  console.log(`⚠️  Avertissements: ${warnings}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log('');

  if (errors === 0 && warnings === 0) {
    console.log('✅ CONFIGURATION VALIDE - Prêt pour production\n');
    process.exit(0);
  } else if (errors === 0) {
    console.log('⚠️  CONFIGURATION ACCEPTABLE - Quelques variables optionnelles manquantes\n');
    console.log('Variables manquantes (optionnelles):');
    results
      .filter((r) => r.status === 'WARNING')
      .forEach((r) => console.log(`  - ${r.name}`));
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ CONFIGURATION INVALIDE - Corrections nécessaires\n');
    console.log('Variables manquantes ou invalides (requises):');
    results
      .filter((r) => r.status === 'ERROR')
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
    console.log('');

    console.log('📋 ACTIONS REQUISES:\n');
    console.log('1. Copier .env.example vers .env');
    console.log('2. Générer les secrets:');
    console.log('   NEXTAUTH_SECRET: openssl rand -hex 32');
    console.log('   QR_SECRET_KEY: openssl rand -hex 32');
    console.log('3. Configurer les services (SMTP, SMS, WhatsApp)');
    console.log('4. Relancer la validation: npm run check-env\n');

    process.exit(1);
  }
}

main();
