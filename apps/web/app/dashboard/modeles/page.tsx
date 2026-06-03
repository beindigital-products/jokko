'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePaginatedQuery, useQuery, useMutation, useAction } from 'convex/react';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type { TemplateType } from '@/convex/lib/templateTypes';
import {
    TemplatesScreen,
    ShortcutsScreen,
    type TemplateRowData,
    type TemplatesTab,
} from '@/components/dashboard/templates';
import type { TemplateCreatePayload } from '@/components/dashboard/templates/TemplateCreateModal';
import { mapTemplatesData, type TemplateDoc } from '@/lib/dashboard/templates-data';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { usePermission } from '@/hooks/use-permission';
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

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erreur inconnue';
}

/** Map a finished v3 draft into the Convex `templates.create` args. */
function payloadToCreateArgs(payload: TemplateCreatePayload) {
    const buttons = payload.buttons.map((b) => ({
        type: b.type,
        text: b.text,
        ...(b.type === 'URL' && b.value ? { url: b.value } : {}),
        ...((b.type === 'PHONE_NUMBER' || b.type === 'VOICE_CALL') && b.value
            ? { phoneNumber: b.value }
            : {}),
        ...(b.type === 'COPY_CODE' && b.value ? { payload: b.value } : {}),
    }));
    return {
        name: payload.name,
        language: payload.language,
        category: payload.category,
        type: payload.type,
        header: payload.header ? { type: payload.header.type, text: payload.header.text } : undefined,
        body: payload.body,
        footer: payload.footer,
        buttons: buttons.length ? buttons : undefined,
    };
}

type BuilderState = { type: TemplateType; templateId: string | null };

export default function TemplatesPage() {
    const router = useRouter();
    const [tab, setTab] = useState<TemplatesTab>('templates');
    const [builder, setBuilder] = useState<BuilderState | null>(null);
    const [toDelete, setToDelete] = useState<TemplateRowData | null>(null);
    const [syncing, setSyncing] = useState(false);

    const canEdit = usePermission('templates:create');

    const { results, status } = usePaginatedQuery(
        api.templates.queries.list,
        {},
        { initialNumItems: 50 },
    );
    const docs = (results ?? []) as unknown as TemplateDoc[];
    const data = mapTemplatesData(docs);

    const createTemplate = useMutation(api.templates.mutations.create);
    const deleteTemplate = useMutation(api.templates.mutations.deleteTemplate);
    const submitToMeta = useAction(api.templates.actions.submitToMeta);
    const syncFromMeta = useAction(api.templates.actions.syncFromMeta);

    const handleCreate = async (payload: TemplateCreatePayload, { submit }: { submit: boolean }) => {
        try {
            const id = await createTemplate(payloadToCreateArgs(payload));
            if (submit && id) {
                try {
                    await submitToMeta({ templateId: id });
                } catch (error) {
                    console.error('submitToMeta failed', error);
                    alert(`Brouillon créé. La soumission à Meta a échoué : ${getErrorMessage(error)}`);
                }
            }
        } catch (error) {
            console.error(error);
            alert(`Erreur : ${getErrorMessage(error)}`);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncFromMeta();
            if (res?.message) alert(res.message);
        } catch (error) {
            console.error(error);
            alert(`Synchronisation impossible : ${getErrorMessage(error)}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleEdit = (template: TemplateRowData) => {
        const doc = docs.find((d) => d._id === template.id);
        if (doc?.type) setBuilder({ type: doc.type as TemplateType, templateId: template.id });
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await deleteTemplate({ id: toDelete.id as Id<'templates'> });
            setToDelete(null);
        } catch (error) {
            console.error(error);
            alert(`Suppression impossible : ${getErrorMessage(error)}`);
        }
    };

    // Advanced types + edits drop to the proven legacy builder (full-page).
    if (builder) {
        return (
            <div className="h-full overflow-y-auto bg-[var(--paper-white)] px-4 py-6 sm:px-8">
                <button
                    type="button"
                    onClick={() => setBuilder(null)}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour aux modèles
                </button>
                <BuilderWrapper
                    type={builder.type}
                    templateId={builder.templateId}
                    onSuccess={() => setBuilder(null)}
                    onCancel={() => setBuilder(null)}
                />
            </div>
        );
    }

    return (
        <div className="h-full">
            {tab === 'shortcuts' ? (
                <ShortcutsScreen tab={tab} onTab={setTab} canEdit={canEdit} />
            ) : status === 'LoadingFirstPage' ? (
                <div className="flex h-full items-center justify-center bg-[var(--paper-white)]">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-300)]" />
                </div>
            ) : (
                <TemplatesScreen
                    data={data}
                    canEdit={canEdit}
                    tab={tab}
                    onTab={setTab}
                    syncing={syncing}
                    onSync={handleSync}
                    onCreate={handleCreate}
                    onAdvanced={(type) => setBuilder({ type, templateId: null })}
                    onEdit={handleEdit}
                    onDelete={(template) => setToDelete(template)}
                    onUse={() => router.push('/dashboard/conversations')}
                />
            )}

            <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[420px]">
                    <AlertDialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-danger-soft)]">
                            <Trash2 className="h-5 w-5 text-[var(--status-danger)]" />
                        </div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Modèles · suppression
                        </p>
                        <AlertDialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Supprimer ce modèle ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            Le modèle
                            {toDelete?.name ? (
                                <span className="font-medium text-[var(--ink-700)]"> {toDelete.name} </span>
                            ) : (
                                ' sélectionné '
                            )}
                            sera retiré de votre annuaire. Cette action est définitive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-3.5">
                        <AlertDialogCancel className="mt-0 h-auto rounded-md border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="h-auto rounded-md bg-[var(--status-danger)] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--status-danger)]/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/** Loads the template (for edit) then renders the legacy builder. */
function BuilderWrapper({
    type,
    templateId,
    onSuccess,
    onCancel,
}: {
    type: TemplateType;
    templateId: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const data = useQuery(
        api.templates.queries.get,
        templateId ? { id: templateId as Id<'templates'> } : 'skip',
    );

    if (templateId && data === undefined) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-300)]" />
            </div>
        );
    }

    return <TemplateBuilder type={type} initialData={data} onSuccess={onSuccess} onCancel={onCancel} />;
}
