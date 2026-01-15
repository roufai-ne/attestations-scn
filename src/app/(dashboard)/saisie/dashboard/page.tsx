'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    Loader2,
    TrendingUp,
} from 'lucide-react';

interface SaisieStats {
    totalDemandes: number;
    demandesEnAttente: number;
    demandesValidees: number;
    demandesRejetees: number;
    demandesAujourdHui: number;
    demandeCetteSemaine: number;
}

export default function SaisieDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<SaisieStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await fetch('/api/saisie/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bonjour, {session?.user?.prenom} !
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenue sur votre espace de saisie des demandes
                    </p>
                </div>
                <Link href="/saisie/demandes/nouvelle">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle demande
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Mes demandes
                        </CardTitle>
                        <FileText className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {stats?.totalDemandes || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Total créées
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            En attente
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {stats?.demandesEnAttente || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            En cours de traitement
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Validées
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {stats?.demandesValidees || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Demandes approuvées
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Rejetées
                        </CardTitle>
                        <XCircle className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {stats?.demandesRejetees || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Demandes refusées
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Votre activité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Aujourd'hui</p>
                                <p className="text-xs text-gray-500">Demandes créées</p>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                                {stats?.demandesAujourdHui || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Cette semaine</p>
                                <p className="text-xs text-gray-500">Demandes créées</p>
                            </div>
                            <span className="text-2xl font-bold text-green-600">
                                {stats?.demandeCetteSemaine || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Actions rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/saisie/demandes/nouvelle" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="h-4 w-4 mr-2" />
                                Créer une nouvelle demande
                            </Button>
                        </Link>
                        <Link href="/saisie/demandes" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="h-4 w-4 mr-2" />
                                Voir mes demandes
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Info box */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900">Rôle : Agent de Saisie</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Vous pouvez créer et modifier les demandes d'attestation.
                                La validation des pièces et la génération des attestations sont effectuées par les agents traitants.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
