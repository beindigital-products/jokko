'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Check, Trash2, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/dashboard/primitives/EmptyState';

/**
 * Notifications history — v3 (cobalt/paper/ink). Restyled from the legacy
 * gray/blue shadcn-Card version to match the rest of the dashboard.
 */
export default function NotificationsPage() {
    const router = useRouter();
    const notifications = useQuery(api.notifications.list);
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const clearAll = useMutation(api.notifications.clearAll);

    const formatTime = (date: number) => formatDistanceToNow(date, { addSuffix: true, locale: fr });

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        Alertes · historique
                    </p>
                    <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-[var(--ink-900)]">
                        Notifications
                    </h1>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        Historique de vos alertes et messages.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => markAllAsRead()} title="Tout marquer comme lu">
                        <Check className="mr-2 h-4 w-4" />
                        Tout lire
                    </Button>
                    <Button
                        variant="outline"
                        className="text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 hover:text-[var(--status-danger)]"
                        onClick={() => clearAll()}
                        title="Tout effacer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Effacer
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--paper-white)]">
                <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
                    <Bell className="h-5 w-5 text-[var(--ink-soft)]" />
                    <h2 className="text-sm font-semibold text-[var(--ink-900)]">Toutes les notifications</h2>
                </div>

                {!notifications ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-soft)]" />
                    </div>
                ) : notifications.length === 0 ? (
                    <EmptyState
                        illustration="bell"
                        dense
                        title="Boîte calme."
                        body="On vous préviendra ici dès qu'on a quelque chose à dire — mention dans une conversation, assignation, modèle approuvé."
                    />
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={cn(
                                    'flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-[var(--paper-warm)]',
                                    !notification.isRead && 'bg-[var(--accent-muted)]/50',
                                )}
                                onClick={() => {
                                    if (!notification.isRead) markAsRead({ notificationId: notification._id });
                                    if (notification.link) router.push(notification.link);
                                }}
                            >
                                <div
                                    className={cn(
                                        'mt-1 shrink-0 rounded-full p-2',
                                        !notification.isRead
                                            ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                                            : 'bg-[var(--paper-warm)] text-[var(--ink-soft)]',
                                    )}
                                >
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <p
                                            className={cn(
                                                'text-sm text-[var(--ink-900)]',
                                                !notification.isRead ? 'font-bold' : 'font-medium',
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <span className="whitespace-nowrap text-xs text-[var(--ink-soft)]">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-sm text-[var(--ink-700)]">
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
