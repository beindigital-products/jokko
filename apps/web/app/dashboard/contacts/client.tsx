'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type { Tag } from '@/components/contacts/ContactList';
import { ContactsView } from './_components/ContactsView';
import { Contact, ContactTag, getInitials } from '@/components/contacts/ContactCard';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import type { ContactFormSubmitData } from '@/components/contacts/ContactForm';
import { ImportDialog } from '@/components/contacts/ImportDialog';
import { DuplicatesDialog } from '@/components/contacts/DuplicatesDialog';
import { usePermission } from '@/hooks/use-permission';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Avatar as V3Avatar } from '@/components/dashboard/primitives/Avatar';
import { Chip } from '@/components/dashboard/primitives/Chip';
import { avatarColorFromString } from '@/lib/dashboard/avatar-color';
import { cn } from '@/lib/utils';
import {
    Phone,
    Mail,
    Building2,
    MapPin,
    Pencil,
    Trash2,
    MessageCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    ExternalLink,
} from 'lucide-react';
import { useCrmLink } from '@/hooks/use-crm-link';
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
import { formatPhoneDisplay } from '@/lib/contacts/validation';
import { PageHeader } from '@/components/dashboard/shell';

type RawContactTag = string | {
    id?: string;
    _id?: string;
    name?: string;
    color?: string;
} | null | undefined;

interface ContactNote {
    content: string;
    authorName?: string;
    createdAt: number;
}

interface ContactMutationError extends Error {
    data?: {
        code?: string;
        message?: string;
    };
}

function normalizeTag(tag: RawContactTag): ContactTag {
    if (typeof tag === 'string') {
        return { id: tag, name: tag, color: '#808080' };
    }
    if (!tag) {
        return { id: 'tag', name: 'Tag', color: '#808080' };
    }

    return {
        id: tag.id || tag._id || tag.name || 'tag',
        name: tag.name || tag.id || tag._id || 'Tag',
        color: tag.color || '#808080',
    };
}

function isContactNote(note: unknown): note is ContactNote {
    return typeof note === 'object' && note !== null && 'content' in note && 'createdAt' in note;
}

function getErrorMessage(error: unknown, fallback = 'Erreur inconnue'): string {
    return error instanceof Error ? error.message : fallback;
}

function isContactMutationError(error: unknown): error is ContactMutationError {
    return error instanceof Error && 'data' in error;
}

// ============================================
// RELATIVE TIME HELPER
// ============================================

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================
// CONTACT DETAIL DRAWER
// ============================================

