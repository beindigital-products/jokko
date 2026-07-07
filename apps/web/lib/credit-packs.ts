export interface CreditPack {
    id: string;
    amountFCFA: number;
    credits: number;
    label: string;
    messagesEstimated: number;
    popular?: boolean;
}

// Estimation basée sur le tarif Meta réellement débité en zone UEMOA/Afrique
// (~16 FCFA/message template — 0,0259 USD × 605, cf. packages/core/whatsapp-pricing).
// 1 crédit = 1 FCFA, donc ≈ montant / 16. (L'ancienne estimation « 83 pour
// 5 000 » sous-évaluait ~3,7× la capacité réelle sur ce marché.)
const FCFA_PER_MESSAGE = 16;
const estMessages = (amountFCFA: number) => Math.floor(amountFCFA / FCFA_PER_MESSAGE);

export const CREDIT_PACKS: CreditPack[] = [
    { id: "pack_5k", amountFCFA: 5_000, credits: 5_000, label: "5 000 FCFA", messagesEstimated: estMessages(5_000) },
    { id: "pack_10k", amountFCFA: 10_000, credits: 10_000, label: "10 000 FCFA", messagesEstimated: estMessages(10_000), popular: true },
    { id: "pack_25k", amountFCFA: 25_000, credits: 25_000, label: "25 000 FCFA", messagesEstimated: estMessages(25_000) },
    { id: "pack_50k", amountFCFA: 50_000, credits: 50_000, label: "50 000 FCFA", messagesEstimated: estMessages(50_000) },
    { id: "pack_100k", amountFCFA: 100_000, credits: 100_000, label: "100 000 FCFA", messagesEstimated: estMessages(100_000) },
];

export type PaymentProvider = "WAVE" | "ORANGE_MONEY" | "STRIPE";

export const PAYMENT_PROVIDERS: { id: PaymentProvider; name: string; description: string; available: boolean }[] = [
    { id: "WAVE", name: "Wave", description: "Mobile Money Wave", available: true },
    { id: "ORANGE_MONEY", name: "Orange Money", description: "Orange Money Sénégal", available: false },
    { id: "STRIPE", name: "Carte bancaire", description: "Visa, Mastercard", available: true },
];

/**
 * Convertit un montant FCFA (unités majeures) en montant provider.
 * XOF est une devise ZÉRO-décimale chez Stripe (comme JPY / XAF) : le montant
 * est envoyé tel quel, sans ×100. Wave / Orange Money : unités majeures aussi.
 * Tous les providers reçoivent donc le montant FCFA brut.
 */
export function toProviderAmount(amountFCFA: number, _provider: PaymentProvider): number {
    return amountFCFA;
}

export function findPack(amountFCFA: number): CreditPack | undefined {
    return CREDIT_PACKS.find((p) => p.amountFCFA === amountFCFA);
}
