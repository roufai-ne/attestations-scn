/**
 * API Routes - Template individuel
 * GET: Récupère un template
 * PUT: Met à jour un template
 * DELETE: Supprime un template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { templateService } from '@/lib/services/template.service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const template = await templateService.getById(id);

        if (!template) {
            return NextResponse.json(
                { error: 'Template non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...template,
            config: templateService.parseConfig(template),
        });
    } catch (error) {
        console.error('Erreur GET template:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Vérifier que le template existe
        const existing = await templateService.getById(id);
        if (!existing) {
            return NextResponse.json(
                { error: 'Template non trouvé' },
                { status: 404 }
            );
        }

        // Si on met à jour la configuration
        if (body.config) {
            await templateService.updateConfig(id, body.config);
        }

        // Si on met à jour le nom
        if (body.nom) {
            await templateService.update(id, { nom: body.nom });
        }

        const updated = await templateService.getById(id);

        return NextResponse.json({
            ...updated,
            config: templateService.parseConfig(updated!),
        });
    } catch (error) {
        console.error('Erreur PUT template:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Vérifier que le template existe
        const existing = await templateService.getById(id);
        if (!existing) {
            return NextResponse.json(
                { error: 'Template non trouvé' },
                { status: 404 }
            );
        }

        // Empêcher la suppression du template actif
        if (existing.actif) {
            return NextResponse.json(
                { error: 'Impossible de supprimer le template actif' },
                { status: 400 }
            );
        }

        await templateService.delete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur DELETE template:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
