import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, FileCheck, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  // Si l'utilisateur est connecté, rediriger vers son dashboard
  if (session?.user) {
    switch (session.user.role) {
      case 'AGENT':
        redirect('/agent/dashboard');
      case 'DIRECTEUR':
        redirect('/directeur/dashboard');
      case 'ADMIN':
        redirect('/admin/dashboard');
      default:
        redirect('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Service Civique National</h1>
              <p className="text-sm text-gray-600">République du Niger</p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Connexion
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Plateforme Digitale Officielle
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Gestion des Attestations de
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Service Civique</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Plateforme numérique sécurisée pour la gestion, la génération et la validation des attestations de fin de service civique national.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Accéder à la plateforme
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/verifier"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              Vérifier une attestation
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FileCheck className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Génération Automatique</h3>
            <p className="text-gray-600">
              Création automatique d'attestations sécurisées avec QR code pour une validation instantanée.
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Signature Électronique</h3>
            <p className="text-gray-600">
              Signature numérique sécurisée du directeur avec authentification à deux facteurs (PIN).
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Traçabilité Complète</h3>
            <p className="text-gray-600">
              Suivi en temps réel de toutes les demandes avec historique complet et audit des actions.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold text-center mb-12">Le Service Civique en Chiffres</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Attestations délivrées</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Taux de satisfaction</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24h</div>
              <div className="text-blue-100">Délai moyen de traitement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>© 2026 Service Civique National - République du Niger</span>
            </div>
            <div className="flex gap-6">
              <Link href="/verifier" className="hover:text-blue-600 transition-colors">
                Vérifier une attestation
              </Link>
              <Link href="/login" className="hover:text-blue-600 transition-colors">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
