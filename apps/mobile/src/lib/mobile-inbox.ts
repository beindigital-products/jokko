export type MobileInboxFilter = "all" | "unread" | "mine";

export type MobileConversationSearchFields = {
    _id: string;
    contact?: {
        name?: string | null;
        phoneNumber?: string | null;
        waId?: string | null;
    } | null;
    preview?: string | null;
    unreadCount?: number | null;
    assignedTo?: {
        _id?: string;
        user?: {
            name?: string | null;
            email?: string | null;
        } | null;
    } | null;
    isPinned?: boolean | null;
    lastMessageAt: number;
};

export function getConversationDisplayName(conversation: MobileConversationSearchFields): string {
    const name = conversation.contact?.name?.trim();
    if (name) return name;

    const phone = conversation.contact?.phoneNumber?.trim() || conversation.contact?.waId?.trim();
    if (phone) return phone;

    return "Contact inconnu";
}

export function getConversationInitials(conversation: MobileConversationSearchFields): string {
    const displayName = getConversationDisplayName(conversation);
    const words = displayName
        .replace(/[^\p{L}\p{N}\s+]/gu, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getConversationPreview(conversation: MobileConversationSearchFields): string {
    const preview = conversation.preview?.trim();
    return preview || "Aucun message pour le moment";
}

export function formatConversationTimestamp(timestamp: number, now: Date = new Date()): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";

    const today = startOfDay(now).getTime();
    const day = startOfDay(date).getTime();
    const diffDays = Math.round((today - day) / 86_400_000);

    if (diffDays === 0) {
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }

    if (diffDays === 1) return "Hier";

    if (diffDays > 1 && diffDays < 7) {
        return date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
    }

    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function filterMobileConversations<T extends MobileConversationSearchFields>(
    conversations: readonly T[],
    filter: MobileInboxFilter,
    search: string,
    currentUserId?: string | null,
): T[] {
    const query = normalizeSearch(search);

    return [...conversations]
        .filter((conversation) => {
            if (filter === "unread" && (conversation.unreadCount ?? 0) <= 0) return false;
            if (filter === "mine" && conversation.assignedTo?._id !== currentUserId) return false;
            if (!query) return true;

            return normalizeSearch([
                getConversationDisplayName(conversation),
                conversation.contact?.phoneNumber,
                conversation.contact?.waId,
                conversation.preview,
                conversation.assignedTo?.user?.name,
                conversation.assignedTo?.user?.email,
            ].filter(Boolean).join(" ")).includes(query);
        })
        .sort((a, b) => {
            if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
                return a.isPinned ? -1 : 1;
            }
            return b.lastMessageAt - a.lastMessageAt;
        });
}

function normalizeSearch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
