import { Metadata } from "next"
import DemandesDataTable from "@/components/agent/DemandesDataTable"

export const metadata: Metadata = {
    title: "Demandes - Service Civique",
    description: "Liste des demandes d'attestation",
}

export default function DemandesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Demandes d'attestation
                    </h1>
                    <p className="text-muted-foreground">
                        Gérer et suivre toutes les demandes
                    </p>
                </div>
            </div>

            <DemandesDataTable />
        </div>
    )
}
