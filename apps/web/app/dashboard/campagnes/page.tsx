"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, usePaginatedQuery, useMutation, useAction } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FeatureGate } from "@/components/billing/feature-gate";
import { CampaignsScreen } from "@/components/dashboard/campaigns";
import { RechargeDialog } from "@/components/dashboard/campaigns/RechargeDialog";
import { MarketingCreditBar } from "@/components/dashboard/overview/MarketingCreditBar";
import { CampaignWizardScreen, type CampaignCreateInput } from "@/components/dashboard/campaigns/wizard";
import { mapCampaignsData, type BroadcastDoc } from "@/lib/dashboard/campaigns-data";
import { mapMarketingCredit } from "@/lib/dashboard/overview-data";
import {
    buildCampaignWizardData,
    broadcastToWizardInitial,
    segToAudienceConfig,
    type BroadcastEditDoc,
    type ChannelDoc,
} from "@/lib/dashboard/campaign-wizard-data";
import type { TemplateDoc } from "@/lib/dashboard/templates-data";
import { useChannels } from "@/hooks/useChannels";

export default function CampaignsPage() {
    const router = useRouter();
    const role = useQuery(api.users.currentUserRole);
    const broadcasts = useQuery(api.broadcasts.list, {});

    // Wizard data sources (only read once the page is editable).
    const { results: templates } = usePaginatedQuery(api.templates.queries.list, {}, { initialNumItems: 100 });
    const audience = useQuery(api.broadcasts.audienceOptions, {});
    const balance = useQuery(api.credits.getBalance);
    const transactions = useQuery(api.credits.getTransactions, { limit: 50 });
    const { channels } = useChannels();

    const createBroadcast = useMutation(api.broadcasts.create);
    const updateBroadcast = useMutation(api.broadcasts.update);
    const createCreditsCheckout = useAction(api.stripe_actions.createCreditsCheckoutSession);

    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardSeq, setWizardSeq] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const editBroadcast = useQuery(
        api.broadcasts.get,
        editId ? { id: editId as Id<"broadcasts"> } : "skip",
    );
    const [rechargeOpen, setRechargeOpen] = useState(false);
    const [paying, setPaying] = useState(false);

    const canEdit = role === "OWNER" || role === "ADMIN";

    const marketingCredit = useMemo(
        () =>
            mapMarketingCredit(
                typeof balance === "number" ? balance : 0,
                (transactions ?? []) as unknown as Parameters<typeof mapMarketingCredit>[1],
                Date.now(),
            ),
        [balance, transactions],
    );

    const handleTopUp = async (amount: number) => {
        setPaying(true);
        try {
            const { url } = await createCreditsCheckout({ amount });
            if (url) window.location.href = url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Recharge impossible");
        } finally {
            setPaying(false);
        }
    };
    const wizardRole = role === "AGENT" || role === "ADMIN" || role === "OWNER" ? role : "OWNER";

    const wizardData = useMemo(() => {
        if (!templates || !audience || channels === undefined) return null;
        return buildCampaignWizardData({
            templates: templates as unknown as TemplateDoc[],
            audience,
            channels: (channels ?? []) as unknown as ChannelDoc[],
            balance: typeof balance === "number" ? balance : 0,
        });
    }, [templates, audience, channels, balance]);

    // Edit mode: re-open the wizard pre-filled from a draft (?edit=<id>).
    const editWizardData = useMemo(() => {
        if (!wizardData) return null;
        if (editingId && editBroadcast) {
            return {
                ...wizardData,
                initial: broadcastToWizardInitial(editBroadcast as unknown as BroadcastEditDoc, wizardData),
            };
        }
        return wizardData;
    }, [wizardData, editingId, editBroadcast]);

    useEffect(() => {
        if (editId && editBroadcast && wizardData && editingId !== editId) {
            setEditingId(editId);
            setWizardSeq((s) => s + 1);
            setWizardOpen(true);
        }
    }, [editId, editBroadcast, wizardData, editingId]);

    const openWizard = () => {
        if (!wizardData) {
            toast.error("Créez d'abord un modèle approuvé et activez un canal WhatsApp.");
            return;
        }
        setEditingId(null);
        setWizardSeq((s) => s + 1);
        setWizardOpen(true);
    };

    const handleWizardOpenChange = (open: boolean) => {
        setWizardOpen(open);
        if (!open && editingId) {
            setEditingId(null);
            router.replace("/dashboard/campagnes");
        }
    };

    /** Shared helper: build the common broadcast payload from wizard input. */
    function buildBroadcastPayload(input: CampaignCreateInput) {
        const cfg = segToAudienceConfig(input.segId);
        const audienceConfig =
            cfg.type === "TAGS"
                ? { type: "TAGS" as const, tags: (cfg.tags ?? []) as Id<"tags">[] }
                : { type: "ALL" as const };
        const scheduledAt =
            input.mode === "scheduled" ? new Date(`${input.date}T${input.time}`).getTime() : undefined;
        const templateVariables = input.vars.map((v) => ({
            token: v.token,
            src: v.src as string,
            fixed: v.fixed,
        }));
        return { audienceConfig, scheduledAt, templateVariables };
    }

    const handleCreate = async (input: CampaignCreateInput): Promise<boolean> => {
        try {
            const { audienceConfig, scheduledAt, templateVariables } = buildBroadcastPayload(input);

            if (editingId) {
                // Editing a draft: persist via update, then schedule/send.
                await updateBroadcast({
                    id: editingId as Id<"broadcasts">,
                    name: input.name.trim() || "Campagne",
                    templateId: input.templateId as Id<"templates">,
                    whatsappChannelId: input.numId ? (input.numId as Id<"whatsappChannels">) : undefined,
                    audienceConfig,
                    templateVariables,
                    scheduledAt,
                    status: input.mode === "scheduled" ? "SCHEDULED" : "SENDING",
                });
            } else {
                const id = await createBroadcast({
                    name: input.name.trim() || "Campagne",
                    templateId: input.templateId as Id<"templates">,
                    whatsappChannelId: input.numId ? (input.numId as Id<"whatsappChannels">) : undefined,
                    audienceConfig,
                    templateVariables,
                    scheduledAt,
                });

                // "Envoyer maintenant" → flip the freshly-created draft to SENDING.
                if (input.mode === "now" && id) {
                    await updateBroadcast({ id, status: "SENDING" });
                }
            }
            return true;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Enregistrement de la campagne impossible");
            return false;
        }
    };

    /** Save wizard state as a DRAFT broadcast without sending. */
    const handleSaveDraft = async (input: CampaignCreateInput): Promise<boolean> => {
        try {
            const { audienceConfig, templateVariables } = buildBroadcastPayload(input);

            if (editingId) {
                // Update existing broadcast and keep it as DRAFT.
                await updateBroadcast({
                    id: editingId as Id<"broadcasts">,
                    name: input.name.trim() || "Campagne",
                    templateId: input.templateId as Id<"templates">,
                    whatsappChannelId: input.numId ? (input.numId as Id<"whatsappChannels">) : undefined,
                    audienceConfig,
                    templateVariables,
                    status: "DRAFT",
                });
            } else {
                // Create a new broadcast; it starts as DRAFT by default.
                await createBroadcast({
                    name: input.name.trim() || "Campagne",
                    templateId: input.templateId as Id<"templates">,
                    whatsappChannelId: input.numId ? (input.numId as Id<"whatsappChannels">) : undefined,
                    audienceConfig,
                    templateVariables,
                });
            }
            toast.success("Brouillon enregistré");
            return true;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer le brouillon");
            return false;
        }
    };

    return (
        <FeatureGate feature="broadcasts">
            {broadcasts === undefined ? (
                <div className="flex h-full items-center justify-center bg-[var(--paper-white)]">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-300)]" />
                </div>
            ) : (
                <CampaignsScreen
                    data={mapCampaignsData(broadcasts as unknown as BroadcastDoc[])}
                    canEdit={canEdit}
                    onNew={openWizard}
                    onOpenRow={(id) => router.push(`/dashboard/campagnes/${id}`)}
                    creditBar={
                        canEdit ? (
                            <MarketingCreditBar credit={marketingCredit} onRecharge={() => setRechargeOpen(true)} />
                        ) : undefined
                    }
                />
            )}

            {canEdit ? (
                <RechargeDialog
                    open={rechargeOpen}
                    onOpenChange={setRechargeOpen}
                    balanceLabel={marketingCredit.balance}
                    conversationsLabel={marketingCredit.conversations}
                    amounts={[5000, 10000, 25000, 50000, 100000]}
                    onPay={handleTopUp}
                    paying={paying}
                />
            ) : null}

            {canEdit && editWizardData ? (
                <CampaignWizardScreen
                    key={wizardSeq}
                    open={wizardOpen}
                    onOpenChange={handleWizardOpenChange}
                    data={editWizardData}
                    role={wizardRole}
                    onCreate={handleCreate}
                    onSaveDraft={handleSaveDraft}
                />
            ) : null}
        </FeatureGate>
    );
}
