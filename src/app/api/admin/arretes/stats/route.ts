import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { arreteService } from '@/lib/services/arrete.service';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const stats = await arreteService.getIndexationStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur stats arrêtés:', error);
    return NextResponse.json(
      { 
        total: 0,
        enAttente: 0,
        enCours: 0,
        indexes: 0,
        erreurs: 0,
      },
      { status: 200 }
    );
  }
}
