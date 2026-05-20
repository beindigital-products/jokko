import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type PlanLimits = {
    name: string;
    description?: string;
    maxAgents: number;
    maxWhatsappChannels: number;
    maxConversationsPerMonth: number;
    maxTemplates: number;
    historyDays: number;
    monthlyPriceFCFA: number;
    supportLevel?: string;
};

type Organization = {
    _id: Id<"organizations">;
    name: string;
    plan: string;
    hasSelectedPlan?: boolean;
    trialStartedAt?: number;
    trialEndsAt?: number;
    creditBalance?: number;
    usageStats?: {
        periodStart: number;
        periodEnd: number;
        serviceConversationsCount: number;
    };
    stripe?: {
        subscriptionId?: string;
        status?: string;
        currentPeriodEnd?: number;
    };
};

const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_APP_URL || "https://app.jokko.io").replace(
    /\/$/,
    "",
);

export function BillingSettingsScreen() {
    const router = useRouter();
    const session = useQuery(api.sessions.current);
    const organization = session?.organization as Organization | null | undefined;
    const planLimits = useQuery(
        api.plans.getLimitsForOrg,
        organization?._id ? { organizationId: organization._id } : "skip",
    ) as PlanLimits | null | undefined;
    const usageStats = useQuery(
        api.billing.getUsageStats,
        organization?._id ? { organizationId: organization._id } : "skip",
    );
    const creditBalance = useQuery(api.credits.getBalance) as number | null | undefined;

    if (session === undefined) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (!organization) {
        return (
            <View style={styles.empty}>
                <Ionicons name="card-outline" size={32} color={theme.ink[500]} />
                <Text style={styles.emptyTitle}>Aucune organisation active</Text>
                <Text style={styles.emptyBody}>
                    Termine d'abord l'onboarding pour voir les détails de facturation.
                </Text>
            </View>
        );
    }

    const stats = usageStats ?? organization.usageStats;
    const conversationCount = stats?.serviceConversationsCount ?? 0;
    const conversationLimit = planLimits?.maxConversationsPerMonth ?? 0;
    const conversationProgress = computeProgress(conversationCount, conversationLimit);

    const onTrial =
        Boolean(organization.trialEndsAt) && (organization.trialEndsAt ?? 0) > Date.now();
    const stripeStatus = organization.stripe?.status;

    const openWeb = async (path: string) => {
        const url = `${WEB_APP_URL}${path}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                Alert.alert("Lien indisponible", `Ouvre manuellement ${url} sur le web.`);
                return;
            }
            await Linking.openURL(url);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Ouverture impossible";
            Alert.alert("Lien indisponible", message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                    <Text style={styles.backText}>Plus</Text>
                </Pressable>
                <Text style={styles.eyebrow}>Abonnement</Text>
                <Text style={styles.title}>Plan & facturation</Text>
                <Text style={styles.body}>
                    Aperçu du plan, des quotas et du solde de crédits. Les changements de plan et paiements
                    se font depuis l'app web.
                </Text>
            </View>

            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planName}>{planLimits?.name ?? organization.plan}</Text>
                    <View style={styles.planTag}>
                        <Text style={styles.planTagText}>{organization.plan}</Text>
                    </View>
                </View>
                {planLimits?.description ? (
                    <Text style={styles.planDesc}>{planLimits.description}</Text>
                ) : null}
                <Text style={styles.planPrice}>{formatPrice(planLimits?.monthlyPriceFCFA)}</Text>
                {onTrial ? (
                    <View style={styles.trialBadge}>
                        <Ionicons name="time-outline" size={14} color="#92400E" />
                        <Text style={styles.trialText}>
                            Période d'essai jusqu'au {formatDate(organization.trialEndsAt!)}
                        </Text>
                    </View>
                ) : null}
                {stripeStatus ? (
                    <Text style={styles.stripeStatus}>
                        Statut Stripe : <Text style={styles.stripeStatusValue}>{stripeStatus}</Text>
                        {organization.stripe?.currentPeriodEnd
                            ? ` · prochain prélèvement ${formatDate(organization.stripe.currentPeriodEnd)}`
                            : ""}
                    </Text>
                ) : null}
            </View>

            <Section title="Utilisation du cycle">
                <View style={styles.usageCard}>
                    <View style={styles.usageHeader}>
                        <Text style={styles.usageLabel}>Conversations service</Text>
                        <Text style={styles.usageValue}>
                            {conversationCount}
                            {isUnlimited(conversationLimit)
                                ? " / illimité"
                                : ` / ${conversationLimit}`}
                        </Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${conversationProgress.fillPercent}%`,
                                    backgroundColor: conversationProgress.color,
                                },
                            ]}
                        />
                    </View>
                    {stats ? (
                        <Text style={styles.periodHint}>
                            Cycle du {formatDate(stats.periodStart)} au {formatDate(stats.periodEnd)}
                        </Text>
                    ) : (
                        <Text style={styles.periodHint}>Aucun cycle en cours.</Text>
                    )}
                </View>
            </Section>

            <Section title="Limites du plan">
                <View style={styles.card}>
                    <LimitRow
                        icon="people-outline"
                        label="Agents"
                        value={formatLimit(planLimits?.maxAgents)}
                    />
                    <LimitRow
                        icon="logo-whatsapp"
                        label="Canaux WhatsApp"
                        value={formatLimit(planLimits?.maxWhatsappChannels)}
                    />
                    <LimitRow
                        icon="document-text-outline"
                        label="Modèles"
                        value={formatLimit(planLimits?.maxTemplates)}
                    />
                    <LimitRow
                        icon="time-outline"
                        label="Historique"
                        value={
                            planLimits?.historyDays === -1
                                ? "Illimité"
                                : planLimits?.historyDays
                                    ? `${planLimits.historyDays} jours`
                                    : "—"
                        }
                    />
                    <LimitRow
                        icon="ribbon-outline"
                        label="Support"
                        value={planLimits?.supportLevel ?? "—"}
                    />
                </View>
            </Section>

            <Section title="Crédits">
                <View style={styles.creditsCard}>
                    <View>
                        <Text style={styles.creditsValue}>
                            {creditBalance === undefined
                                ? "—"
                                : `${formatNumber(creditBalance ?? 0)} FCFA`}
                        </Text>
                        <Text style={styles.creditsLabel}>Solde disponible</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => openWeb("/dashboard/billing")}
                        style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="open-outline" size={16} color={theme.ink[900]} />
                        <Text style={styles.ghostButtonText}>Recharger</Text>
                    </Pressable>
                </View>
            </Section>

            <View style={styles.actions}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => openWeb("/dashboard/billing")}
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Gérer mon abonnement</Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => openWeb("/pricing")}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                    <Text style={styles.secondaryButtonText}>Comparer les plans</Text>
                </Pressable>
            </View>

            <Text style={styles.footer}>
                Les paiements, changements de plan et historique de factures restent disponibles uniquement
                depuis le tableau de bord web pour des raisons de conformité.
            </Text>
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{title}</Text>
            {children}
        </View>
    );
}

