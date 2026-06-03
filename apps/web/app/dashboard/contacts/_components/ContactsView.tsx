"use client"

import { useMemo, useState } from "react"
import {
    ArrowUpDown,
    Download,
    LayoutGrid,
    Plus,
    Search,
    Table2,
    Tag as TagIcon,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ContactsGrid, ContactsTable, type ContactsTableEntry } from "@/components/dashboard/contacts"
import { Pagination } from "@/components/dashboard/primitives"
import { HeaderButton } from "@/components/dashboard/shell/HeaderButton"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { contactDisplayName, mapContactToEntry } from "@/lib/dashboard/contacts-data"
import type { Contact } from "@/components/contacts/ContactCard"
import type { Tag } from "@/components/contacts/ContactList"

type ViewMode = "table" | "cards"
type Sort = "recent" | "old" | "name"

const SORT_LABELS: Record<Sort, string> = {
    recent: "Plus récents",
    old: "Plus anciens",
    name: "Nom (A-Z)",
}

export interface ContactsViewProps {
    contacts: Contact[]
    tags: Tag[]
    total: number
    isLoading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    onSearch?: (query: string) => void
    onFilterByTag?: (tagName: string | null) => void
    onEdit?: (contact: Contact) => void
    onDelete?: (contact: Contact) => void
    onMessage?: (contact: Contact) => void
    onContactClick?: (contact: Contact) => void
    onAddNew?: () => void
    onImport?: () => void
    onExportSelected?: (contacts: Contact[]) => void
    onBulkDelete?: (contactIds: string[]) => void
    onBulkAddTag?: (contactIds: string[], tagName: string) => void
    canDelete?: boolean
    canExport?: boolean
}

/**
 * buildEntries — sorts + maps the loaded contacts to v3 table/grid entries.
 * Module-scope so the `Date.now()` read (relative "added" time) stays out of
 * the component render body (mirrors the other page builders).
 */
function buildEntries(contacts: Contact[], sort: Sort): ContactsTableEntry[] {
    const now = Date.now()
    const ts = (c: Contact) => new Date(c.createdAt).getTime()
    const sorted = [...contacts]
    if (sort === "recent") sorted.sort((a, b) => ts(b) - ts(a))
    else if (sort === "old") sorted.sort((a, b) => ts(a) - ts(b))
    else sorted.sort((a, b) => contactDisplayName(a).localeCompare(contactDisplayName(b), "fr"))
    return sorted.map((c) =>
        mapContactToEntry(
            {
                id: c.id,
                phone: c.phone,
                name: c.name,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                tags: c.tags,
                createdAt: ts(c),
            },
            now,
        ),
    )
}

/**
 * ContactsView — v3 (Cobalt × paper × ink) body of the Contacts page: a
 * toolbar (search / sort / tag filter / view toggle / actions), the table or
 * card disposition with always-on selection, a bulk action bar, and a
 * load-more footer. Same props as the legacy ContactList — drop-in for the page.
 */
