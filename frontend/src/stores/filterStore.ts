import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState } from '@/types/pendo';
import type { DateRangeValue } from '@/components/filters/DateRangeSelector';
import { subDays } from 'date-fns';

interface FilterStore {
  filters: FilterState;
  dateRange: DateRangeValue;
  updateFilters: (filters: FilterState) => void;
  updateDateRange: (dateRange: DateRangeValue) => void;
  resetFilters: () => void;
  setActiveFilterTab: (tab: string) => void;
  activeFilterTab: string;
  savedFilters: Array<{ id: string; name: string; filters: FilterState }>;
  saveFilter: (name: string) => void;
  deleteSavedFilter: (id: string) => void;
  loadSavedFilter: (id: string) => void;
}

const initialFilters: FilterState = {};

// Default to last 7 days
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const initialDateRange: DateRangeValue = {
  start: subDays(today, 6),
  end: now,
  preset: '7days',
  comparison: false,
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: initialFilters,
  dateRange: initialDateRange,
  activeFilterTab: 'all',
  savedFilters: [],

  updateFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  updateDateRange: (newDateRange) => {
    set({ dateRange: newDateRange });
  },

  resetFilters: () => {
    set({
      filters: initialFilters,
      dateRange: initialDateRange,
    });
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