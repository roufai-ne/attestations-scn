/**
 * API Route - Servir les fichiers uploadés
 * GET /api/uploads/[...path]
 * Sert les fichiers depuis le dossier uploads en utilisant le bon chemin
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/path';
import { existsSync } from 'fs';

// Types MIME supportés
const MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: segments } = await params;
        
        // Construire le chemin du fichier
        const filePath = path.join(getProjectRoot(), 'public', 'uploads', ...segments);
        
        // Vérifier que le fichier existe
        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Fichier introuvable' },
                { status: 404 }
            );
        }
        
        // Lire le fichier
        const fileBuffer = await readFile(filePath);
        
        // Déterminer le type MIME
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Retourner le fichier avec le bon type MIME
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
        
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
