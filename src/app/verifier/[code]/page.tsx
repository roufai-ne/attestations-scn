import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, FileText, Calendar, User, GraduationCap, Award } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

async function getAttestationInfo(code: string, sig?: string, ts?: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        let url = `${baseUrl}/api/verifier/${code}`;
        if (sig && ts) {
            url += `?sig=${sig}&ts=${ts}`;
        }
        const response = await fetch(url, {
            cache: 'no-store',
        });

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return { valid: false, reason: 'Erreur de connexion' };
    }
}

export default async function VerifierCodePage({
    params,
    searchParams,
}: {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ sig?: string; ts?: string }>;
}) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const { sig, ts } = resolvedSearchParams;

    // Appeler l'API avec ou sans signature (vérification QR code ou vérification simple)
    const result = await getAttestationInfo(resolvedParams.code, sig, ts);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-100 py-12 px-4">
            <div className="container mx-auto max-w-3xl">
                {/* En-tête */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${result.valid ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                        {result.valid ? (
                            <CheckCircle className="h-8 w-8 text-white" />
                        ) : (
                            <XCircle className="h-8 w-8 text-white" />
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {result.valid ? 'Attestation Valide' : 'Attestation Invalide'}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Service Civique National du Niger
                    </p>
                </div>

                {/* Résultat de la vérification */}
                {result.valid && result.attestation ? (
                    <Card className="shadow-xl border-green-200">
                        <CardHeader className="bg-green-50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-green-800">
                                    Informations de l'attestation
                                </CardTitle>
                                <Badge className="bg-green-600">Authentique</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {/* Numéro */}
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Numéro d'attestation</p>
                                        <p className="font-semibold text-lg">{result.attestation.numero}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-4 text-gray-700">Titulaire</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nom et Prénom */}
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Nom et Prénom</p>
                                                <p className="font-medium">{result.attestation.nom} {result.attestation.prenom}</p>
                                            </div>
                                        </div>

                                        {/* Date de naissance */}
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Date de naissance</p>
                                                <p className="font-medium">
                                                    {format(new Date(result.attestation.dateNaissance), 'dd MMMM yyyy', { locale: fr })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Diplôme */}
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Diplôme</p>
                                                <p className="font-medium">{result.attestation.diplome}</p>
                                            </div>
                                        </div>

                                        {/* Promotion */}
                                        <div className="flex items-start gap-3">
                                            <Award className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Promotion</p>
                                                <p className="font-medium">{result.attestation.promotion}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Date de délivrance</p>
                                            <p className="font-medium">
                                                {format(new Date(result.attestation.dateGeneration), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Statut */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500">Statut :</p>
                                        <Badge variant={result.attestation.statut === 'SIGNEE' ? 'default' : 'secondary'}>
                                            {result.attestation.statut === 'SIGNEE' ? 'Signée' : result.attestation.statut}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Alert className="mt-6 bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Cette attestation est authentique et a été délivrée par le Service Civique National du Niger.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-xl border-red-200">
                        <CardHeader className="bg-red-50">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-6 w-6 text-red-600" />
                                <CardTitle className="text-red-600">Attestation non valide</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {result.reason || 'Cette attestation n\'a pas pu être vérifiée. Elle pourrait être falsifiée ou les informations de vérification sont incorrectes.'}
                                </AlertDescription>
                            </Alert>

                            <div className="mt-6 space-y-2 text-sm text-gray-600">
                                <p className="font-medium">Que faire ?</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Vérifiez que vous avez scanné le bon QR Code</li>
                                    <li>Assurez-vous que le numéro d'attestation est correct</li>
                                    <li>Contactez le Service Civique National en cas de doute</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Retour */}
                <div className="mt-8 text-center">
                    <a
                        href="/verifier"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Vérifier une autre attestation
                    </a>
                </div>
            </div>
        </div>
    );
}
