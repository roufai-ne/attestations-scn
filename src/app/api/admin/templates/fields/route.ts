/**
 * API Route - Récupérer les champs disponibles pour les templates
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { templateService } from '@/lib/services/template.service';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const fields = templateService.getAvailableFields();

        return NextResponse.json(fields);
    } catch (error) {
        console.error('Erreur GET fields:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
