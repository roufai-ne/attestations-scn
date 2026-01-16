'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, FileCheck, Users, Zap, CheckCircle, ArrowRight, Sparkles, Clock, Award } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute top-40 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div 
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-green-300/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="p-2 bg-gradient-to-br from-green-600 to-orange-600 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Service Civique National</h1>
              <p className="text-sm text-gray-600">République du Niger</p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right"
          >
            Connexion
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-orange-100 text-green-700 rounded-full text-sm font-medium mb-6 animate-pulse-subtle shadow-sm">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            Plateforme Digitale Officielle
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="inline-block animate-fade-in-up">Gestion des Attestations de</span>
            <br />
            <span className="bg-gradient-to-r from-green-600 via-green-500 to-orange-600 bg-clip-text text-transparent animate-gradient-x inline-block animate-fade-in-up-delay">
              Service Civique
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in-up-delay-2">
            Plateforme numérique sécurisée pour la gestion, la génération et la validation des attestations de fin de service civique national.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delay-3">
            <Link
              href="/login"
              className="group px-8 py-4 bg-gradient-to-r from-green-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <span className="relative z-10">Accéder à la plateforme</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/verifier"
              className="group px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-green-600 hover:text-green-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10">Vérifier une attestation</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>

        {/* Floating icons */}
        <div className="absolute top-20 left-10 animate-float-slow hidden lg:block">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <FileCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="absolute top-40 right-20 animate-float-slow hidden lg:block" style={{ animationDelay: '1s' }}>
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </section>

      {/* Features Section with scroll animation */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div
            className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200 hover:-translate-y-2 animate-slide-in-up"
            style={{ animationDelay: '0s' }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <FileCheck className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
              Génération Automatique
            </h3>
            <p className="text-gray-600">
              Création automatique d&apos;attestations sécurisées avec QR code pour une validation instantanée.
            </p>
          </div>

          <div
            className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200 hover:-translate-y-2 animate-slide-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Shield className="h-7 w-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
              Signature Électronique
            </h3>
            <p className="text-gray-600">
              Signature numérique sécurisée du directeur avec authentification à deux facteurs (PIN).
            </p>
          </div>

          <div
            className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200 hover:-translate-y-2 animate-slide-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
              Traçabilité Complète
            </h3>
            <p className="text-gray-600">
              Suivi en temps réel de toutes les demandes avec historique complet et audit des actions.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section with counter animation */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-green-600 via-green-500 to-orange-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse-slow" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 relative z-10">
            Le Service Civique en Chiffres
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center relative z-10">
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="flex justify-center mb-3">
                <Award className="h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-2 animate-count-up">
                5000+
              </div>
              <div className="text-white/80 text-lg">
                Attestations délivrées
              </div>
            </div>

            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="flex justify-center mb-3">
                <CheckCircle className="h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-2 animate-count-up">
                98%
              </div>
              <div className="text-white/80 text-lg">
                Taux de satisfaction
              </div>
            </div>

            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="flex justify-center mb-3">
                <Clock className="h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-2 animate-count-up">
                24h
              </div>
              <div className="text-white/80 text-lg">
                Délai moyen de traitement
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez notre plateforme et bénéficiez d'une gestion simplifiée et sécurisée.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>© 2026 Service Civique National - République du Niger</span>
            </div>
            <div className="flex gap-6">
              <Link href="/verifier" className="hover:text-green-600 transition-colors">
                Vérifier une attestation
              </Link>
              <Link href="/login" className="hover:text-green-600 transition-colors">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

