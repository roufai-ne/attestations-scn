/**
 * API Route - Test de connexion Email (Brevo ou SMTP)
 * POST /api/notifications/test/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unifiedEmailService, brevoService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    // Test selon le provider
    if (provider === 'brevo') {
      // Test Brevo
      if (!brevoService.isConfigured()) {
        return NextResponse.json(
          { success: false, message: 'Brevo non configuré - Vérifiez BREVO_API_KEY' },
          { status: 400 }
        );
      }

      // Envoyer un email de test
      const success = await brevoService.sendEmail({
        to: session.user.email || 'test@example.com',
        subject: 'Test Brevo - Service Civique',
        html: '<h1>Test de connexion Brevo</h1><p>Si vous recevez cet email, la configuration Brevo fonctionne correctement.</p>',
        text: 'Test de connexion Brevo réussi',
      });

      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Email de test Brevo envoyé avec succès',
          provider: 'brevo'
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Échec envoi email Brevo', provider: 'brevo' },
          { status: 400 }
        );
      }
    } else {
      // Test SMTP classique
      const success = await unifiedEmailService.sendEmail({
        to: session.user.email || 'test@example.com',
        subject: 'Test SMTP - Service Civique',
        html: '<h1>Test de connexion SMTP</h1><p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>',
        text: 'Test de connexion SMTP réussi',
      });

      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Email de test SMTP envoyé avec succès',
          provider: 'smtp'
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Échec connexion SMTP', provider: 'smtp' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Erreur test email:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
