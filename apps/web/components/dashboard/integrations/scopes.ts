import type { IconName } from "../primitives/Icon"
import type { IntegrationCategory } from "./types"

export interface IntegrationScope {
    icon: IconName
    label: string
}

/**
 * Per-category permission scopes shown in the connect-consent + disconnect +
 * detail modals. Ported from the design handoff (`intgScopes` in dialogs.jsx).
 */
const SCOPES: Record<IntegrationCategory, IntegrationScope[]> = {
    CRM: [
        { icon: "users", label: "Lire et écrire vos contacts" },
        { icon: "doc", label: "Créer et mettre à jour des deals" },
        { icon: "user", label: "Mapper les propriétaires sur vos pôles" },
        { icon: "bolt", label: "Recevoir les mises à jour en temps réel" },
    ],
    "Prod.": [
        { icon: "doc", label: "Lire et écrire vos bases / feuilles" },
        { icon: "send", label: "Exporter automatiquement les conversations" },
        { icon: "switch", label: "Synchroniser les modifications dans les deux sens" },
    ],
    Messagerie: [
        { icon: "send", label: "Publier des notifications dans vos canaux" },
        { icon: "list", label: "Lire la liste des canaux et membres" },
        { icon: "bolt", label: "Activer les commandes /jokko" },
    ],
    Paiement: [
        { icon: "doc", label: "Créer des liens de paiement" },
        { icon: "circle-check", label: "Lire le statut des paiements" },
        { icon: "shield", label: "Recevoir les webhooks signés" },
    ],
    "E-commerce": [
        { icon: "doc", label: "Lire les commandes et leur statut" },
        { icon: "bolt", label: "Suivre la livraison en temps réel" },
        { icon: "users", label: "Accéder aux profils clients" },
    ],
    API: [
        { icon: "send", label: "Émettre un POST sortant sur événements" },
        { icon: "bolt", label: "Recevoir des déclencheurs entrants" },
        { icon: "lock", label: "Signer les charges utiles (HMAC)" },
    ],
}

export function integrationScopes(cat: IntegrationCategory): IntegrationScope[] {
    return SCOPES[cat] ?? SCOPES.API
}
