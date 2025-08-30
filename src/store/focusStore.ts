import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Focus, FocusFormData } from '@/types';
import { DatabaseService } from '@/services/database';

interface FocusState {
  focuses: Focus[];
  activeFocus: Focus | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getFocuses: () => Promise<Focus[]>;
  loadFocuses: () => Promise<void>;
  createFocus: (data: FocusFormData) => Promise<Focus>;
  updateFocus: (id: string, data: Partial<FocusFormData>) => Promise<void>;
  deleteFocus: (id: string) => Promise<void>;
  setActiveFocus: (id: string) => Promise<void>;
  reorderFocuses: (focusIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      focuses: [],
      activeFocus: null,
      isLoading: false,
      error: null,

      getFocuses: async () => {
        console.log('🎯 FocusStore: getFocuses called');
        const { focuses } = get();
        console.log('🎯 FocusStore: Current focuses count:', focuses.length);
        if (focuses.length === 0) {
          console.log('🎯 FocusStore: No focuses in store, loading from DB');
          await get().loadFocuses();
          const updatedFocuses = get().focuses;
          console.log('🎯 FocusStore: After loading, focuses count:', updatedFocuses.length);
          return updatedFocuses;
        }
        console.log('🎯 FocusStore: Returning existing focuses:', focuses.map(f => ({name: f.name, id: f.id, isActive: f.isActive})));
        return focuses;
      },

      loadFocuses: async () => {
        console.log('🎯 FocusStore: loadFocuses called');
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 FocusStore: Calling DatabaseService.getFocuses()');
          const focuses = await DatabaseService.getFocuses();
          console.log('🎯 FocusStore: DB returned focuses:', focuses.length, focuses.map(f => ({name: f.name, id: f.id, isActive: f.isActive})));
          
          console.log('🎯 FocusStore: Calling DatabaseService.getActiveFocus()');
          const activeFocus = await DatabaseService.getActiveFocus();
          console.log('🎯 FocusStore: DB returned active focus:', activeFocus ? `${activeFocus.name} (${activeFocus.id})` : 'null');
          
          set({ focuses, activeFocus, isLoading: false });
          console.log('🎯 FocusStore: State updated successfully');
        } catch (error) {
          console.error('🎯 FocusStore: Error loading focuses:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load focuses',
            isLoading: false 
          });
        }
      },

      createFocus: async (data: FocusFormData) => {
        set({ isLoading: true, error: null });
        try {
          // If this is the first focus, make it active
          const { focuses } = get();
          const isFirstFocus = focuses.length === 0;
          
          const focus = await DatabaseService.createFocus({
            ...data,
            isActive: isFirstFocus
          });
          
          set((state) => ({
            focuses: [...state.focuses, focus],
            activeFocus: isFirstFocus ? focus : state.activeFocus,
            isLoading: false
          }));
          
          return focus;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create focus',
            isLoading: false 
          });
          throw error;
        }
      },

      updateFocus: async (id: string, data: Partial<FocusFormData>) => {
        set({ isLoading: true, error: null });
        try {
          // Update in database
          await DatabaseService.updateFocus(id, data);
          
          set((state) => ({
            focuses: state.focuses.map(focus => 
              focus.id === id ? { ...focus, ...data } : focus
            ),
            activeFocus: state.activeFocus?.id === id 
              ? { ...state.activeFocus, ...data } 
              : state.activeFocus,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update focus',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteFocus: async (id: string) => {
        const { focuses, activeFocus } = get();
        
        // Don't allow deleting the last focus
        if (focuses.length <= 1) {
          set({ error: 'Cannot delete the last focus' });
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          // Delete from database (would need to add this method to DatabaseService)
          // await DatabaseService.deleteFocus(id);
          
          const newFocuses = focuses.filter(f => f.id !== id);
          let newActiveFocus = activeFocus;
          
          // If we deleted the active focus, activate the first remaining one
          if (activeFocus?.id === id && newFocuses.length > 0) {
            await DatabaseService.setActiveFocus(newFocuses[0].id);
            newActiveFocus = newFocuses[0];
          }
          
          set({
            focuses: newFocuses,
            activeFocus: newActiveFocus,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete focus',
            isLoading: false 
          });
          throw error;
        }
      },

      setActiveFocus: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await DatabaseService.setActiveFocus(id);
          const focus = get().focuses.find(f => f.id === id);
          
          set((state) => ({
            activeFocus: focus || null,
            focuses: state.focuses.map(f => ({
              ...f,
              isActive: f.id === id
            })),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to set active focus',
            isLoading: false 
          });
          throw error;
        }
      },

      reorderFocuses: async (focusIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // Update order in database (would need to add this method to DatabaseService)
          // await DatabaseService.reorderFocuses(focusIds);
          
          const { focuses } = get();
          const reorderedFocuses = focusIds
            .map((id, index) => {
              const focus = focuses.find(f => f.id === id);
              return focus ? { ...focus, order: index } : null;
            })
            .filter((f): f is Focus => f !== null);
          
          set({
            focuses: reorderedFocuses,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reorder focuses',
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'focus-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        focuses: state.focuses,
        activeFocus: state.activeFocus 
      }),
    }
  )
);