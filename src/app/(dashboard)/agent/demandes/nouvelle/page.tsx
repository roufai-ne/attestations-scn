import { Metadata } from "next"
import DemandeForm from "@/components/agent/DemandeForm"

export const metadata: Metadata = {
    title: "Nouvelle demande - Service Civique",
    description: "Créer une nouvelle demande d'attestation",
}

export default function NouvelleDemandePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Nouvelle demande d'attestation
                </h1>
                <p className="text-muted-foreground">
                    Saisissez les informations de la demande et de l'appelé
                </p>
            </div>

            <DemandeForm />
        </div>
    )
}
