# syntax=docker/dockerfile:1

# ============================================
# Attestations SCN - Dockerfile Production
# Multi-stage build optimisé pour Next.js 16
# ============================================

FROM node:20-alpine AS base

# ============================================
# Stage 1: Dépendances
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de lock
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN ./node_modules/.bin/prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM base AS builder
WORKDIR /app

# Copier les dépendances installées
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Désactiver la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build de l'application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM base AS runner
WORKDIR /app

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Installer les dépendances système pour canvas/OCR
RUN apk add --no-cache libc6-compat cairo pango

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Créer les répertoires nécessaires
RUN mkdir -p /app/uploads /app/public/attestations /app/public/arretes
RUN chown -R nextjs:nodejs /app

# Copier les fichiers nécessaires de l'étape builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copier le fichier de langue OCR
COPY --from=builder --chown=nextjs:nodejs /app/fra.traineddata ./fra.traineddata

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variables d'environnement du serveur
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "server.js"]
