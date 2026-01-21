import { Metadata } from "next"
import DemandesTabsView from "@/components/agent/DemandesTabsView"

export const metadata: Metadata = {
    title: "Demandes - Service Civique",
    description: "Liste des demandes d'attestation",
}

export default function DemandesPage() {
    return <DemandesTabsView />
}
