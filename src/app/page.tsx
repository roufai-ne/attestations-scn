'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { HomeHeader, HeroSection, ServicesSection, HomeFooter } from '@/components/home';

// Mapping des rôles vers les dashboards
const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  DIRECTEUR: '/directeur/dashboard',
  AGENT: '/agent/dashboard',
  SAISIE: '/saisie/dashboard',
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<{
    logoUrl?: string;
    heroImageUrl?: string;
  }>({});

  const isLoggedIn = status === 'authenticated' && session?.user;
  const userRole = session?.user?.role || 'AGENT';
  const dashboardUrl = ROLE_DASHBOARDS[userRole] || '/agent/dashboard';

  useEffect(() => {
    // Fetch custom assets from API
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/admin/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets({
            logoUrl: data.logoUrl || undefined,
            heroImageUrl: data.heroImageUrl || undefined,
          });
        }
      } catch (error) {
        // Use defaults if API fails
        console.log('Using default assets');
      }
    };

    fetchAssets();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeHeader logoUrl={assets.logoUrl} />

      {/* Hero Section */}
      <div className="pt-16">
        <HeroSection
          heroImageUrl={assets.heroImageUrl}
          logoUrl={assets.logoUrl}
        />
      </div>

      {/* Services Section */}
      <ServicesSection backgroundImageUrl={assets.heroImageUrl} />

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[var(--navy)] mb-6">
              À propos du Service Civique National
            </h2>
            <div className="w-16 h-1 bg-[var(--accent-green)] mx-auto mb-6" />
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
              Le Service Civique National du Niger est une institution dédiée à l&apos;engagement
              citoyen et au développement national. Notre plateforme numérique moderne permet
              de gérer efficacement les attestations de fin de service, garantissant
              sécurité, traçabilité et rapidité dans le traitement des demandes.
            </p>

            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-dark)]">
                  Plateforme 100% numérique et sécurisée
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-[var(--accent-orange)] rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-dark)]">
                  Signature électronique certifiée
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-[var(--navy)] rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-dark)]">
                  Vérification instantanée par QR Code
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-dark)]">
                  Traçabilité complète des demandes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)]">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-white/80 mb-8">
              Accédez à notre plateforme pour gérer vos demandes d&apos;attestations
              de manière simple et sécurisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link
                  href={dashboardUrl}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Mon tableau de bord
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Connexion
                </Link>
              )}
              <Link
                href="/verifier"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-white/30"
              >
                Vérifier une attestation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter logoUrl={assets.logoUrl} />
    </div>
  );
}
