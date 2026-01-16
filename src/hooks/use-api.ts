'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface ApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Hook personnalisé pour les appels API avec gestion d'état
 * Fournit une interface unifiée pour les requêtes HTTP
 */
export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  /**
   * Exécute une requête API
   */
  const execute = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      apiOptions: ApiOptions = {}
    ): Promise<T | null> => {
      const {
        showSuccessToast = false,
        showErrorToast = true,
        successMessage,
        onSuccess,
        onError,
      } = apiOptions;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || `Erreur ${response.status}`;
          throw new Error(errorMessage);
        }

        setState({ data, isLoading: false, error: null });

        if (showSuccessToast) {
          toast.success(successMessage || 'Opération réussie');
        }

        onSuccess?.(data);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        onError?.(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Raccourci pour GET
   */
  const get = useCallback(
    (url: string, options: ApiOptions = {}) => {
      return execute(url, { method: 'GET' }, options);
    },
    [execute]
  );

  /**
   * Raccourci pour POST
   */
  const post = useCallback(
    (url: string, body: any, options: ApiOptions = {}) => {
      return execute(
        url,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        options
      );
    },
    [execute]
  );

  /**
   * Raccourci pour PUT
   */
  const put = useCallback(
    (url: string, body: any, options: ApiOptions = {}) => {
      return execute(
        url,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
        options
      );
    },
    [execute]
  );

  /**
   * Raccourci pour PATCH
   */
  const patch = useCallback(
    (url: string, body: any, options: ApiOptions = {}) => {
      return execute(
        url,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
        options
      );
    },
    [execute]
  );

  /**
   * Raccourci pour DELETE
   */
  const del = useCallback(
    (url: string, options: ApiOptions = {}) => {
      return execute(url, { method: 'DELETE' }, options);
    },
    [execute]
  );

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    get,
    post,
    put,
    patch,
    delete: del,
    reset,
  };
}

/**
 * Hook pour gérer les mutations avec confirmation
 */
export function useMutation<TInput = any, TOutput = any>(
  mutationFn: (input: TInput) => Promise<TOutput>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput, options: ApiOptions = {}): Promise<TOutput | null> => {
      const { showSuccessToast, showErrorToast = true, successMessage, onSuccess, onError } =
        options;

      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(input);

        if (showSuccessToast) {
          toast.success(successMessage || 'Opération réussie');
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, isLoading, error, reset };
}

export default useApi;
