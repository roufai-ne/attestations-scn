import { useEffect, useState } from 'react';

/**
 * Hook pour debouncer une valeur
 * @param value Valeur à debouncer
 * @param delay Délai en millisecondes
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
