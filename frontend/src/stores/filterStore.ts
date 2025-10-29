import { create } from 'zustand';
import type { FilterState } from '@/types/pendo';

interface FilterStore {
  filters: FilterState;
  updateFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  setActiveFilterTab: (tab: string) => void;
  activeFilterTab: string;
  savedFilters: Array<{ id: string; name: string; filters: FilterState }>;
  saveFilter: (name: string) => void;
  deleteSavedFilter: (id: string) => void;
  loadSavedFilter: (id: string) => void;
}

const initialFilters: FilterState = {};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: initialFilters,
  activeFilterTab: 'all',
  savedFilters: [],

  updateFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  setActiveFilterTab: (tab) => {
    set({ activeFilterTab: tab });
  },

  saveFilter: (name) => {
    const { filters, savedFilters } = get();
    const newFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...filters }
    };
    set({
      savedFilters: [...savedFilters, newFilter]
    });
  },

  deleteSavedFilter: (id) => {
    const { savedFilters } = get();
    set({
      savedFilters: savedFilters.filter(filter => filter.id !== id)
    });
  },

  loadSavedFilter: (id) => {
    const { savedFilters } = get();
    const filterToLoad = savedFilters.find(filter => filter.id === id);
    if (filterToLoad) {
      set({ filters: { ...filterToLoad.filters } });
    }
  }
}));