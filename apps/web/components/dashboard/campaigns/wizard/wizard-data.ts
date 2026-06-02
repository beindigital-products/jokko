// Fixture data + helpers for the v3 campaign wizard, ported from the design's
// `CampaignWizard` (CW_TEMPLATES / CW_SEGMENTS / CW_NUMBERS / CW_PRICE /
// CW_BALANCE / cwSources / cwResolve / cwFmt). French-only; the live flow would
// hydrate these from convex (templates, segments, org numbers, wallet balance).

import type {
    CampaignWizardData,
    TemplateVar,
    VariableSource,
    WizardSegment,
    WizardTemplate,
    SendingNumber,
    TemplateCategory,
} from "./types"

export const CW_TEMPLATES: WizardTemplate[] = [
    {
        id: "devis",
        name: "Devis envoyé",
        cat: "Marketing",
        lang: "FR",
        header: { type: "doc", label: "Devis_{{2}}.pdf" },
        body: "Bonjour {{1}}, voici votre devis personnalisé pour {{2}}. Il est valable 14 jours.",
        footer: "— L'équipe Atelier Bracquet",
        buttons: ["Voir la boutique"],
        vars: [
            { token: "{{1}}", src: "first" },
            { token: "{{2}}", src: "fixed", fixed: "Promo Fête des Pères -20%" },
        ],
    },
    {
        id: "collection",
        name: "Nouvelle collection",
        cat: "Marketing",
        lang: "FR",
        header: { type: "image", label: "Visuel collection" },
        body: "Bonjour {{1}}, notre nouvelle collection {{2}} vient d'arriver. Découvrez-la en avant-première 🌿",
        footer: "— Atelier Bracquet",
        buttons: ["Découvrir", "Se désinscrire"],
        vars: [
            { token: "{{1}}", src: "first" },
            { token: "{{2}}", src: "fixed", fixed: "Printemps 2026" },
        ],
    },
    {
        id: "welcome",
        name: "Welcome customer",
        cat: "Marketing",
        lang: "EN",
        header: null,
        body: "Welcome {{1}}! Enjoy 10% off your first order this week. Reply STOP to unsubscribe.",
        footer: null,
        buttons: ["Shop now"],
        vars: [{ token: "{{1}}", src: "first" }],
    },
    {
        id: "confirm",
        name: "Confirmation commande",
        cat: "Utility",
        lang: "FR",
        header: null,
        body: "Votre commande {{1}} est confirmée pour un total de {{2}} €. Merci pour votre confiance.",
        footer: null,
        buttons: ["Suivre ma commande"],
        vars: [
            { token: "{{1}}", src: "fixed", fixed: "#10428" },
            { token: "{{2}}", src: "fixed", fixed: "149" },
        ],
    },
    {
        id: "livraison",
        name: "Suivi livraison",
        cat: "Utility",
        lang: "FR",
        header: null,
        body: "Bonjour, votre colis {{1}} arrive le {{2}}. Suivez la livraison ici : {{3}}",
        footer: null,
        buttons: ["Suivre le colis"],
        vars: [
            { token: "{{1}}", src: "fixed", fixed: "#10428" },
            { token: "{{2}}", src: "fixed", fixed: "jeudi 5 juin" },
            { token: "{{3}}", src: "fixed", fixed: "atb.fr/suivi" },
        ],
    },
    {
        id: "rdv",
        name: "Rdv confirmé",
        cat: "Utility",
        lang: "FR",
        header: null,
        body: "Votre rendez-vous est confirmé le {{1}} à {{2}}. À très vite !",
        footer: null,
        buttons: [],
        vars: [
            { token: "{{1}}", src: "fixed", fixed: "12 juin" },
            { token: "{{2}}", src: "fixed", fixed: "14:30" },
        ],
    },
]

export const CW_SEGMENTS: WizardSegment[] = [
    { id: "active", fr: "Clients actifs", total: 1204, excluded: 54, desc: "Au moins 1 commande sur 90 jours" },
    { id: "vip", fr: "VIP", total: 38, excluded: 1, desc: "Valeur vie supérieure à 2 000 €" },
    { id: "prospects", fr: "Prospects", total: 472, excluded: 96, desc: "Sans commande · opt-in marketing" },
    { id: "inactive", fr: "Inactifs 90j", total: 696, excluded: 178, desc: "Aucune activité depuis 90 jours" },
    { id: "dakar", fr: "Dakar", total: 182, excluded: 11, desc: "Zone géographique · Sénégal" },
    { id: "all", fr: "Tous les contacts", total: 2408, excluded: 312, desc: "Annuaire complet" },
]

export const CW_NUMBERS: SendingNumber[] = [
    { id: "paris", label: "Paris", num: "+33 1 84 60 12 88", quality: "Élevée" },
    { id: "dakar", label: "Dakar", num: "+221 33 869 41 02", quality: "Moyenne" },
]

export const CW_PRICE: Record<TemplateCategory, number> = { Marketing: 0.032, Utility: 0.011 }
export const CW_BALANCE = 128.4

/** Variable source options (contact fields + fixed value) with example values. */
export function cwSources(): VariableSource[] {
    return [
        { id: "first", label: "Contact · Prénom", eg: "Margaux" },
        { id: "last", label: "Contact · Nom", eg: "Lévy" },
        { id: "company", label: "Contact · Société", eg: "Atelier Bracquet" },
        { id: "city", label: "Contact · Ville", eg: "Paris" },
        { id: "fixed", label: "Valeur fixe", eg: "" },
    ]
}

/** Resolve a variable binding to its example/fixed value for the preview. */
export function cwResolve(v: TemplateVar): string {
    if (v.src === "fixed") return v.fixed || "…"
    const s = cwSources().find((x) => x.id === v.src)
    return s ? s.eg : "…"
}

/** Thousands-formatted French number. */
export function cwFmt(n: number): string {
    return n.toLocaleString("fr-FR")
}

/** Default fixture passed to the wizard story / page. */
export const CAMPAIGN_WIZARD_DATA: CampaignWizardData = {
    templates: CW_TEMPLATES,
    segments: CW_SEGMENTS,
    numbers: CW_NUMBERS,
    price: CW_PRICE,
    balance: CW_BALANCE,
    initial: {
        name: "Promo Fête des Pères",
        desc: "Lancement opération -20% sur la maroquinerie",
        cat: "Marketing",
        tplId: "devis",
        segId: "active",
        mode: "scheduled",
        date: "2026-06-13",
        time: "10:00",
        numId: "paris",
    },
}
