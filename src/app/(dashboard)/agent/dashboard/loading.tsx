import { SkeletonStats, SkeletonTable } from "@/components/ui/skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
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

            {/* Cartes de statistiques */}
            <SkeletonStats />

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
