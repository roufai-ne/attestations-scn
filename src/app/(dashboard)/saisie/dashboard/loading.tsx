import { SkeletonStats, SkeletonTable } from "@/components/ui/skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function SaisieDashboardLoading() {
    return (
        <div className="space-y-8">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <Skeleton className="h-8 w-16 mt-2" />
                        <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                ))}
            </div>

            {/* Demandes récentes */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <SkeletonTable rows={5} />
            </div>
        </div>
    )
}
