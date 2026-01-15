/**
 * API Route - Test de connexion SMS
 * POST /api/notifications/test/sms
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { smsService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Tester la connexion
    const success = await smsService.testConnection();

    if (success) {
      return NextResponse.json({ success: true, message: 'Connexion SMS réussie' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Échec de la connexion SMS' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur test SMS:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
