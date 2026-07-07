'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { ArrowRight, Search, User } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useCommandPalette } from '@/lib/stores/command-palette-store'

type Row = { id: string; label: string; href: string; kind: 'page' | 'contact' }

/**
 * Global ⌘K command palette. Replaces the old fake search badge (which merely
 * navigated to /conversations) with a real search over contacts + pages backed
 * by api.search.searchGlobal. Opened by ⌘K / Ctrl+K anywhere in the dashboard,
 * or by the sidebar search button (both drive the shared store). Mounted once
 * in the dashboard shell.
 */
export function CommandPalette() {
    const { open, setOpen, toggle } = useCommandPalette()
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [debounced, setDebounced] = useState('')
    const [highlight, setHighlight] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    // Global ⌘K / Ctrl+K toggle.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                toggle()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [toggle])

    // Debounce input into the Convex query.
    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 150)
        return () => clearTimeout(t)
    }, [query])

    // Reset on close.
    useEffect(() => {
        if (!open) {
            setQuery('')
            setDebounced('')
            setHighlight(0)
        }
    }, [open])

    const results = useQuery(api.search.searchGlobal, debounced ? { query: debounced } : 'skip')
    const rows: Row[] = [
        ...(results?.pages ?? []).map((p) => ({ id: p.id, label: p.name, href: p.link, kind: 'page' as const })),
        ...(results?.contacts ?? []).map((c) => ({ id: c.id, label: c.name, href: c.link, kind: 'contact' as const })),
    ]

    useEffect(() => setHighlight(0), [debounced])

    const go = (href: string) => {
        setOpen(false)
        router.push(href)
    }

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => Math.min(h + 1, Math.max(rows.length - 1, 0)))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => Math.max(h - 1, 0))
        } else if (e.key === 'Enter' && rows[highlight]) {
            e.preventDefault()
            go(rows[highlight].href)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                showCloseButton={false}
                className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl border-[var(--border)] bg-[var(--paper-white)]"
            >
                <DialogTitle className="sr-only">Recherche globale</DialogTitle>
                <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
                    <Search className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" aria-hidden />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        placeholder="Rechercher un contact, une page…"
                        aria-label="Rechercher"
                        className="h-12 flex-1 bg-transparent text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-soft)]"
                    />
                    <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-soft)] sm:inline">
                        Échap
                    </kbd>
                </div>

                <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                    {!debounced && (
                        <p className="px-3 py-6 text-center text-xs text-[var(--ink-soft)]">
                            Tapez pour rechercher un contact ou une page.
                        </p>
                    )}
                    {debounced && rows.length === 0 && (
                        <p className="px-3 py-6 text-center text-xs text-[var(--ink-soft)]">
                            Aucun résultat pour «&nbsp;{debounced}&nbsp;».
                        </p>
                    )}
                    {rows.map((r, i) => {
                        const Icon = r.kind === 'contact' ? User : ArrowRight
                        return (
                            <button
                                key={`${r.kind}-${r.id}`}
                                onClick={() => go(r.href)}
                                onMouseEnter={() => setHighlight(i)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    i === highlight
                                        ? 'bg-[var(--accent-muted)] text-[var(--ink-900)]'
                                        : 'text-[var(--ink-700)] hover:bg-[var(--paper-warm)]'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" aria-hidden />
                                <span className="flex-1 truncate">{r.label}</span>
                                <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                                    {r.kind === 'contact' ? 'Contact' : 'Page'}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