function LimitRow({
    icon,
    label,
    value,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    value: string;
}) {
    return (
        <View style={styles.row}>
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={18} color={theme.accent.primary} />
            </View>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

function computeProgress(
    current: number,
    limit: number,
): { fillPercent: number; color: string } {
    if (isUnlimited(limit)) {
        return { fillPercent: 12, color: theme.accent.primary };
    }
    if (limit <= 0) {
        return { fillPercent: 0, color: theme.ink[500] };
    }
    const ratio = Math.max(0, Math.min(1, current / limit));
    const fillPercent = Math.round(ratio * 100);
    let color: string = theme.accent.primary;
    if (ratio >= 0.95) color = theme.semantic.danger;
    else if (ratio >= 0.75) color = theme.semantic.warning;
    return { fillPercent, color };
}

function isUnlimited(value: number | undefined | null): boolean {
    return value === -1;
}

function formatLimit(value: number | undefined | null): string {
    if (value === undefined || value === null) return "—";
    if (value === -1) return "Illimité";
    return formatNumber(value);
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("fr-FR").format(value);
}

function formatPrice(monthlyPriceFCFA: number | undefined | null): string {
    if (monthlyPriceFCFA === undefined || monthlyPriceFCFA === null) return "—";
    if (monthlyPriceFCFA === 0) return "Gratuit";
    return `${formatNumber(monthlyPriceFCFA)} FCFA / mois`;
}

function formatDate(value: number): string {
    try {
        return new Date(value).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
        gap: theme.spacing.xl,
    },
    header: { gap: theme.spacing.xs },
    backButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    backText: { fontSize: 14, fontWeight: "700", color: theme.ink[900] },
    eyebrow: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.ink[900],
    },
    body: {
        marginTop: theme.spacing.xs,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
    },
    planCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        gap: theme.spacing.sm,
    },
    planHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    planName: {
        flex: 1,
        fontSize: 22,
        fontWeight: "800",
        color: theme.ink[900],
    },
    planTag: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: "#EEF2FF",
    },
    planTagText: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.accent.primary,
    },
    planDesc: {
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink[500],
    },
    planPrice: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    trialBadge: {
        marginTop: theme.spacing.xs,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        alignSelf: "flex-start",
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: "#FEF3C7",
    },
    trialText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#92400E",
    },
    stripeStatus: {
        marginTop: theme.spacing.xs,
        fontSize: 12,
        color: theme.ink[500],
    },
    stripeStatusValue: {
        fontWeight: "800",
        color: theme.ink[900],
    },
    section: { gap: theme.spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        color: theme.ink[500],
    },
    usageCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        gap: theme.spacing.sm,
    },
    usageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    usageLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[900],
    },
    usageValue: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[700],
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.surface.sunken,
        overflow: "hidden",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    periodHint: {
        fontSize: 12,
        color: theme.ink[500],
    },
    card: {
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
    },
    rowLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: theme.ink[900],
    },
    rowValue: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[700],
    },
    creditsCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    creditsValue: {
        fontSize: 22,
        fontWeight: "800",
        color: theme.ink[900],
    },
    creditsLabel: {
        marginTop: 2,
        fontSize: 12,
        color: theme.ink[500],
    },
    ghostButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.sunken,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    ghostButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[900],
    },
    actions: { gap: theme.spacing.sm },
    primaryButton: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
    },
    secondaryButton: {
        minHeight: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[900],
    },
    footer: {
        fontSize: 12,
        color: theme.ink[500],
        lineHeight: 17,
        textAlign: "center",
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.ink[900],
        textAlign: "center",
    },
    emptyBody: {
        fontSize: 14,
        color: theme.ink[500],
        textAlign: "center",
        maxWidth: 300,
    },
    pressed: { opacity: 0.7 },
});
