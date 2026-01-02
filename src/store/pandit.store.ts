import { create } from 'zustand';
import { Pandit, PanditFilter } from '@/types/pandit';
import { PanditService } from '@/services/pandit.service';

interface PanditState {
  pandits: Pandit[];
  isLoading: boolean;
  error: string | null;
  filter: PanditFilter;
  
  setFilter: (filter: Partial<PanditFilter>) => void;
  fetchPandits: () => Promise<void>;
  resetFilter: () => void;
}

const INITIAL_FILTER: PanditFilter = {
  searchQuery: '',
};

export const usePanditStore = create<PanditState>((set, get) => ({
  pandits: [],
  isLoading: false,
  error: null,
  filter: INITIAL_FILTER,

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    get().fetchPandits();
  },

  resetFilter: () => {
    set({ filter: INITIAL_FILTER });
    get().fetchPandits();
  },

  fetchPandits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filter } = get();
      const data = await PanditService.getPandits(filter);
      set({ pandits: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to fetch pandits' });
    }
  },
}));