function ContactDetailDrawer({
    contactId,
    onClose,
    onEdit,
    onDelete,
    onMessage,
}: {
    contactId: string;
    onClose: () => void;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    onMessage: (contact: Contact) => void;
}) {
    const contactData = useQuery(api.contacts.get, { id: contactId as Id<"contacts"> });
    const timeline = useQuery(api.contacts.getContactTimeline, { contactId: contactId as Id<"contacts"> });
    const crmLink = useCrmLink(contactId);

    if (!contactData) {
        return (
            <div className="flex h-full items-center justify-center bg-[var(--paper-white)]">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--ink-200)] border-t-[var(--accent)]" />
            </div>
        );
    }

    const displayName = contactData.name || [contactData.firstName, contactData.lastName].filter(Boolean).join(' ') || 'Sans nom';
    const initials = getInitials(contactData.name ?? null, contactData.firstName, contactData.lastName);
    const avatarColor = avatarColorFromString(displayName);
    const formattedPhone = formatPhoneDisplay(contactData.phone, 'international');

    // Build a Contact object for callbacks
    const contactForCallbacks: Contact = {
        id: contactData._id,
        phone: contactData.phone,
        name: contactData.name || null,
        firstName: contactData.firstName || null,
        lastName: contactData.lastName || null,
        email: contactData.email || null,
        company: contactData.company || null,
        jobTitle: contactData.jobTitle || null,
        countryCode: contactData.countryCode || null,
        address: contactData.address || null,
        city: contactData.city || null,
        country: contactData.country || null,
        notes: null,
        tags: (contactData.tags || []).map(normalizeTag),
        isWhatsApp: contactData.isWhatsApp || null,
        isBlocked: contactData.isBlocked || null,
        createdAt: contactData.createdAt,
    };

    const tags: ContactTag[] = contactForCallbacks.tags;

    const hasNoExtraInfo =
        !contactData.email && !contactData.company && !contactData.address && !contactData.city && !contactData.country;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[var(--paper-white)]">
            {/* Header */}
            <div className="border-b border-[var(--ink-200)] px-5 pb-4 pt-6">
                <div className="flex flex-col items-center text-center">
                    <V3Avatar
                        initials={initials}
                        color={avatarColor}
                        size="xl"
                        status={!contactData.isBlocked && contactData.isWhatsApp ? 'online' : undefined}
                    />
                    <h2 className="mt-3 text-[16px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                        {displayName}
                    </h2>
                    <p className="font-mono text-[11px] text-[var(--ink-soft)]">{formattedPhone}</p>
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                        {contactData.isBlocked ? <Chip tone="danger">Bloqué</Chip> : null}
                        {!contactData.isBlocked && contactData.isWhatsApp ? (
                            <Chip tone="good">WhatsApp</Chip>
                        ) : null}
                        {crmLink ? <Chip tone="warn">Sync · {crmLink.providerLabel}</Chip> : null}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => { onMessage(contactForCallbacks); onClose(); }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Message
                    </button>
                    {crmLink && crmLink.externalUrl ? (
                        <a
                            href={crmLink.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {crmLink.providerLabel}
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { onEdit(contactForCallbacks); onClose(); }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Éditer
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { onDelete(contactForCallbacks); onClose(); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] px-3 py-1.5 text-[12px] font-medium text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-soft)]"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                    </button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {/* Informations */}
                <section className="space-y-2.5">
                    <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Informations
                    </h3>
                    <div className="flex items-center gap-2.5 text-[13px]">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                        <span className="font-mono text-[var(--ink-700)]">{formattedPhone}</span>
                    </div>
                    {contactData.email ? (
                        <div className="flex items-center gap-2.5 text-[13px]">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                            <span className="truncate text-[var(--ink-700)]">{contactData.email}</span>
                        </div>
                    ) : null}
                    {contactData.company ? (
                        <div className="flex items-center gap-2.5 text-[13px]">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                            <span className="truncate text-[var(--ink-700)]">
                                {contactData.company}
                                {contactData.jobTitle ? ` · ${contactData.jobTitle}` : ''}
                            </span>
                        </div>
                    ) : null}
                    {contactData.address || contactData.city || contactData.country ? (
                        <div className="flex items-center gap-2.5 text-[13px]">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                            <span className="truncate text-[var(--ink-700)]">
                                {[contactData.address, contactData.city, contactData.country].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    ) : null}
                    {hasNoExtraInfo ? (
                        <p className="text-[12.5px] italic text-[var(--ink-soft)]">Aucune information supplémentaire</p>
                    ) : null}
                </section>

                {/* Tags */}
                {tags.length > 0 ? (
                    <section className="space-y-2">
                        <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            Tags
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <Chip key={tag.id} tone="neutral">{tag.name}</Chip>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Notes */}
                {contactData.notes && Array.isArray(contactData.notes) && contactData.notes.length > 0 ? (
                    <section className="space-y-2">
                        <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            Notes
                        </h3>
                        <div className="space-y-2">
                            {contactData.notes.filter(isContactNote).map((note, i) => (
                                <div key={i} className="rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3">
                                    <p className="text-[13px] text-[var(--ink-700)]">{note.content}</p>
                                    <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-[var(--ink-soft)]">
                                        {note.authorName ? <span>{note.authorName}</span> : null}
                                        {note.createdAt ? <span>{formatRelativeTime(note.createdAt)}</span> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Activity Timeline */}
                <section className="space-y-3">
                    <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Activité
                    </h3>
                    {!timeline ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ink-200)] border-t-[var(--accent)]" />
                        </div>
                    ) : timeline.length === 0 ? (
                        <p className="text-[12.5px] italic text-[var(--ink-soft)]">Aucune activité récente</p>
                    ) : (
                        <div className="relative">
                            <div className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--ink-200)]" />
                            <div className="space-y-3">
                                {timeline.map((entry, i) => {
                                    const received = entry.type === 'message_received';
                                    return (
                                        <div key={i} className="relative flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    'relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2',
                                                    received
                                                        ? 'border-[var(--ink-300)] bg-[var(--paper-warm)]'
                                                        : 'border-[var(--accent)] bg-[var(--accent-muted)]',
                                                )}
                                            >
                                                {received ? (
                                                    <ArrowDownLeft className="h-2.5 w-2.5 text-[var(--ink-500)]" />
                                                ) : (
                                                    <ArrowUpRight className="h-2.5 w-2.5 text-[var(--accent)]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 pb-1">
                                                <p className="text-[13px] text-[var(--ink-700)]">
                                                    <span className="font-medium text-[var(--ink-900)]">
                                                        {received ? 'Message reçu' : 'Message envoyé'}
                                                    </span>
                                                    {': '}
                                                    <span className="text-[var(--ink-500)]">{entry.content}</span>
                                                </p>
                                                <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-[var(--ink-soft)]">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatRelativeTime(entry.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE CLIENT
// ============================================

export function ContactsPageClient() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);

    // Permission checks
    const canDelete = usePermission('contacts:delete');
    const canExport = usePermission('contacts:export');

    // Fetch tags
    const tagsData = useQuery(api.tags.list);
    const tags: Tag[] = (tagsData?.tags || []).map(t => ({
        id: t._id,
        name: t.name,
        color: t.color || '#808080',
        contactCount: 0 // TODO: Implement count
    }));

    // Use paginated query for contacts
    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.contacts.list,
        {
            search: search || undefined,
            tag: tagFilter || undefined
        },
        { initialNumItems: 30 }
    );

    // Transform results to match Contact interface
    const contacts: Contact[] = (results || []).map((c) => ({
        id: c._id,
        phone: c.phone,
        name: c.name || null,
        firstName: c.firstName || null,
        lastName: c.lastName || null,
        email: c.email || null,
        company: c.company || null,
        jobTitle: c.jobTitle || null,
        notes: Array.isArray(c.notes) ? null : c.notes || null,
        countryCode: c.countryCode || null,
        isWhatsApp: c.isWhatsApp || null,
        isBlocked: c.isBlocked || null,
        tags: c.tags?.map(normalizeTag) || [],
        createdAt: c.createdAt
    }));

    const createContact = useMutation(api.contacts.create);
    const updateContact = useMutation(api.contacts.update);
    const deleteContact = useMutation(api.contacts.remove);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreate);

    const handleLoadMore = () => {
        loadMore(30);
    };

    const handleCreateSubmit = async (data: ContactFormSubmitData) => {
        try {
            await createContact(data);
            setIsCreateDialogOpen(false);
            // Success
        } catch (error) {
            console.error(error);
            if (isContactMutationError(error) && error.data?.code === 'DUPLICATE_CONTACT') {
                alert(`Contact existant: ${error.data.message}`);
            } else {
                alert(`Erreur: ${getErrorMessage(error)}`);
            }
        }
    };

    const handleEditSubmit = async (data: ContactFormSubmitData) => {
        if (!editingContact) return;
        try {
            await updateContact({
                id: editingContact.id as Id<"contacts">,
                ...data
            });
            setEditingContact(null);
            // Success
        } catch (error) {
            console.error(error);
            alert(`Erreur: ${getErrorMessage(error)}`);
        }
    };

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;
        try {
            await deleteContact({ id: contactToDelete.id as Id<"contacts"> });
            // Close drawer if we deleted the selected contact
            if (selectedContactId === contactToDelete.id) {
                setSelectedContactId(null);
            }
            setContactToDelete(null);
            // Success
        } catch (error) {
            console.error(error);
            alert(`Erreur: ${getErrorMessage(error)}`);
        }
    };

    const handleMessage = async (contact: Contact) => {
        try {
            const conversationId = await getOrCreateConversation({ contactId: contact.id as Id<"contacts"> });
            router.push(`/dashboard/conversations/${conversationId}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Impossible de démarrer la conversation.");
        }
    };

    const handleContactClick = (contact: Contact) => {
        setSelectedContactId(contact.id);
    };

    const exportContactsAsCsv = (contactsToExport: Contact[]) => {
        const headers = ["Phone", "Name", "FirstName", "LastName", "Email", "Company", "JobTitle", "Tags", "Notes"];
        const rows = contactsToExport.map(c => [
            c.phone,
            c.name || "",
            c.firstName || "",
            c.lastName || "",
            c.email || "",
            c.company || "",
            c.jobTitle || "",
            c.tags.map(t => t.name).join(", "),
            c.notes || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        exportContactsAsCsv(contacts);
    };

    const handleExportSelected = (selectedContacts: Contact[]) => {
        exportContactsAsCsv(selectedContacts);
    };

    const handleBulkDelete = (contactIds: string[]) => {
        setBulkDeleteIds(contactIds);
    };

    const confirmBulkDelete = async () => {
        if (!bulkDeleteIds) return;
        try {
            await Promise.all(
                bulkDeleteIds.map(id => deleteContact({ id: id as Id<"contacts"> }))
            );
            setBulkDeleteIds(null);
        } catch (error) {
            console.error(error);
            alert(`Erreur lors de la suppression: ${getErrorMessage(error)}`);
        }
    };

    const handleBulkAddTag = async (contactIds: string[], tagName: string) => {
        try {
            await Promise.all(
                contactIds.map(id => {
                    const contact = contacts.find(c => c.id === id);
                    if (!contact) return Promise.resolve();
                    const existingTags = contact.tags.map(t => t.name);
                    if (existingTags.includes(tagName)) return Promise.resolve();
                    return updateContact({
                        id: id as Id<"contacts">,
                        tags: [...existingTags, tagName],
                    });
                })
            );
        } catch (error) {
            console.error(error);
            alert(`Erreur lors de l'ajout du tag: ${getErrorMessage(error)}`);
        }
    };

    return (
        <div>
            {/* Full-bleed header band: negate the layout padding (incl. top) so the
                PageHeader sits flush at the top like the full-bleed pages. */}
            <div className="-mx-3 -mt-3 mb-4 sm:-mx-4 sm:-mt-4 lg:-mx-6 lg:-mt-6">
                <PageHeader
                    eyebrow={`DONNÉES · ${contacts.length} CONTACT${contacts.length > 1 ? "S" : ""}`}
                    title="Contacts"
                    description="Annuaire unifié — synchro WhatsApp, attributs, segments. Import CSV, déduplication, export RGPD."
                />
            </div>
            <ContactsView
                contacts={contacts}
                tags={tags}
                total={contacts.length}
                isLoading={isLoading && status === 'LoadingFirstPage'}
                hasMore={status === 'CanLoadMore'}
                onLoadMore={handleLoadMore}
                onSearch={setSearch}
                onFilterByTag={setTagFilter}
                onAddNew={() => setIsCreateDialogOpen(true)}
                onImport={() => setIsImportDialogOpen(true)}
                onExport={handleExport}
                onEdit={(c) => setEditingContact(c)}
                onDelete={handleDeleteClick}
                onMessage={handleMessage}
                onContactClick={handleContactClick}
                onExportSelected={handleExportSelected}
                onBulkDelete={handleBulkDelete}
                onBulkAddTag={handleBulkAddTag}
                canDelete={canDelete}
                canExport={canExport}
                onDuplicates={() => setIsDuplicatesDialogOpen(true)}
            />

            {/* Contact Detail Drawer (Sheet) */}
            <Sheet open={!!selectedContactId} onOpenChange={(open) => !open && setSelectedContactId(null)}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Détail du contact</SheetTitle>
                        <SheetDescription>Informations et activité du contact</SheetDescription>
                    </SheetHeader>
                    {selectedContactId && (
                        <ContactDetailDrawer
                            contactId={selectedContactId}
                            onClose={() => setSelectedContactId(null)}
                            onEdit={(c) => setEditingContact(c)}
                            onDelete={handleDeleteClick}
                            onMessage={handleMessage}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <ContactFormDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                mode="create"
                onSubmit={handleCreateSubmit}
            />

            {editingContact && (
                <ContactFormDialog
                    open={!!editingContact}
                    onOpenChange={(open) => !open && setEditingContact(null)}
                    mode="edit"
                    initialData={{
                        ...editingContact,
                        tags: editingContact.tags.map(t => t.name).join(', ') // Convert back to string for form
                    }}
                    onSubmit={handleEditSubmit}
                />
            )}

            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onComplete={() => setIsImportDialogOpen(false)}
            />

            <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
                <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[420px]">
                    <AlertDialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-danger-soft)]">
                            <Trash2 className="h-5 w-5 text-[var(--status-danger)]" />
                        </div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Annuaire · suppression
                        </p>
                        <AlertDialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Supprimer ce contact ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            Cette action est irréversible. Le contact
                            {contactToDelete?.name ? (
                                <span className="font-medium text-[var(--ink-700)]"> {contactToDelete.name} </span>
                            ) : (
                                " sélectionné "
                            )}
                            et toutes ses données seront supprimés définitivement.
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

            {/* Bulk delete confirmation */}
            <AlertDialog open={!!bulkDeleteIds} onOpenChange={(open) => !open && setBulkDeleteIds(null)}>
                <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[420px]">
                    <AlertDialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-danger-soft)]">
                            <Trash2 className="h-5 w-5 text-[var(--status-danger)]" />
                        </div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Annuaire · suppression
                        </p>
                        <AlertDialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Supprimer {bulkDeleteIds?.length} contact{(bulkDeleteIds?.length || 0) > 1 ? 's' : ''} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                            Cette action est irréversible. Les {bulkDeleteIds?.length} contacts sélectionnés et
                            toutes leurs données seront supprimés définitivement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-3.5">
                        <AlertDialogCancel className="mt-0 h-auto rounded-md border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            className="h-auto rounded-md bg-[var(--status-danger)] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--status-danger)]/90"
                        >
                            Supprimer {bulkDeleteIds?.length} contact{(bulkDeleteIds?.length || 0) > 1 ? 's' : ''}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DuplicatesDialog
                open={isDuplicatesDialogOpen}
                onOpenChange={setIsDuplicatesDialogOpen}
            />
        </div>
    );
}
