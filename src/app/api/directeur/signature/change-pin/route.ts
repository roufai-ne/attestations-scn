/**
 * API Route - Changement de PIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { currentPin, newPin } = body;

        // Validation
        if (!currentPin || !newPin) {
            return NextResponse.json(
                { error: 'PIN actuel et nouveau PIN requis' },
                { status: 400 }
            );
        }

        if (!/^\d{4,6}$/.test(newPin)) {
            return NextResponse.json(
                { error: 'Le nouveau PIN doit contenir 4 à 6 chiffres' },
                { status: 400 }
            );
        }

        // Vérifier le PIN actuel
        const validation = await signatureService.validatePin(session.user.id, currentPin);

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.reason || 'PIN actuel incorrect' },
                { status: 400 }
            );
        }

        // Hasher le nouveau PIN
        const newPinHash = await signatureService.hashPin(newPin);

        // Mettre à jour le PIN
        await prisma.directeurSignature.update({
            where: { userId: session.user.id },
            data: {
                pinHash: newPinHash,
                pinAttempts: 0,
                pinBloqueJusqua: null,
            },
        });

        // Log dans l'audit
        await prisma.auditLog.create({
            data: {
                action: 'PIN_CHANGED',
                userId: session.user.id,
                details: JSON.stringify({ timestamp: new Date().toISOString() }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'PIN modifié avec succès',
        });
    } catch (error) {
        console.error('Erreur changement PIN:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
