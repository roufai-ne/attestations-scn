'use client';

import { useState, useCallback } from 'react';
import { z, ZodObject, ZodRawShape, ZodError } from 'zod';

interface ValidationState<T> {
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  touchedFields: Set<keyof T>;
}

/**
 * Hook personnalisé pour la validation de formulaires avec Zod
 * Fournit une validation en temps réel et des messages d'erreur localisés
 */
export function useFormValidation<T extends ZodRawShape>(
  schema: ZodObject<T>
) {
  type FormData = z.infer<typeof schema>;

  const [state, setState] = useState<ValidationState<FormData>>({
    errors: {},
    isValid: false,
    touchedFields: new Set(),
  });

  /**
   * Valide un champ individuel en utilisant safeParse
   */
  const validateField = useCallback(
    (field: keyof FormData, value: any, formData?: Partial<FormData>): string | null => {
      try {
        // Valider avec le schéma complet mais récupérer uniquement l'erreur du champ
        const dataToValidate = { ...formData, [field]: value };
        const result = schema.safeParse(dataToValidate);

        if (!result.success) {
          const fieldError = result.error.errors.find((e) => e.path[0] === field);
          return fieldError?.message || null;
        }
        return null;
      } catch {
        return 'Erreur de validation';
      }
    },
    [schema]
  );

  /**
   * Valide tous les champs du formulaire
   */
  const validateForm = useCallback(
    (data: Partial<FormData>): { isValid: boolean; errors: Partial<Record<keyof FormData, string>> } => {
      const result = schema.safeParse(data);

      if (result.success) {
        const newState = { errors: {} as Partial<Record<keyof FormData, string>>, isValid: true };
        setState((prev) => ({ ...prev, ...newState }));
        return newState;
      }

      const errors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof FormData;
        if (!errors[field]) {
          errors[field] = e.message;
        }
      });

      const newState = { errors, isValid: false };
      setState((prev) => ({ ...prev, ...newState }));
      return newState;
    },
    [schema]
  );

  /**
   * Marque un champ comme touché et le valide
   */
  const touchField = useCallback(
    (field: keyof FormData, value: any, formData?: Partial<FormData>) => {
      const error = validateField(field, value, formData);
      setState((prev) => {
        const newTouched = new Set(prev.touchedFields);
        newTouched.add(field);
        const newErrors = { ...prev.errors };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return {
          ...prev,
          touchedFields: newTouched,
          errors: newErrors,
        };
      });
    },
    [validateField]
  );

  /**
   * Efface l'erreur d'un champ
   */
  const clearFieldError = useCallback((field: keyof FormData) => {
    setState((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return { ...prev, errors: newErrors };
    });
  }, []);

  /**
   * Réinitialise l'état de validation
   */
  const reset = useCallback(() => {
    setState({
      errors: {},
      isValid: false,
      touchedFields: new Set(),
    });
  }, []);

  /**
   * Vérifie si un champ a une erreur et a été touché
   */
  const hasError = useCallback(
    (field: keyof FormData): boolean => {
      return state.touchedFields.has(field) && !!state.errors[field];
    },
    [state.errors, state.touchedFields]
  );

  /**
   * Obtient le message d'erreur d'un champ s'il existe
   */
  const getError = useCallback(
    (field: keyof FormData): string | undefined => {
      return state.touchedFields.has(field) ? state.errors[field] : undefined;
    },
    [state.errors, state.touchedFields]
  );

  return {
    errors: state.errors,
    isValid: state.isValid,
    touchedFields: state.touchedFields,
    validateField,
    validateForm,
    touchField,
    clearFieldError,
    reset,
    hasError,
    getError,
  };
}

/**
 * Schémas de validation réutilisables
 */
export const commonValidators = {
  email: z.string().email('Adresse email invalide'),

  telephone: z
    .string()
    .regex(/^\+227\d{8}$/, 'Format: +227 suivi de 8 chiffres')
    .or(z.literal('')),

  nom: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long'),

  prenom: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom est trop long'),

  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),

  pin: z
    .string()
    .length(6, 'Le PIN doit contenir 6 chiffres')
    .regex(/^\d+$/, 'Le PIN ne doit contenir que des chiffres'),

  numeroEnregistrement: z
    .string()
    .min(1, 'Le numéro d\'enregistrement est requis')
    .max(50, 'Le numéro est trop long'),
};

export default useFormValidation;
