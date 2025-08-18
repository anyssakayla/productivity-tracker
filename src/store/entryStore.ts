import { create } from 'zustand';
import { 
  Entry, 
  EntryWithTaskCompletions, 
  TaskCompletion, 
  TimeEntry,
  TimeType
} from '@/types';
import { DatabaseService } from '@/services/database';
import { formatDate } from '@/utils/helpers';

interface EntryState {
  entries: Record<string, EntryWithTaskCompletions[]>; // Keyed by date
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
  
  // Task completion
  addTaskCompletion: (entryId: string, taskId: string | null, taskName: string, quantity: number, isOtherTask: boolean) => Promise<void>;
  updateTaskCompletion: (completionId: string, quantity: number) => Promise<void>;
  removeTaskCompletion: (completionId: string, entryId: string) => Promise<void>;
  
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

  addTaskCompletion: async (entryId: string, taskId: string | null, taskName: string, quantity: number, isOtherTask: boolean) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.createTaskCompletion({
        entryId,
        taskId: taskId || '',
        taskName,
        quantity,
        isOtherTask
      });
      
      // Reload entries for the current date
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add task completion',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTaskCompletion: async (completionId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.updateTaskCompletion(completionId, { quantity });
      
      // Reload entries for the current date
      const { currentDate } = get();
      await get().loadEntriesForDate(currentDate);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task completion',
        isLoading: false 
      });
      throw error;
    }
  },

  removeTaskCompletion: async (completionId: string, entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.deleteTaskCompletion(completionId);
      
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
                  taskCompletions: entry.taskCompletions?.filter(tc => tc.id !== completionId)
                }
              : entry
          )
        },
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove task completion',
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