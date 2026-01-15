/**
 * API Route - Gestion des templates de notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'notification-templates.json');

// GET - Récupérer les templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier si le fichier existe
    if (!existsSync(TEMPLATES_FILE)) {
      return NextResponse.json({ templates: [] });
    }

    const data = await readFile(TEMPLATES_FILE, 'utf-8');
    const templates = JSON.parse(data);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    return NextResponse.json({ templates: [] });
  }
}

// POST - Sauvegarder les templates
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { templates } = await request.json();

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { error: 'Templates invalides' },
        { status: 400 }
      );
    }

    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Sauvegarder les templates
    await writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde templates:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
