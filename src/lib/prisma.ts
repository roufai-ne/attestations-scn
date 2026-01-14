import { PrismaClient } from '@prisma/client'

// Déclaration globale pour éviter les instances multiples en développement
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Instance Prisma singleton
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
