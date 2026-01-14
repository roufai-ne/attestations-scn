/**
 * API Route - Test de connexion SMTP
 * POST /api/notifications/test/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { emailService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Tester la connexion
    const success = await emailService.testConnection();

    if (success) {
      return NextResponse.json({ success: true, message: 'Connexion SMTP réussie' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Échec de la connexion SMTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur test email:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
