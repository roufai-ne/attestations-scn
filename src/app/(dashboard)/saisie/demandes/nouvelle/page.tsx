import { Metadata } from "next"
import DemandeFormSaisie from "@/components/saisie/DemandeFormSaisie"

export const metadata: Metadata = {
    title: "Nouvelle demande - Agent de Saisie",
    description: "Créer une nouvelle demande d'attestation",
}

export default function NouvelleDemandeSaisiePage() {
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

            <DemandeFormSaisie mode="create" />
        </div>
    )
}
