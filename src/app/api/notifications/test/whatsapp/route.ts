/**
 * API Route - Test de connexion WhatsApp
 * POST /api/notifications/test/whatsapp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { whatsappService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Tester la connexion
    const success = await whatsappService.testConnection();

    if (success) {
      return NextResponse.json({ success: true, message: 'Connexion WhatsApp réussie' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Échec de la connexion WhatsApp' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur test WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
