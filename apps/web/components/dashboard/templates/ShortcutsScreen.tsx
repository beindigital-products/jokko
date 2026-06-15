"use client"

import { useRef, useState, type ReactNode } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import {
    FileText,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    Video,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { Chip, type ChipTone } from "../primitives/Chip"
import { Pagination } from "../primitives/Pagination"
import { TemplatesTabs, type TemplatesTab } from "./TemplatesTabs"

// ── Shortcut type metadata ──────────────────────────────────────────────────

type ShortcutType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"

const SHORTCUT_TYPES: { key: ShortcutType; label: string }[] = [
    { key: "TEXT", label: "Texte" },
    { key: "IMAGE", label: "Image" },
    { key: "VIDEO", label: "Vidéo" },
    { key: "DOCUMENT", label: "Document" },
]

const TYPE_TONE: Record<ShortcutType, ChipTone> = {
    TEXT: "neutral",
    IMAGE: "accent",
    VIDEO: "warn",
    DOCUMENT: "good",
}

function typeIcon(type: ShortcutType) {
    switch (type) {
        case "IMAGE":
            return <ImageIcon className="h-3 w-3" />
        case "VIDEO":
            return <Video className="h-3 w-3" />
        case "DOCUMENT":
            return <FileText className="h-3 w-3" />
        default:
            return null
    }
}

function normalizeType(type?: string): ShortcutType {
    return type === "IMAGE" || type === "VIDEO" || type === "DOCUMENT" ? type : "TEXT"
}

// ── Lightweight v3 form controls (mirrors TemplateCreateModal) ───────────────

const FIELD_CLS =
    "w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13px] text-[var(--ink-900)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"

function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: ReactNode
}) {
    return (
        <label className="block">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">{label}</span>
            </div>
            {children}
            {hint ? <p className="mt-1 text-[10.5px] text-[var(--ink-soft)]">{hint}</p> : null}
        </label>
    )
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(FIELD_CLS, "h-9", props.className)} />
}

// ── Create / edit form state ────────────────────────────────────────────────

interface FormState {
    shortcut: string
    text: string
    type: ShortcutType
    mediaStorageId: Id<"_storage"> | undefined
}

