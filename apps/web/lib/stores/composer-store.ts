import { create } from 'zustand';

/**
 * Bridges the inbox Copilot (right panel) and the MessageInput composer (inside
 * the thread) — they are sibling components, so an AI-generated reply draft is
 * handed over through this tiny store rather than prop-drilling across the tree.
 * The injection is scoped to a conversationId so only the matching composer
 * consumes it.
 */
interface ComposerStore {
    injection: { conversationId: string; text: string } | null;
    /** Push a draft into the composer for a given conversation. */
    injectDraft: (conversationId: string, text: string) => void;
    /** Clear once the composer has consumed it. */
    clearInjection: () => void;
}

export const useComposerStore = create<ComposerStore>((set) => ({
    injection: null,
    injectDraft: (conversationId, text) => set({ injection: { conversationId, text } }),
    clearInjection: () => set({ injection: null }),
}));
