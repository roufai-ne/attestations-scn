/**
 * API Route - Activer un template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { templateService } from '@/lib/services/template.service';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
        const template = await templateService.getById(id);
        if (!template) {
            return NextResponse.json(
                { error: 'Template non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier que le template a au moins quelques champs configurés
        const config = templateService.parseConfig(template);
        if (!config || config.fields.length === 0) {
            return NextResponse.json(
                { error: 'Le template doit avoir au moins un champ configuré' },
                { status: 400 }
            );
        }

        // Activer le template
        const activated = await templateService.activate(id);

        // Log
        await prisma.auditLog.create({
            data: {
                action: 'TEMPLATE_ACTIVATED',
                userId: session.user.id,
                details: JSON.stringify({ templateId: id, templateName: template.nom }),
            },
        });

        return NextResponse.json({
            ...activated,
            config: templateService.parseConfig(activated),
        });
    } catch (error) {
        console.error('Erreur activation template:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
