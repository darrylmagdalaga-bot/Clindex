import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LegislativeDocument, FilterState, PaginationState } from "@/types";
import { mockDocuments } from "@/mock/documents";
import { DEFAULT_PAGE_SIZE } from "@/constants";

interface DocumentStore {
  // State
  documents: LegislativeDocument[];
  selectedDocument: LegislativeDocument | null;
  filters: FilterState;
  pagination: PaginationState;
  isLoading: boolean;

  // Actions
  setDocuments: (docs: LegislativeDocument[]) => void;
  addDocument: (doc: LegislativeDocument) => void;
  updateDocument: (id: string, updates: Partial<LegislativeDocument>) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (doc: LegislativeDocument | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setPagination: (p: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  getFilteredDocuments: () => LegislativeDocument[];
  getDocumentById: (id: string) => LegislativeDocument | undefined;
}

const defaultFilters: FilterState = { search: "" };
const defaultPagination: PaginationState = { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 };

export const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    documents: mockDocuments,
    selectedDocument: null,
    filters: defaultFilters,
    pagination: defaultPagination,
    isLoading: false,

    setDocuments: (docs) => set((state) => { state.documents = docs; }),
    addDocument: (doc) => set((state) => { state.documents.unshift(doc); }),
    updateDocument: (id, updates) =>
      set((state) => {
        const idx = state.documents.findIndex((d) => d.id === id);
        if (idx !== -1) Object.assign(state.documents[idx], updates);
      }),
    deleteDocument: (id) =>
      set((state) => { state.documents = state.documents.filter((d) => d.id !== id); }),
    selectDocument: (doc) => set((state) => { state.selectedDocument = doc; }),
    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
        state.pagination.page = 1;
      }),
    resetFilters: () => set((state) => { state.filters = defaultFilters; }),
    setPagination: (p) => set((state) => { Object.assign(state.pagination, p); }),
    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    getFilteredDocuments: () => {
      const { documents, filters } = get();
      return documents.filter((doc) => {
        const q = filters.search.toLowerCase();
        const matchSearch =
          !q ||
          doc.title.toLowerCase().includes(q) ||
          doc.documentNumber.toLowerCase().includes(q) ||
          doc.authorName.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q));
        const matchType = !filters.documentType || doc.documentType === filters.documentType;
        const matchStatus = !filters.status || doc.status === filters.status;
        const matchCommittee = !filters.committee || doc.committee === filters.committee;
        const matchYear = !filters.year || doc.year === filters.year;
        const matchStorage = !filters.storageType || doc.storageType === filters.storageType;
        return matchSearch && matchType && matchStatus && matchCommittee && matchYear && matchStorage;
      });
    },

    getDocumentById: (id) => get().documents.find((d) => d.id === id),
  }))
);