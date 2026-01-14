/**
 * API Route - Configuration des notifications
 * GET/POST /api/admin/config/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer la configuration depuis la base de données
    const configs = await prisma.configSystem.findMany({
      where: {
        cle: {
          in: [
            'smtp_host',
            'smtp_port',
            'smtp_secure',
            'smtp_user',
            'sms_provider',
            'twilio_account_sid',
            'twilio_phone_number',
            'whatsapp_phone_number_id',
          ],
        },
      },
    });

    // Structurer la réponse
    const config: any = {
      smtp: {},
      sms: {},
      whatsapp: {},
    };

    configs.forEach((c) => {
      if (c.cle.startsWith('smtp_')) {
        config.smtp[c.cle.replace('smtp_', '')] = c.valeur;
      } else if (c.cle.startsWith('twilio_') || c.cle === 'sms_provider') {
        const key = c.cle.replace('twilio_', '').replace('sms_', '');
        config.sms[key === 'provider' ? 'provider' : `twilio${key.charAt(0).toUpperCase()}${key.slice(1)}`] = c.valeur;
      } else if (c.cle.startsWith('whatsapp_')) {
        config.whatsapp[c.cle.replace('whatsapp_', '')] = c.valeur;
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erreur GET config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { smtp, sms, whatsapp } = body;

    // Sauvegarder chaque configuration
    const updates: Array<{ cle: string; valeur: string }> = [];

    // SMTP
    if (smtp) {
      if (smtp.host) updates.push({ cle: 'smtp_host', valeur: smtp.host });
      if (smtp.port) updates.push({ cle: 'smtp_port', valeur: smtp.port });
      if (smtp.secure) updates.push({ cle: 'smtp_secure', valeur: smtp.secure });
      if (smtp.user) updates.push({ cle: 'smtp_user', valeur: smtp.user });
      if (smtp.pass) updates.push({ cle: 'smtp_pass', valeur: smtp.pass });
    }

    // SMS
    if (sms) {
      if (sms.provider) updates.push({ cle: 'sms_provider', valeur: sms.provider });
      if (sms.twilioAccountSid) updates.push({ cle: 'twilio_account_sid', valeur: sms.twilioAccountSid });
      if (sms.twilioAuthToken) updates.push({ cle: 'twilio_auth_token', valeur: sms.twilioAuthToken });
      if (sms.twilioPhoneNumber) updates.push({ cle: 'twilio_phone_number', valeur: sms.twilioPhoneNumber });
      if (sms.apiUrl) updates.push({ cle: 'sms_api_url', valeur: sms.apiUrl });
      if (sms.apiKey) updates.push({ cle: 'sms_api_key', valeur: sms.apiKey });
    }

    // WhatsApp
    if (whatsapp) {
      if (whatsapp.phoneNumberId) updates.push({ cle: 'whatsapp_phone_number_id', valeur: whatsapp.phoneNumberId });
      if (whatsapp.accessToken) updates.push({ cle: 'whatsapp_access_token', valeur: whatsapp.accessToken });
    }

    // Upsert dans la base de données
    for (const update of updates) {
      await prisma.configSystem.upsert({
        where: { cle: update.cle },
        create: update,
        update: { valeur: update.valeur },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur POST config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
