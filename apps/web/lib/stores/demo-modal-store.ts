import { create } from "zustand";

/**
 * Controls the "Voir la démo" video lightbox. The trigger button (hero CTA) and
 * the single modal instance (rendered once in the marketing layout) are siblings,
 * so the open state lives in this tiny store instead of being prop-drilled.
 */
interface DemoModalStore {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  setOpen: (open: boolean) => void;
}

export const useDemoModal = create<DemoModalStore>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
  setOpen: (open) => set({ open }),
}));
