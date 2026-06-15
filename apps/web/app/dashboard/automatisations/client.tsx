'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FeatureGate } from '@/components/plan/FeatureGate';
import { usePlanFeature } from '@/hooks/use-plan-feature';
import {
    AutomationsScreen,
    AutomationCreateModal,
    type AutomationCreateInput,
} from '@/components/dashboard/automations';
import { mapAutomationsData, type FlowDoc } from '@/lib/dashboard/automations-data';

export default function AutomationsClient() {
    const router = useRouter();
    const role = useQuery(api.users.currentUserRole);
    const flows = useQuery(api.flows.list);
    const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('flows');

    const createFlow = useMutation(api.flows.create);
    const updateFlow = useMutation(api.flows.update);
    const deleteFlow = useMutation(api.flows.deleteFlow);

    const [modalOpen, setModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [flowToDelete, setFlowToDelete] = useState<string | null>(null);

    const editGuided = (id: string) => router.push(`/dashboard/automatisations/${id}?mode=guided`);
    const editDiagram = (id: string) => router.push(`/dashboard/automatisations/${id}`);

    const handleCreate = async ({ name, triggerType, mode }: AutomationCreateInput) => {
        setCreating(true);
        try {
            const flowId = await createFlow({ name, triggerType });
            setModalOpen(false);
            if (mode === 'guided') editGuided(flowId);
            else editDiagram(flowId);
        } catch {
            toast.error("Impossible de créer l'automatisation");
            setCreating(false);
        }
    };

    const handleToggle = async (id: string) => {
        const flow = flows?.find((f) => f._id === id);
        if (!flow) return;
        try {
            await updateFlow({ flowId: id as Id<'flows'>, isActive: !flow.isActive });
            toast.success(flow.isActive ? 'Automatisation désactivée' : 'Automatisation activée');
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteFlow({ flowId: id as Id<'flows'> });
            toast.success('Automatisation supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setFlowToDelete(null);
        }
    };

    if (role === undefined || planLoading) {
        return (
            <div className="flex h-full w-full flex-col gap-6 p-8">
                <Skeleton className="h-16 w-72" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="max-w-md rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-8 text-center">
                    <h2 className="font-display text-lg font-bold text-[var(--ink-900)]">Accès restreint</h2>
                    <p className="mt-1.5 text-sm text-[var(--ink-500)]">
                        Les automatisations sont réservées aux administrateurs de l&apos;organisation.
                    </p>
                </div>
            </div>
        );
    }

    if (!planAllowed) {
        return (
            <div className="p-4 sm:p-8">
                <FeatureGate feature="flows">{null}</FeatureGate>
            </div>
        );
    }

    const data = mapAutomationsData((flows ?? []) as FlowDoc[]);

    return (
        <>
            <AutomationsScreen
                data={data}
                onNew={() => setModalOpen(true)}
                onOpen={editDiagram}
                onToggle={handleToggle}
                onEditGuided={editGuided}
                onEditDiagram={editDiagram}
                onDelete={(id) => setFlowToDelete(id)}
            />

            <AutomationCreateModal
                key={modalOpen ? 'open' : 'closed'}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onCreate={handleCreate}
                creating={creating}
            />

            <AlertDialog open={!!flowToDelete} onOpenChange={(open) => !open && setFlowToDelete(null)}>
                <AlertDialogContent className="bg-[var(--paper-white)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[var(--ink-900)]">Supprimer cette automatisation ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--ink-500)]">
                            Cette action est irréversible. Le flow et sa configuration seront définitivement supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => flowToDelete && handleDelete(flowToDelete)}
                            className="cursor-pointer bg-[var(--status-danger)] text-white hover:bg-[var(--status-danger)]/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
