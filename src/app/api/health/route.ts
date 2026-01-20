import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API Health Check
 * Vérifie l'état de l'application et de ses dépendances
 */
export async function GET() {
    const health = {
        status: 'ok' as 'ok' | 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
            database: false,
        },
    };

    // Vérifier la connexion à la base de données
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = true;
    } catch (error) {
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
}
