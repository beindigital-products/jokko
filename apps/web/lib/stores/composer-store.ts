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

    /**
     * Template handed over from /dashboard/modeles ("Utiliser dans une conv.").
     * The user has no conversation selected yet on that page, so we stash the
     * picked template id and let whichever composer mounts next auto-open the
     * template picker pre-selected on it. Consumed once.
     */
    templatePreselect: { templateId: string } | null;
    /** Stash a template to use, then navigate the user to the inbox. */
    preselectTemplate: (templateId: string) => void;
    /** Clear once a composer has consumed (or dismissed) the preselection. */
    clearTemplatePreselect: () => void;
}

export const useComposerStore = create<ComposerStore>((set) => ({
    injection: null,
    injectDraft: (conversationId, text) => set({ injection: { conversationId, text } }),
    clearInjection: () => set({ injection: null }),

    templatePreselect: null,
    preselectTemplate: (templateId) => set({ templatePreselect: { templateId } }),
    clearTemplatePreselect: () => set({ templatePreselect: null }),
}));
