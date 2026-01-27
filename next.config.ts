import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas', 'pdfjs-dist', 'tesseract.js'],

  // Activer le standalone output pour Docker
  output: 'standalone',

  // Désactiver l'affichage de la version Next.js
  poweredByHeader: false,

  // Headers de sécurité
  async headers() {
    // CSP de base (moins restrictive pour permettre le fonctionnement de Next.js)
    const baseCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com", // Nécessaire pour Next.js + hCaptcha
      "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com", // Nécessaire pour les styles inline + hCaptcha
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: https://hcaptcha.com https://*.hcaptcha.com", // hCaptcha API
      "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com", // hCaptcha challenge frame
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    // CSP stricte pour les pages sensibles (admin, directeur)
    const strictCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'", // Pas d'iframe pour ces pages
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      // Headers globaux pour toutes les routes
      {
        source: '/:path*',
        headers: [
          // Désactiver le prefetch DNS sauf si nécessaire
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Forcer HTTPS avec HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Protection XSS (obsolète mais encore utile pour vieux navigateurs)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Empêcher le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Empêcher le MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Contrôler les informations de référent
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Désactiver les APIs sensibles
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // CSP de base
          {
            key: 'Content-Security-Policy',
            value: baseCSP,
          },
          // Protection contre le cross-origin
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      // CSP stricte pour l'administration
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: strictCSP,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // CSP stricte pour le directeur
      {
        source: '/directeur/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: strictCSP,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // Headers pour les API - pas de cache pour les données sensibles
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Rewrites pour servir les fichiers uploadés depuis le bon emplacement
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
