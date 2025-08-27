import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, ProfileFormData } from '@/types';
import { DatabaseService } from '@/services/database';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUser: () => Promise<void>;
  createUser: (data: ProfileFormData) => Promise<void>;
  updateUser: (data: Partial<ProfileFormData>) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      loadUser: async () => {
        console.log('👤 UserStore: loadUser called');
        set({ isLoading: true, error: null });
        try {
          console.log('👤 UserStore: Calling DatabaseService.getUser()');
          const user = await DatabaseService.getUser();
          console.log('👤 UserStore: User loaded:', user ? `${user.name} (${user.id})` : 'null');
          set({ user, isLoading: false });
        } catch (error) {
          console.error('👤 UserStore: Error loading user:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load user',
            isLoading: false 
          });
        }
      },

      createUser: async (data: ProfileFormData) => {
        set({ isLoading: true, error: null });
        try {
          const user = await DatabaseService.createUser(data);
          set({ user, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create user',
            isLoading: false 
          });
          throw error;
        }
      },

      updateUser: async (data: Partial<ProfileFormData>) => {
        const { user } = get();
        if (!user) {
          set({ error: 'No user found' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await DatabaseService.updateUser(user.id, data);
          set({ 
            user: { ...user, ...data },
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update user',
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user data
    }
  )
);