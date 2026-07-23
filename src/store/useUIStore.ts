import { create } from "zustand";

interface UIStore {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
  closeMobileSidebar: () => set({ sidebarMobileOpen: false }),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));