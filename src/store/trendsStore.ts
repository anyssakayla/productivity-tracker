import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendsData, TrendsPeriod } from '@/types';
import TrendsService, { TRENDS_PERIODS } from '@/services/trends/TrendsService';

interface TrendsState {
  // Data
  trendsData: Record<string, Record<string, TrendsData>>; // focusId -> period -> data
  currentPeriod: TrendsPeriod;
  
  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Record<string, number>; // focusId -> timestamp
  
  // User preferences
  defaultPeriod: TrendsPeriod;
  chartType: 'line' | 'bar';
  showInsights: boolean;
  
  // Actions
  loadTrendsData: (focusId: string, period?: TrendsPeriod, forceRefresh?: boolean) => Promise<void>;
  refreshTrendsData: (focusId: string, period?: TrendsPeriod) => Promise<void>;
  setPeriod: (period: TrendsPeriod) => void;
  setChartType: (type: 'line' | 'bar') => void;
  setShowInsights: (show: boolean) => void;
  clearTrendsData: (focusId?: string) => void;
  clearError: () => void;
  
  // Selectors
  getTrendsData: (focusId: string, period?: TrendsPeriod) => TrendsData | null;
  isDataStale: (focusId: string, maxAgeMinutes?: number) => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PERIOD = TRENDS_PERIODS[1]; // Month

export const useTrendsStore = create<TrendsState>()(
  persist(
    (set, get) => ({
      // Initial state
      trendsData: {},
      currentPeriod: DEFAULT_PERIOD,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastUpdated: {},
      defaultPeriod: DEFAULT_PERIOD,
      chartType: 'line',
      showInsights: true,

      loadTrendsData: async (focusId: string, period?: TrendsPeriod, forceRefresh: boolean = false) => {
        const targetPeriod = period || get().currentPeriod;
        const cacheKey = `${focusId}_${targetPeriod.value}`;
        
        // Check if we have fresh data and don't need to refresh
        if (!forceRefresh && !get().isDataStale(focusId)) {
          const existingData = get().getTrendsData(focusId, targetPeriod);
          if (existingData) {
            return;
          }
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('📊 TrendsStore: Loading trends data for focus:', focusId, 'period:', targetPeriod.label);
          
          const trendsData = await TrendsService.getTrendsData(focusId, targetPeriod);
          
          set((state) => ({
            trendsData: {
              ...state.trendsData,
              [focusId]: {
                ...state.trendsData[focusId],
                [targetPeriod.value]: trendsData
              }
            },
            lastUpdated: {
              ...state.lastUpdated,
              [focusId]: Date.now()
            },
            isLoading: false,
            currentPeriod: targetPeriod
          }));
          
          console.log('📊 TrendsStore: Successfully loaded trends data');
        } catch (error) {
          console.error('📊 TrendsStore: Error loading trends data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load trends data',
            isLoading: false 
          });
        }
      },

      refreshTrendsData: async (focusId: string, period?: TrendsPeriod) => {
        const targetPeriod = period || get().currentPeriod;
        
        set({ isRefreshing: true, error: null });
        
        try {
          console.log('📊 TrendsStore: Refreshing trends data for focus:', focusId);
          
          const trendsData = await TrendsService.getTrendsData(focusId, targetPeriod);
          
          set((state) => ({
            trendsData: {
              ...state.trendsData,
              [focusId]: {
                ...state.trendsData[focusId],
                [targetPeriod.value]: trendsData
              }
            },
            lastUpdated: {
              ...state.lastUpdated,
              [focusId]: Date.now()
            },
            isRefreshing: false
          }));
          
          console.log('📊 TrendsStore: Successfully refreshed trends data');
        } catch (error) {
          console.error('📊 TrendsStore: Error refreshing trends data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh trends data',
            isRefreshing: false 
          });
        }
      },

      setPeriod: (period: TrendsPeriod) => {
        console.log('📊 TrendsStore: Setting period to:', period.label);
        set({ currentPeriod: period });
      },

      setChartType: (type: 'line' | 'bar') => {
        console.log('📊 TrendsStore: Setting chart type to:', type);
        set({ chartType: type });
      },

      setShowInsights: (show: boolean) => {
        set({ showInsights: show });
      },

      clearTrendsData: (focusId?: string) => {
        if (focusId) {
          console.log('📊 TrendsStore: Clearing trends data for focus:', focusId);
          set((state) => {
            const newTrendsData = { ...state.trendsData };
            delete newTrendsData[focusId];
            
            const newLastUpdated = { ...state.lastUpdated };
            delete newLastUpdated[focusId];
            
            return {
              trendsData: newTrendsData,
              lastUpdated: newLastUpdated
            };
          });
        } else {
          console.log('📊 TrendsStore: Clearing all trends data');
          set({
            trendsData: {},
            lastUpdated: {}
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Selectors
      getTrendsData: (focusId: string, period?: TrendsPeriod) => {
        const targetPeriod = period || get().currentPeriod;
        return get().trendsData[focusId]?.[targetPeriod.value] || null;
      },

      isDataStale: (focusId: string, maxAgeMinutes: number = 5) => {
        const lastUpdate = get().lastUpdated[focusId];
        if (!lastUpdate) return true;
        
        const now = Date.now();
        const maxAge = maxAgeMinutes * 60 * 1000;
        return (now - lastUpdate) > maxAge;
      }
    }),
    {
      name: 'trends-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        defaultPeriod: state.defaultPeriod,
        chartType: state.chartType,
        showInsights: state.showInsights,
        // Don't persist data and loading states
      }),
    }
  )
);

// Helper hooks for common use cases
export const useTrendsData = (focusId: string) => {
  const store = useTrendsStore();
  
  React.useEffect(() => {
    if (focusId) {
      store.loadTrendsData(focusId);
    }
  }, [focusId, store.currentPeriod.value]);
  
  return {
    data: store.getTrendsData(focusId),
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    error: store.error,
    refresh: () => store.refreshTrendsData(focusId),
    clearError: store.clearError
  };
};

export const useTrendsPeriod = () => {
  const { currentPeriod, setPeriod } = useTrendsStore();
  
  return {
    currentPeriod,
    setPeriod,
    availablePeriods: TRENDS_PERIODS
  };
};

export const useTrendsPreferences = () => {
  const {
    chartType,
    showInsights,
    setChartType,
    setShowInsights
  } = useTrendsStore();
  
  return {
    chartType,
    showInsights,
    setChartType,
    setShowInsights
  };
};