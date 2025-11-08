import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState } from '@/types/pendo';
import type { DateRangeValue } from '@/components/filters/DateRangeSelector';

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

// Default to all time for better data overview
const now = new Date();
const initialDateRange: DateRangeValue = {
  start: new Date('2020-01-01'), // Far enough in past to capture all data
  end: now,
  preset: 'all',
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