export function ContactsView({
    contacts,
    tags,
    total,
    isLoading,
    hasMore,
    onLoadMore,
    onSearch,
    onFilterByTag,
    onMessage,
    onContactClick,
    onAddNew,
    onImport,
    onExportSelected,
    onBulkDelete,
    onBulkAddTag,
    canDelete,
    canExport,
}: ContactsViewProps) {
    const [search, setSearch] = useState("")
    const [view, setView] = useState<ViewMode>("table")
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [sort, setSort] = useState<Sort>("recent")
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const entries = useMemo(() => buildEntries(contacts, sort), [contacts, sort])
    const byId = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])

    const handleSearch = (value: string) => {
        setSearch(value)
        onSearch?.(value)
    }

    const pickTag = (name: string | null) => {
        setActiveTag(name)
        onFilterByTag?.(name)
    }

    const toggleSelect = (id: string, sel: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev)
            if (sel) next.add(id)
            else next.delete(id)
            return next
        })

    const openContact = (id: string) => {
        const c = byId.get(id)
        if (c) onContactClick?.(c)
    }

    const clearSelection = () => setSelected(new Set())
    const selectedContacts = contacts.filter((c) => selected.has(c.id))

    const showEmpty = !isLoading && contacts.length === 0
    const hasFilters = !!search || !!activeTag

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                        <Search className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                        <input
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Rechercher par nom, numéro, email…"
                            className="flex-1 bg-transparent text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none"
                        />
                        {search ? (
                            <button type="button" onClick={() => handleSearch("")} aria-label="Effacer">
                                <X className="h-3.5 w-3.5 text-[var(--ink-400)] hover:text-[var(--ink-700)]" />
                            </button>
                        ) : null}
                    </div>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 text-[12.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                            >
                                <ArrowUpDown className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                                {SORT_LABELS[sort]}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                                <DropdownMenuItem key={s} onClick={() => setSort(s)} className="cursor-pointer text-[13px]">
                                    {SORT_LABELS[s]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tag filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium",
                                    activeTag
                                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                        : "border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
                                )}
                            >
                                <TagIcon className="h-3.5 w-3.5" />
                                {activeTag ?? "Tous les tags"}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto">
                            <DropdownMenuItem onClick={() => pickTag(null)} className="cursor-pointer text-[13px]">
                                Tous les tags
                            </DropdownMenuItem>
                            {tags.length > 0 ? <DropdownMenuSeparator /> : null}
                            {tags.map((t) => (
                                <DropdownMenuItem
                                    key={t.id}
                                    onClick={() => pickTag(t.name)}
                                    className="cursor-pointer gap-2 text-[13px]"
                                >
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: t.color }}
                                    />
                                    {t.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View toggle */}
                    <div className="flex items-center gap-0.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-0.5">
                        {([
                            { key: "table" as const, icon: Table2, label: "Tableau" },
                            { key: "cards" as const, icon: LayoutGrid, label: "Cartes" },
                        ]).map((v) => (
                            <button
                                key={v.key}
                                type="button"
                                onClick={() => setView(v.key)}
                                aria-label={v.label}
                                aria-pressed={view === v.key}
                                className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded transition-colors",
                                    view === v.key
                                        ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                                        : "text-[var(--ink-400)] hover:text-[var(--ink-700)]",
                                )}
                            >
                                <v.icon className="h-3.5 w-3.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Count line */}
            {!showEmpty ? (
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    <span>
                        {contacts.length} affiché{contacts.length > 1 ? "s" : ""} · {total} au total
                    </span>
                    {selected.size > 0 ? (
                        <span className="text-[var(--accent)]">· {selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
                    ) : null}
                </div>
            ) : null}

            {/* Body */}
            {isLoading && contacts.length === 0 ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                </div>
            ) : showEmpty ? (
                <Empty className="border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)]/40">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>
                            {hasFilters ? "Aucun contact" : "Votre annuaire est vide."}
                        </EmptyTitle>
                        <EmptyDescription>
                            {hasFilters
                                ? "Aucun contact ne correspond à vos critères."
                                : "Importez vos contacts depuis un CRM ou un fichier CSV — ou laissez-les se créer au fil des conversations."}
                        </EmptyDescription>
                    </EmptyHeader>
                    {!hasFilters ? (
                        <EmptyContent>
                            <HeaderButton icon={Plus} variant="primary" onClick={onAddNew}>
                                Ajouter un contact
                            </HeaderButton>
                            <HeaderButton icon={Upload} onClick={onImport}>
                                Importer
                            </HeaderButton>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : view === "table" ? (
                <ContactsTable
                    entries={entries}
                    selectedIds={selected}
                    onToggleSelect={toggleSelect}
                    onRowClick={openContact}
                    onRowMore={openContact}
                />
            ) : (
                <ContactsGrid
                    entries={entries}
                    selectedIds={selected}
                    onToggleSelect={toggleSelect}
                    onCardClick={openContact}
                    onCardMore={openContact}
                />
            )}

            {/* Load more */}
            {!showEmpty ? (
                <Pagination
                    mode="loadMore"
                    hasMore={hasMore}
                    loading={isLoading}
                    onLoadMore={onLoadMore}
                    label="Charger plus de contacts"
                    className="pt-1"
                />
            ) : null}

            {/* Bulk action bar */}
            {selected.size > 0 ? (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
                    <div className="flex items-center gap-1 rounded-full border border-[var(--ink-700)] bg-[var(--ink-900)] px-3 py-2 text-white shadow-xl">
                        <span className="whitespace-nowrap px-1.5 text-[12px] font-medium">
                            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                        </span>
                        <span className="h-4 w-px bg-white/20" />
                        {canDelete && onBulkDelete ? (
                            <button
                                type="button"
                                onClick={() => onBulkDelete([...selected])}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-red-300 hover:bg-white/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </button>
                        ) : null}
                        {onBulkAddTag && tags.length > 0 ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-white/80 hover:bg-white/10"
                                    >
                                        <TagIcon className="h-3.5 w-3.5" /> Tag
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" side="top" className="mb-2">
                                    {tags.map((t) => (
                                        <DropdownMenuItem
                                            key={t.id}
                                            onClick={() => onBulkAddTag([...selected], t.name)}
                                            className="cursor-pointer gap-2 text-[13px]"
                                        >
                                            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                                            {t.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                        {canExport && onExportSelected ? (
                            <button
                                type="button"
                                onClick={() => onExportSelected(selectedContacts)}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-white/80 hover:bg-white/10"
                            >
                                <Download className="h-3.5 w-3.5" /> Exporter
                            </button>
                        ) : null}
                        {onMessage && selected.size === 1 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    const c = selectedContacts[0]
                                    if (c) onMessage(c)
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-white/80 hover:bg-white/10"
                            >
                                Message
                            </button>
                        ) : null}
                        <span className="h-4 w-px bg-white/20" />
                        <button
                            type="button"
                            onClick={clearSelection}
                            aria-label="Annuler la sélection"
                            className="rounded-full p-1.5 text-white/70 hover:bg-white/10"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
