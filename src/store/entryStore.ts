import { create } from 'zustand';
import { 
  Entry, 
  EntryWithDetails, 
  TaskEntry, 
  CountEntry, 
  TimeEntry,
  TimeType,
  CategoryType
} from '@/types';
import { DatabaseService } from '@/services/database';
import { formatDate } from '@/utils/helpers';

interface EntryState {
  entries: Record<string, EntryWithDetails[]>; // Keyed by date
  currentDate: string;
  isLoading: boolean;
  error: string | null;
  
  // Clock state
  activeClockEntry: { entryId: string; startTime: string } | null;
  
  // Actions
  loadEntriesForDate: (date: string, focusId?: string) => Promise<void>;
  setCurrentDate: (date: string) => void;
  
  // Entry management
  getOrCreateEntry: (date: string, categoryId: string, focusId: string) => Promise<Entry>;
  
  // Task entries (TYPE_IN)
  addTaskEntry: (entryId: string, description: string) => Promise<void>;
  removeTaskEntry: (taskId: string, entryId: string) => Promise<void>;
  
  // Count entries (SELECT_COUNT)
  updateCountEntry: (entryId: string, subcategoryId: string, quantity: number) => Promise<void>;
  
  // Time entries
  startClock: (entryId: string) => Promise<void>;
  stopClock: (entryId: string) => Promise<void>;
  setClockTimes: (entryId: string, startTime: string, endTime: string) => Promise<void>;
  setDuration: (entryId: string, minutes: number) => Promise<void>;
  
  clearError: () => void;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: {},
  currentDate: formatDate(new Date()),
  isLoading: false,
  error: null,
  activeClockEntry: null,

  loadEntriesForDate: async (date: string, focusId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await DatabaseService.getEntriesByDate(date, focusId);
      
      // Check if any entry has an active clock
      const activeEntry = entries.find(e => 
        e.timeEntry?.type === TimeType.CLOCK && 
        e.timeEntry.startTime && 
        !e.timeEntry.endTime
      );
      
      set((state) => ({
        entries: { ...state.entries, [date]: entries },
        activeClockEntry: activeEntry 
          ? { entryId: activeEntry.id, startTime: activeEntry.timeEntry!.startTime! }
          : null,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load entries',
        isLoading: false 
      });
    }
  },

  setCurrentDate: (date: string) => {
    set({ currentDate: date });
  },

  getOrCreateEntry: async (date: string, categoryId: string, focusId: string) => {
    try {
      // Check if entry already exists
      let entry = await DatabaseService.getEntryByDateAndCategory(date, categoryId);
      
      // Create if doesn't exist
      if (!entry) {
        entry = await DatabaseService.createEntry({
          date,
          categoryId,
          focusId
        });
      }
      
      return entry;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get/create entry';
      set({ error: errorMsg });
      throw error;
    }
  },

  addTaskEntry: async (entryId: string, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const task = await DatabaseService.createTaskEntry({
        entryId,
        description,
        order: 0 // Will be set by database
      });
      
      // Reload entries for the current date
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false 
      });
      throw error;
    }
  },

  removeTaskEntry: async (taskId: string, entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Delete from database (would need to add this method to DatabaseService)
      // await DatabaseService.deleteTaskEntry(taskId);
      
      // Update local state
      const { currentDate, entries } = get();
      const dateEntries = entries[currentDate] || [];
      
      set({
        entries: {
          ...entries,
          [currentDate]: dateEntries.map(entry =>
            entry.id === entryId
              ? {
                  ...entry,
                  tasks: entry.tasks?.filter(t => t.id !== taskId)
                }
              : entry
          )
        },
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove task',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCountEntry: async (entryId: string, subcategoryId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.createOrUpdateCountEntry({
        entryId,
        subcategoryId,
        quantity
      });
      
      // Reload entries for the current date
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update count',
        isLoading: false 
      });
      throw error;
    }
  },

  startClock: async (entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const startTime = new Date().toISOString();
      
      await DatabaseService.createOrUpdateTimeEntry({
        entryId,
        type: TimeType.CLOCK,
        startTime,
        endTime: undefined,
        duration: undefined
      });
      
      set({
        activeClockEntry: { entryId, startTime },
        isLoading: false
      });
      
      // Reload entries
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start clock',
        isLoading: false 
      });
      throw error;
    }
  },

  stopClock: async (entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { activeClockEntry } = get();
      if (!activeClockEntry || activeClockEntry.entryId !== entryId) {
        throw new Error('No active clock for this entry');
      }
      
      const endTime = new Date().toISOString();
      
      await DatabaseService.createOrUpdateTimeEntry({
        entryId,
        type: TimeType.CLOCK,
        startTime: activeClockEntry.startTime,
        endTime
      });
      
      set({
        activeClockEntry: null,
        isLoading: false
      });
      
      // Reload entries
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop clock',
        isLoading: false 
      });
      throw error;
    }
  },

  setClockTimes: async (entryId: string, startTime: string, endTime: string) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.createOrUpdateTimeEntry({
        entryId,
        type: TimeType.CLOCK,
        startTime,
        endTime
      });
      
      // Reload entries
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set clock times',
        isLoading: false 
      });
      throw error;
    }
  },

  setDuration: async (entryId: string, minutes: number) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.createOrUpdateTimeEntry({
        entryId,
        type: TimeType.DURATION,
        duration: minutes,
        startTime: undefined,
        endTime: undefined
      });
      
      // Reload entries
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set duration',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));