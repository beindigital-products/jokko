'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    CampaignDetailScreen,
    type CampaignAction,
} from '@/components/dashboard/campaigns';
import {
    mapCampaignDetail,
    type BroadcastActivityEvent,
    type BroadcastDetailDoc,
} from '@/lib/dashboard/campaign-detail-data';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type DetailDialog = null | 'cancel' | 'delete' | 'reschedule';

function isoDate(ts: number): string {
    return new Date(ts).toISOString().slice(0, 10);
}

export default function BroadcastDetailPage() {
    const params = useParams();
    const router = useRouter();
    const broadcastId = params.broadcastId as Id<'broadcasts'>;

    const broadcast = useQuery(api.broadcasts.get, { id: broadcastId });
    const activity = useQuery(api.broadcasts.getActivity, { broadcastId });
    const role = useQuery(api.users.currentUserRole);

    const updateBroadcast = useMutation(api.broadcasts.update);
    const duplicateBroadcast = useMutation(api.broadcasts.duplicate);
    const retryFailed = useMutation(api.broadcasts.retryFailed);
    const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);
    const pauseBroadcast = useMutation(api.broadcasts.pauseBroadcast);
    const resumeBroadcast = useMutation(api.broadcasts.resumeBroadcast);

    const [dialog, setDialog] = useState<DetailDialog>(null);
    const [busy, setBusy] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');

    const back = () => router.push('/dashboard/campagnes');

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Action impossible');
        } finally {
            setBusy(false);
        }
    };

    const onAction = (a: CampaignAction) => {
        switch (a) {
            case 'cancel':
                setDialog('cancel');
                break;
            case 'delete':
                setDialog('delete');
                break;
            case 'reschedule':
                setDate(broadcast?.scheduledAt ? isoDate(broadcast.scheduledAt) : isoDate(Date.now() + 86_400_000));
                setDialog('reschedule');
                break;
            case 'sendnow':
                run(async () => {
                    await updateBroadcast({ id: broadcastId, status: 'SENDING' });
                    toast.success('Envoi de la campagne lancé.');
                });
                break;
            case 'duplicate':
                run(async () => {
                    const newId = await duplicateBroadcast({ id: broadcastId });
                    toast.success('Campagne dupliquée.');
                    if (newId) router.push(`/dashboard/campagnes/${newId}`);
                });
                break;
            case 'retry':
                run(async () => {
                    const res = await retryFailed({ broadcastId });
                    toast.success(`${res?.retriedCount ?? 0} message(s) relancé(s).`);
                });
                break;
            case 'pause':
                run(async () => {
                    await pauseBroadcast({ id: broadcastId });
                    toast.success('Campagne mise en pause.');
                });
                break;
            case 'resume':
                run(async () => {
                    await resumeBroadcast({ id: broadcastId });
                    toast.success("Reprise de l'envoi.");
                });
                break;
            case 'edit':
                router.push(`/dashboard/campagnes?edit=${broadcastId}`);
                break;
            case 'compare':
                toast.info('La comparaison de campagnes arrive bientôt.');
                break;
        }
    };

    const confirmCancel = () =>
        run(async () => {
            await updateBroadcast({ id: broadcastId, status: 'CANCELLED' });
            toast.success('Campagne annulée.');
            setDialog(null);
        });

    const confirmDelete = () =>
        run(async () => {
            await deleteBroadcast({ id: broadcastId });
            toast.success('Brouillon supprimé.');
            back();
        });

    const confirmReschedule = () =>
        run(async () => {
            const scheduledAt = new Date(`${date}T${time}`).getTime();
            await updateBroadcast({ id: broadcastId, scheduledAt, status: 'SCHEDULED' });
            toast.success('Campagne replanifiée.');
            setDialog(null);
        });

    if (broadcast === undefined) {
        return (
            <div className="flex h-full items-center justify-center bg-[var(--paper-white)]">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-300)]" />
            </div>
        );
    }

    if (broadcast === null) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--paper-white)] text-center">
                <p className="text-[14px] text-[var(--ink-500)]">Campagne introuvable.</p>
                <button
                    type="button"
                    onClick={back}
                    className="inline-flex h-9 items-center rounded-lg border border-[var(--ink-200)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                >
                    Retour aux campagnes
                </button>
            </div>
        );
    }

    const data = mapCampaignDetail(
        broadcast as unknown as BroadcastDetailDoc,
        activity as unknown as BroadcastActivityEvent[] | undefined,
    );
    const detailRole = role === 'AGENT' || role === 'ADMIN' || role === 'OWNER' ? role : 'OWNER';

    return (
        <>
            <CampaignDetailScreen data={data} role={detailRole} onBack={back} onAction={onAction} />

            {/* Cancel / delete confirmation */}
            <AlertDialog open={dialog === 'cancel' || dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)}>
                <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[440px]">
                    <AlertDialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Action irréversible
                        </p>
                        <AlertDialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            {dialog === 'delete' ? 'Supprimer ce brouillon ?' : 'Annuler la campagne ?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            {dialog === 'delete'
                                ? `« ${data.name} » sera définitivement supprimée.`
                                : `L'envoi de « ${data.name} » sera arrêté immédiatement. Les messages déjà partis ne peuvent pas être rappelés.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-3.5">
                        <AlertDialogCancel className="mt-0 h-auto rounded-md border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]">
                            Retour
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={busy}
                            onClick={dialog === 'delete' ? confirmDelete : confirmCancel}
                            className="h-auto rounded-md bg-[var(--status-danger)] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--status-danger)]/90"
                        >
                            {dialog === 'delete' ? 'Supprimer définitivement' : 'Annuler la campagne'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reschedule */}
            <Dialog open={dialog === 'reschedule'} onOpenChange={(o) => !o && setDialog(null)}>
                <DialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[460px]">
                    <DialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Planification
                        </p>
                        <DialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Modifier la planification
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            Choisissez la nouvelle date et heure de démarrage (Europe/Paris).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 px-6 py-5">
                        <label className="block">
                            <span className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">Date</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 font-mono text-[13px] text-[var(--ink-900)] outline-none focus:border-[var(--accent)]"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">Heure</span>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 font-mono text-[13px] text-[var(--ink-900)] outline-none focus:border-[var(--accent)]"
                            />
                        </label>
                    </div>
                    <DialogFooter className="flex-row justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-3.5">
                        <button
                            type="button"
                            onClick={() => setDialog(null)}
                            className="inline-flex h-9 items-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            disabled={busy || !date}
                            onClick={confirmReschedule}
                            className="inline-flex h-9 items-center rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ink-700)] disabled:opacity-50"
                        >
                            Replanifier
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
