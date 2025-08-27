import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, OnboardingState } from '@/types';
import { DatabaseService } from '@/services/database';
import { seedDatabase } from '@/utils/seedData';

interface AppState extends AppSettings {
  // Onboarding
  onboarding: OnboardingState;
  
  // UI State
  isInitialized: boolean;
  isDatabaseReady: boolean;
  
  // Actions
  initializeApp: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<OnboardingState>) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleNotifications: () => void;
  setExportEmail: (email: string) => void;
  setDefaultFocus: (focusId: string) => void;
}

const defaultSettings: AppSettings = {
  hasCompletedOnboarding: false,
  theme: 'light',
  notifications: true,
  defaultFocusId: undefined,
  exportEmail: undefined
};

const defaultOnboarding: OnboardingState = {
  currentStep: 0,
  profile: undefined,
  firstFocus: undefined,
  categories: undefined
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      onboarding: defaultOnboarding,
      isInitialized: false,
      isDatabaseReady: false,

      initializeApp: async () => {
        console.log('🚀 AppStore: initializeApp called');
        try {
          // Initialize database
          console.log('🚀 AppStore: Initializing database...');
          await DatabaseService.initialize();
          console.log('🚀 AppStore: Database initialized successfully');
          set({ isDatabaseReady: true });
          
          // Only seed database if no user exists (for initial setup only)
          console.log('🚀 AppStore: Checking for existing user...');
          const existingUser = await DatabaseService.getUser();
          console.log('🚀 AppStore: Existing user:', existingUser ? 'found' : 'not found');
          if (!existingUser && process.env.NODE_ENV === 'development') {
            console.log('🚀 AppStore: No user found and in development mode, seeding database...');
            await seedDatabase();
            console.log('🚀 AppStore: Database seeded');
          }
          
          // Load settings from database
          console.log('🚀 AppStore: Loading settings from database...');
          const hasCompletedOnboarding = await DatabaseService.getSetting('hasCompletedOnboarding');
          const theme = await DatabaseService.getSetting('theme');
          const notifications = await DatabaseService.getSetting('notifications');
          const defaultFocusId = await DatabaseService.getSetting('defaultFocusId');
          const exportEmail = await DatabaseService.getSetting('exportEmail');
          
          console.log('🚀 AppStore: Settings loaded:', {
            hasCompletedOnboarding,
            theme,
            notifications,
            defaultFocusId,
            exportEmail
          });
          
          set({
            hasCompletedOnboarding: hasCompletedOnboarding === 'true',
            theme: (theme as 'light' | 'dark') || 'light',
            notifications: notifications !== 'false',
            defaultFocusId: defaultFocusId || undefined,
            exportEmail: exportEmail || undefined,
            isInitialized: true
          });
          console.log('🚀 AppStore: App initialization completed successfully');
        } catch (error) {
          console.error('🚀 AppStore: Failed to initialize app:', error);
          set({ isInitialized: true }); // Still mark as initialized to prevent infinite loading
        }
      },

      completeOnboarding: async () => {
        set({ hasCompletedOnboarding: true });
        await DatabaseService.setSetting('hasCompletedOnboarding', 'true');
        
        // Reset onboarding state
        set({ onboarding: defaultOnboarding });
      },

      updateOnboardingStep: (step: number) => {
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step }
        }));
      },

      updateOnboardingData: (data: Partial<OnboardingState>) => {
        set((state) => ({
          onboarding: { ...state.onboarding, ...data }
        }));
      },

      updateSettings: async (settings: Partial<AppSettings>) => {
        // Update local state
        set(settings);
        
        // Update database
        const promises = [];
        
        if (settings.theme !== undefined) {
          promises.push(DatabaseService.setSetting('theme', settings.theme));
        }
        if (settings.notifications !== undefined) {
          promises.push(DatabaseService.setSetting('notifications', String(settings.notifications)));
        }
        if (settings.defaultFocusId !== undefined) {
          promises.push(DatabaseService.setSetting('defaultFocusId', settings.defaultFocusId));
        }
        if (settings.exportEmail !== undefined) {
          promises.push(DatabaseService.setSetting('exportEmail', settings.exportEmail));
        }
        
        await Promise.all(promises);
      },

      setTheme: (theme: 'light' | 'dark') => {
        get().updateSettings({ theme });
      },

      toggleNotifications: () => {
        const { notifications } = get();
        get().updateSettings({ notifications: !notifications });
      },

      setExportEmail: (email: string) => {
        get().updateSettings({ exportEmail: email });
      },

      setDefaultFocus: (focusId: string) => {
        get().updateSettings({ defaultFocusId: focusId });
      },

      resetOnboarding: async () => {
        // Clear all app data
        await DatabaseService.clearAllData();
        
        // Reset state to defaults
        set({
          ...defaultSettings,
          onboarding: defaultOnboarding,
          hasCompletedOnboarding: false,
        });
        
        // Clear AsyncStorage
        await AsyncStorage.clear();
      }
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        theme: state.theme,
        notifications: state.notifications,
        defaultFocusId: state.defaultFocusId,
        exportEmail: state.exportEmail,
        onboarding: state.onboarding
      })
    }
  )
);