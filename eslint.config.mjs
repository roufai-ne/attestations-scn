import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules for this project
  {
    rules: {
      // Désactiver pour le texte français avec apostrophes
      "react/no-unescaped-entities": "off",
      // Réduire en warning les types any (à corriger progressivement)
      "@typescript-eslint/no-explicit-any": "warn",
      // Réduire en warning les variables non utilisées
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Réduire en warning les dépendances manquantes dans useEffect/useCallback
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
