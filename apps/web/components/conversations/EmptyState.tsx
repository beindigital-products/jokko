'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Image as ImageIcon, MessageSquare, Plug, Zap } from 'lucide-react'

import { useChannels } from '@/hooks/useChannels'

/**
 * Right-column empty state of the inbox. Two modes:
 * - No WhatsApp channel connected yet → guide the user to connect one (the most
 *   critical activation step; the dashboard was previously silent about it).
 * - Channel connected → the usual "pick a conversation" placeholder.
 * v3 tokens (cobalt/paper/ink) — replaces the old green gradient.
 */
export function EmptyState() {
    const { channels, isLoading } = useChannels()
    const hasActiveChannel = channels.some((c: { status?: string }) => c.status === 'active')
    const needsChannel = !isLoading && !hasActiveChannel

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col items-center justify-center bg-[var(--paper-white)] px-8 text-center"
        >
            <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
                    {needsChannel ? (
                        <Plug className="h-10 w-10 text-white" />
                    ) : (
                        <MessageSquare className="h-10 w-10 text-white" />
                    )}
                </div>
            </div>

            {needsChannel ? (
                <>
                    <h2 className="mb-2 text-xl font-bold tracking-tight text-[var(--ink-900)]">
                        Connectez votre premier numéro
                    </h2>
                    <p className="mb-8 max-w-xs text-sm text-[var(--ink-soft)]">
                        Reliez un compte WhatsApp Business pour commencer à recevoir et envoyer
                        des messages depuis Jokko.
                    </p>
                    <Link
                        href="/dashboard/settings?tab=whatsapp"
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                    >
                        <Plug className="h-4 w-4" />
                        Connecter WhatsApp
                    </Link>
                </>
            ) : (
                <>
                    <h2 className="mb-2 text-xl font-bold tracking-tight text-[var(--ink-900)]">
                        Jokko Inbox
                    </h2>
                    <p className="mb-8 max-w-xs text-sm text-[var(--ink-soft)]">
                        Sélectionnez une conversation pour commencer à discuter avec vos clients
                        via WhatsApp.
                    </p>

                    <div className="grid max-w-sm grid-cols-3 gap-3">
                        {[
                            { icon: Zap, label: 'Temps réel' },
                            { icon: ImageIcon, label: 'Médias' },
                            { icon: Clock, label: 'Historique' },
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)]/40 p-3"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-muted)]">
                                    <feature.icon className="h-4 w-4 text-[var(--accent)]" />
                                </div>
                                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                                    {feature.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    )
}