const EMPTY_FORM: FormState = {
    shortcut: "",
    text: "",
    type: "TEXT",
    mediaStorageId: undefined,
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ShortcutsScreenProps {
    tab: TemplatesTab
    onTab: (t: TemplatesTab) => void
    canEdit?: boolean
}

/**
 * ShortcutsScreen — v3 "Réponses rapides" page. Self-contained: owns its
 * Convex data (shortcuts list + CRUD + media upload). Mirrors TemplatesScreen's
 * shell (PageHeader + TemplatesTabs + v3 table + loadMore pagination) and ports
 * the proven wiring from the legacy ShortcutList.
 */
export function ShortcutsScreen({ tab, onTab, canEdit = true }: ShortcutsScreenProps) {
    const [search, setSearch] = useState("")

    const {
        results: shortcuts,
        status,
        loadMore,
        isLoading,
    } = usePaginatedQuery(
        api.shortcuts.list,
        { search: search || undefined },
        { initialNumItems: 30 },
    )

    const createShortcut = useMutation(api.shortcuts.create)
    const updateShortcut = useMutation(api.shortcuts.update)
    const deleteShortcut = useMutation(api.shortcuts.deleteShortcut)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<Id<"shortcuts"> | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Delete confirmation
    const [toDelete, setToDelete] = useState<Doc<"shortcuts"> | null>(null)

    const total = shortcuts.length
    const firstPageLoading = status === "LoadingFirstPage"

    function resetForm() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setSelectedFile(null)
    }

    function openCreate() {
        resetForm()
        setModalOpen(true)
    }

    function openEdit(s: Doc<"shortcuts">) {
        setEditingId(s._id)
        setForm({
            shortcut: s.shortcut,
            text: s.text ?? "",
            type: normalizeType(s.type),
            mediaStorageId: s.mediaStorageId,
        })
        setSelectedFile(null)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        resetForm()
    }

    function handleShortcutChange(value: string) {
        // Auto-prefix "/" and lowercase, matching the legacy + backend behavior.
        let next = value.toLowerCase().trimStart()
        if (next && !next.startsWith("/")) next = "/" + next
        setForm((prev) => ({ ...prev, shortcut: next }))
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) setSelectedFile(file)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            let storageId = form.mediaStorageId

            if (selectedFile) {
                const postUrl = await generateUploadUrl()
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                })
                if (!result.ok) throw new Error("Échec de l'envoi du fichier")
                const { storageId: newStorageId } = await result.json()
                storageId = newStorageId
            }

            if (editingId) {
                await updateShortcut({
                    id: editingId,
                    shortcut: form.shortcut,
                    text: form.text,
                    type: form.type,
                    mediaStorageId: storageId,
                })
                toast.success("Réponse rapide mise à jour")
            } else {
                await createShortcut({
                    shortcut: form.shortcut,
                    text: form.text,
                    type: form.type,
                    mediaStorageId: storageId,
                })
                toast.success("Réponse rapide créée")
            }
            closeModal()
        } catch (error) {
            console.error(error)
            const message = error instanceof Error ? error.message : "Une erreur est survenue"
            toast.error(message)
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        if (!toDelete) return
        try {
            await deleteShortcut({ id: toDelete._id })
            toast.success("Réponse rapide supprimée")
            setToDelete(null)
        } catch (error) {
            console.error(error)
            const message =
                error instanceof Error ? error.message : "Erreur lors de la suppression"
            toast.error(message)
        }
    }

    const showEmpty = !firstPageLoading && total === 0

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Données · ${total} réponse${total > 1 ? "s" : ""}`}
                title="Réponses rapides"
                description="Raccourcis de réponse rapide insérés dans le composer avec « / ». Texte ou média."
                actions={
                    canEdit ? (
                        <HeaderButton icon={Plus} variant="primary" onClick={openCreate}>
                            Nouvelle réponse
                        </HeaderButton>
                    ) : undefined
                }
            />

            {/* View switch (Modèles ↔ Réponses rapides) */}
            <div className="border-b border-[var(--ink-200)] px-4 py-2.5 sm:px-8">
                <TemplatesTabs tab={tab} onTab={onTab} />
            </div>

            {/* Toolbar — search */}
            <div className="border-b border-[var(--ink-200)] px-4 py-2.5 sm:px-8">
                <div className="flex min-w-[220px] max-w-md items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un raccourci…"
                        aria-label="Rechercher une réponse rapide"
                        className="flex-1 bg-transparent text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none"
                    />
                    {search ? (
                        <button type="button" onClick={() => setSearch("")} aria-label="Effacer">
                            <X className="h-3.5 w-3.5 text-[var(--ink-400)] hover:text-[var(--ink-700)]" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-auto">
                {firstPageLoading ? (
                    <div className="space-y-2 px-4 py-4 sm:px-8">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : showEmpty ? (
                    <div className="px-4 py-6 sm:px-8">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-16 text-center">
                            <p className="font-display text-[16px] text-[var(--ink-900)]">
                                Aucune réponse rapide
                            </p>
                            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--ink-soft)]">
                                {search
                                    ? "Aucun résultat pour votre recherche."
                                    : "Créez des raccourcis pour répondre plus vite avec « / » dans le composer."}
                            </p>
                            {canEdit && !search ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ink-700)]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Nouvelle réponse
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--ink-200)] bg-[var(--paper-warm)]">
                                <th className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)] sm:px-8">
                                    Raccourci
                                </th>
                                <th className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                                    Type
                                </th>
                                <th className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                                    Contenu
                                </th>
                                {canEdit ? (
                                    <th className="px-4 py-2.5 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)] sm:px-8">
                                        Actions
                                    </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {shortcuts.map((s) => {
                                const type = normalizeType(s.type)
                                return (
                                    <tr
                                        key={s._id}
                                        className="border-b border-[var(--ink-100)] transition-colors hover:bg-[var(--paper-warm)]"
                                    >
                                        <td className="px-4 py-3 align-middle sm:px-8">
                                            <span className="font-mono text-[13px] font-medium text-[var(--accent)]">
                                                {s.shortcut}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <Chip tone={TYPE_TONE[type]}>
                                                {typeIcon(type)}
                                                {type}
                                            </Chip>
                                        </td>
                                        <td className="max-w-[420px] px-4 py-3 align-middle">
                                            {s.text ? (
                                                <span
                                                    className="block truncate text-[13px] text-[var(--ink-700)]"
                                                    title={s.text}
                                                >
                                                    {s.text}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] italic text-[var(--ink-soft)]">
                                                    Sans texte
                                                </span>
                                            )}
                                        </td>
                                        {canEdit ? (
                                            <td className="px-4 py-3 align-middle sm:px-8">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        aria-label="Modifier"
                                                        onClick={() => openEdit(s)}
                                                        className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-400)] transition-colors hover:bg-[var(--paper-white)] hover:text-[var(--ink-700)]"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Supprimer"
                                                        onClick={() => setToDelete(s)}
                                                        className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-400)] transition-colors hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)]"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}

                {!showEmpty && !firstPageLoading ? (
                    <Pagination
                        mode="loadMore"
                        hasMore={status === "CanLoadMore"}
                        loading={isLoading}
                        onLoadMore={() => loadMore(30)}
                        label="Charger plus de réponses"
                        className="px-8 py-3"
                    />
                ) : null}
            </div>

            {/* Create / edit modal (v3 shell) */}
            {modalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={closeModal}
                        className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1px]"
                    />

                    <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-xl">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                            <div>
                                <h2 className="font-display text-[18px] text-[var(--ink-900)]">
                                    {editingId ? "Modifier la réponse" : "Nouvelle réponse rapide"}
                                </h2>
                                <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)]">
                                    Définissez un raccourci et son contenu (texte ou média).
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Fermer"
                                onClick={closeModal}
                                className="-mr-1 rounded-lg p-1.5 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <form
                            id="shortcut-form"
                            onSubmit={handleSubmit}
                            className="space-y-5 overflow-y-auto px-6 py-5"
                        >
                            <Field
                                label="Raccourci"
                                hint="Commence par « / » pour l'insérer facilement dans le composer."
                            >
                                <TextField
                                    value={form.shortcut}
                                    onChange={(e) => handleShortcutChange(e.target.value)}
                                    placeholder="/intro"
                                    required
                                    className="font-mono"
                                />
                            </Field>

                            <Field label="Type de contenu">
                                <div className="inline-flex w-full items-center gap-0.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-0.5">
                                    {SHORTCUT_TYPES.map((t) => {
                                        const active = form.type === t.key
                                        return (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() =>
                                                    setForm((prev) => ({ ...prev, type: t.key }))
                                                }
                                                aria-pressed={active}
                                                className={cn(
                                                    "flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                                                    active
                                                        ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                                                        : "text-[var(--ink-soft)] hover:text-[var(--ink-700)]",
                                                )}
                                            >
                                                {typeIcon(t.key)}
                                                {t.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </Field>

                            {form.type !== "TEXT" ? (
                                <Field label="Fichier média">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors",
                                            selectedFile
                                                ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                                                : "border-[var(--ink-200)] bg-[var(--paper-warm)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]",
                                        )}
                                    >
                                        {selectedFile ? (
                                            <>
                                                <p className="text-[13px] font-medium text-[var(--accent)]">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </>
                                        ) : form.mediaStorageId ? (
                                            <>
                                                <p className="text-[13px] font-medium text-[var(--ink-700)]">
                                                    Fichier existant
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">
                                                    Cliquez pour remplacer
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--paper-warm)] text-[var(--ink-400)]">
                                                    <Upload className="h-5 w-5" />
                                                </span>
                                                <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                                                    Cliquez pour sélectionner un fichier
                                                </p>
                                            </>
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept={
                                            form.type === "IMAGE"
                                                ? "image/*"
                                                : form.type === "VIDEO"
                                                  ? "video/*"
                                                  : "*/*"
                                        }
                                        onChange={handleFileSelect}
                                    />
                                </Field>
                            ) : null}

                            <Field label={form.type === "TEXT" ? "Texte" : "Légende (optionnel)"}>
                                <textarea
                                    value={form.text}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, text: e.target.value }))
                                    }
                                    placeholder={
                                        form.type === "TEXT"
                                            ? "Le texte à insérer…"
                                            : "Ajouter une légende…"
                                    }
                                    required={form.type === "TEXT"}
                                    className={cn(FIELD_CLS, "h-28 resize-none py-2 leading-relaxed")}
                                />
                            </Field>
                        </form>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-[var(--ink-100)] bg-[var(--paper-warm)]/50 px-6 py-3.5">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                form="shortcut-form"
                                disabled={submitting}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Delete confirmation */}
            <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[420px]">
                    <AlertDialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-danger-soft)]">
                            <Trash2 className="h-5 w-5 text-[var(--status-danger)]" />
                        </div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Réponses rapides · suppression
                        </p>
                        <AlertDialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Supprimer cette réponse rapide ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            Le raccourci
                            {toDelete?.shortcut ? (
                                <span className="font-mono font-medium text-[var(--ink-700)]">
                                    {" "}
                                    {toDelete.shortcut}{" "}
                                </span>
                            ) : (
                                " sélectionné "
                            )}
                            sera retiré du composer. Cette action est définitive.
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
    )
}
