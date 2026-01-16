import { Skeleton, SkeletonTable } from "@/components/ui/skeleton"

export default function DemandesLoading() {
    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Filtres */}
            <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <SkeletonTable rows={10} />
        </div>
    )
}
