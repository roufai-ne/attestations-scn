/**
 * Mocks pour modules Node.js et externes
 * Utilisé par les tests Vitest
 */

import { vi } from 'vitest';

// Mock crypto avec toutes les fonctions nécessaires
export const mockCrypto = {
  createHmac: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue('mocked-signature'),
    }),
  }),
  timingSafeEqual: vi.fn().mockReturnValue(true),
  randomInt: vi.fn((min: number, max: number) => Math.floor(Math.random() * (max - min)) + min),
  randomBytes: vi.fn((size: number) => Buffer.alloc(size)),
};

// Mock fs/promises
export const mockFsPromises = {
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock file content')),
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
};

// Mock next-auth
export const mockNextAuth = vi.fn(() => ({
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
})) as ReturnType<typeof vi.fn> & { default?: ReturnType<typeof vi.fn> };

mockNextAuth.default = mockNextAuth;

// Mock next/navigation
export const mockUsePathname = vi.fn(() => '/');
export const mockUseRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

export const mockNextNavigation = {
  usePathname: mockUsePathname,
  useRouter: mockUseRouter,
  useSearchParams: vi.fn(() => new URLSearchParams()),
};
