import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getProjectRoot } from '@/lib/utils/path';

const projectRoot = getProjectRoot();
const ASSETS_CONFIG_FILE = path.join(projectRoot, 'public', 'uploads', 'assets-config.json');
const UPLOADS_DIR = path.join(projectRoot, 'public', 'uploads');

interface AssetsConfig {
    logoUrl?: string;
    heroImageUrl?: string;
    updatedAt?: string;
    // Configuration des numéros d'attestation
    numeroConfig?: {
        startNumber: number; // Numéro de départ (ex: 1)
        digitCount: number; // Nombre de chiffres (ex: 5 pour 00001)
        separator: string; // Séparateur (ex: '-', '/', etc.)
        dateFormat: 'MM-YYYY' | 'YYYY-MM' | 'MM/YYYY' | 'YYYY/MM'; // Format de la date
        resetYearly: boolean; // Réinitialiser le compteur chaque année
    };
}

async function ensureUploadsDir() {
    if (!existsSync(UPLOADS_DIR)) {
        await mkdir(UPLOADS_DIR, { recursive: true });
    }
}

async function getConfig(): Promise<AssetsConfig> {
    try {
        await ensureUploadsDir();
        if (existsSync(ASSETS_CONFIG_FILE)) {
            const content = await readFile(ASSETS_CONFIG_FILE, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error reading assets config:', error);
    }
    return {};
}

async function saveConfig(config: AssetsConfig): Promise<void> {
    await ensureUploadsDir();
    await writeFile(ASSETS_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// GET: Retrieve current assets configuration (public endpoint)
export async function GET() {
    try {
        // Pas de vérification d'authentification pour permettre l'accès public
        // Cette route est utilisée par Header, Sidebar, AuthLayout, et pages publiques
        const config = await getConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assets configuration' },
            { status: 500 }
        );
    }
}

// POST: Upload new assets (logo or hero image)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        await ensureUploadsDir();

        const formData = await request.formData();
        const type = formData.get('type') as string;
        const file = formData.get('file') as File;

        if (!file || !type) {
            return NextResponse.json(
                { error: 'File and type are required' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou SVG.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Fichier trop volumineux (max 5 Mo)' },
                { status: 400 }
            );
        }

        // Generate filename based on type
        const extension = file.name.split('.').pop() || 'png';
        const filename = type === 'logo' ? `logo.${extension}` : `hero-bg.${extension}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Update config
        const config = await getConfig();
        const fileUrl = `/uploads/${filename}`;

        if (type === 'logo') {
            config.logoUrl = fileUrl;
        } else if (type === 'hero') {
            config.heroImageUrl = fileUrl;
        }

        config.updatedAt = new Date().toISOString();
        await saveConfig(config);

        return NextResponse.json({
            success: true,
            url: fileUrl,
            message: `${type === 'logo' ? 'Logo' : 'Image hero'} mis à jour avec succès`,
        });

    } catch (error) {
        console.error('Error uploading asset:', error);
        return NextResponse.json(
            { error: 'Failed to upload asset' },
            { status: 500 }
        );
    }
}

// DELETE: Remove an asset
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type || !['logo', 'hero'].includes(type)) {
            return NextResponse.json(
                { error: 'Type invalide' },
                { status: 400 }
            );
        }

        const config = await getConfig();

        if (type === 'logo') {
            delete config.logoUrl;
        } else {
            delete config.heroImageUrl;
        }

        config.updatedAt = new Date().toISOString();
        await saveConfig(config);

        return NextResponse.json({
            success: true,
            message: `${type === 'logo' ? 'Logo' : 'Image hero'} supprimé`,
        });

    } catch (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json(
            { error: 'Failed to delete asset' },
            { status: 500 }
        );
    }
}

// PUT: Update numero configuration
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { numeroConfig } = body;

        if (!numeroConfig) {
            return NextResponse.json(
                { error: 'Configuration requise' },
                { status: 400 }
            );
        }

        // Validate numeroConfig
        if (numeroConfig.startNumber < 1) {
            return NextResponse.json(
                { error: 'Le numéro de départ doit être supérieur à 0' },
                { status: 400 }
            );
        }

        if (numeroConfig.digitCount < 1 || numeroConfig.digitCount > 10) {
            return NextResponse.json(
                { error: 'Le nombre de chiffres doit être entre 1 et 10' },
                { status: 400 }
            );
        }

        // Get current config
        const currentConfig = await getConfig();

        // Update config
        const updatedConfig = {
            ...currentConfig,
            numeroConfig,
            updatedAt: new Date().toISOString(),
        };

        await saveConfig(updatedConfig);

        return NextResponse.json({
            message: 'Configuration mise à jour avec succès',
            config: updatedConfig,
        });
    } catch (error) {
        console.error('Error updating numero config:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour' },
            { status: 500 }
        );
    }
}
