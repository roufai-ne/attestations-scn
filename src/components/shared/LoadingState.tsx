'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
    type?: 'card' | 'table' | 'list' | 'form' | 'page';
    count?: number;
    message?: string;
}

/**
 * Composants de chargement réutilisables
 */

// Skeleton pour une carte
export function CardSkeleton() {
    return (
        <div className="p-6 bg-white rounded-lg border shadow-sm">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

// Skeleton pour une ligne de tableau
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Skeleton pour un tableau complet
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="p-4 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Skeleton pour un élément de liste
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
        </div>
    );
}

// Skeleton pour une liste
export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}

// Skeleton pour un formulaire
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
    return (
        <div className="space-y-6 bg-white p-6 rounded-lg border">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <div className="flex gap-4 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}

// Skeleton pour une page complète
export function PageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Content */}
            <TableSkeleton />
        </div>
    );
}

// Composant LoadingState unifié
export function LoadingState({ type = 'page', count = 5, message }: LoadingStateProps) {
    return (
        <div className="animate-pulse">
            {message && (
                <div className="text-center text-gray-500 mb-4">
                    <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {type === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: count }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            )}

            {type === 'table' && <TableSkeleton rows={count} />}
            {type === 'list' && <ListSkeleton count={count} />}
            {type === 'form' && <FormSkeleton fields={count} />}
            {type === 'page' && <PageSkeleton />}
        </div>
    );
}

// Spinner simple
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-10 w-10',
    };

    return (
        <div
            className={`${sizeClasses[size]} border-2 border-gray-200 border-t-primary rounded-full animate-spin`}
        />
    );
}

// Loading overlay pour les actions
export function LoadingOverlay({ message = 'Chargement...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
                <Spinner size="lg" />
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
}

export default LoadingState;
