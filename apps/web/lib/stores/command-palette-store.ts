import { create } from "zustand";

/**
 * Controls the global ⌘K command palette. The sidebar search button and the
 * single palette instance (mounted once in the dashboard shell) are siblings,
 * and a global keydown listener also toggles it — so the open state lives here
 * instead of being prop-drilled.
 */
interface CommandPaletteStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  openPalette: () => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openPalette: () => set({ open: true }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
