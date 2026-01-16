import { SkeletonStats, SkeletonTable, SkeletonCard } from "@/components/ui/skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
    return (
        <div className="space-y-8">
            {/* En-tête */}
            <div>
                <Skeleton className="h-9 w-72 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Statistiques principales */}
            <SkeletonStats />

            {/* Graphiques */}
            <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard className="h-80" />
                <SkeletonCard className="h-80" />
            </div>

            {/* Activité récente */}
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <SkeletonTable rows={5} />
            </div>
        </div>
    )
}
