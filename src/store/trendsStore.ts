import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendsData, TrendsPeriod } from '@/types';
import TrendsService, { TRENDS_PERIODS } from '@/services/trends/TrendsService';

interface TrendsState {
  // Data
  trendsData: Record<string, Record<string, TrendsData>>; // focusId -> cacheKey -> data
  currentPeriod: TrendsPeriod;
  currentDate: Date;
  
  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Record<string, number>; // cacheKey -> timestamp
  
  // User preferences
  defaultPeriod: TrendsPeriod;
  chartType: 'line' | 'bar';
  showInsights: boolean;
  
  // Actions
  loadTrendsData: (focusId: string, period?: TrendsPeriod, referenceDate?: Date, forceRefresh?: boolean) => Promise<void>;
  refreshTrendsData: (focusId: string, period?: TrendsPeriod, referenceDate?: Date) => Promise<void>;
  setPeriod: (period: TrendsPeriod) => void;
  setCurrentDate: (date: Date) => void;
  setChartType: (type: 'line' | 'bar') => void;
  setShowInsights: (show: boolean) => void;
  clearTrendsData: (focusId?: string) => void;
  clearError: () => void;
  
  // Selectors
  getTrendsData: (focusId: string, period?: TrendsPeriod, referenceDate?: Date) => TrendsData | null;
  isDataStale: (focusId: string, period: TrendsPeriod, referenceDate: Date, maxAgeMinutes?: number) => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PERIOD = TRENDS_PERIODS[0]; // Week (changed to index 0)

// Helper function to generate cache key
const getCacheKey = (focusId: string, period: TrendsPeriod, referenceDate: Date): string => {
  const dateStr = referenceDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${focusId}_${period.value}_${dateStr}`;
};

export const useTrendsStore = create<TrendsState>()(
  persist(
    (set, get) => ({
      // Initial state
      trendsData: {},
      currentPeriod: DEFAULT_PERIOD,
      currentDate: new Date(),
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastUpdated: {},
      defaultPeriod: DEFAULT_PERIOD,
      chartType: 'line',
      showInsights: true,

      loadTrendsData: async (focusId: string, period?: TrendsPeriod, referenceDate?: Date, forceRefresh: boolean = false) => {
        const targetPeriod = period || get().currentPeriod;
        const targetDate = referenceDate || get().currentDate;
        const cacheKey = getCacheKey(focusId, targetPeriod, targetDate);
        
        // Check if we have fresh data and don't need to refresh
        if (!forceRefresh && !get().isDataStale(focusId, targetPeriod, targetDate)) {
          const existingData = get().getTrendsData(focusId, targetPeriod, targetDate);
          if (existingData) {
            return;
          }
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('📊 TrendsStore: Loading trends data for focus:', focusId, 'period:', targetPeriod.label, 'date:', targetDate.toDateString());
          
          const trendsData = await TrendsService.getTrendsData(focusId, targetPeriod, targetDate);
          
          set((state) => ({
            trendsData: {
              ...state.trendsData,
              [focusId]: {
                ...state.trendsData[focusId],
                [cacheKey]: trendsData
              }
            },
            lastUpdated: {
              ...state.lastUpdated,
              [cacheKey]: Date.now()
            },
            isLoading: false,
            currentPeriod: targetPeriod,
            currentDate: targetDate
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

      refreshTrendsData: async (focusId: string, period?: TrendsPeriod, referenceDate?: Date) => {
        const targetPeriod = period || get().currentPeriod;
        const targetDate = referenceDate || get().currentDate;
        const cacheKey = getCacheKey(focusId, targetPeriod, targetDate);
        
        set({ isRefreshing: true, error: null });
        
        try {
          console.log('📊 TrendsStore: Refreshing trends data for focus:', focusId);
          
          const trendsData = await TrendsService.getTrendsData(focusId, targetPeriod, targetDate);
          
          set((state) => ({
            trendsData: {
              ...state.trendsData,
              [focusId]: {
                ...state.trendsData[focusId],
                [cacheKey]: trendsData
              }
            },
            lastUpdated: {
              ...state.lastUpdated,
              [cacheKey]: Date.now()
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

      setCurrentDate: (date: Date) => {
        console.log('📊 TrendsStore: Setting current date to:', date.toDateString());
        set({ currentDate: date });
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
            
            // Clear related cache keys
            const newLastUpdated = { ...state.lastUpdated };
            Object.keys(newLastUpdated).forEach(key => {
              if (key.startsWith(focusId + '_')) {
                delete newLastUpdated[key];
              }
            });
            
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
      getTrendsData: (focusId: string, period?: TrendsPeriod, referenceDate?: Date) => {
        const targetPeriod = period || get().currentPeriod;
        const targetDate = referenceDate || get().currentDate;
        const cacheKey = getCacheKey(focusId, targetPeriod, targetDate);
        return get().trendsData[focusId]?.[cacheKey] || null;
      },

      isDataStale: (focusId: string, period: TrendsPeriod, referenceDate: Date, maxAgeMinutes: number = 5) => {
        const cacheKey = getCacheKey(focusId, period, referenceDate);
        const lastUpdate = get().lastUpdated[cacheKey];
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
        currentPeriod: state.currentPeriod,
        // Don't persist data, loading states, or currentDate
      }),
    }
  )
);

// Helper hooks for common use cases
export const useTrendsData = (focusId: string) => {
  const store = useTrendsStore();
  
  React.useEffect(() => {
    if (focusId) {
      store.loadTrendsData(focusId, store.currentPeriod, store.currentDate);
    }
  }, [focusId, store.currentPeriod.value, store.currentDate.toDateString()]);
  
  return {
    data: store.getTrendsData(focusId, store.currentPeriod, store.currentDate),
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    error: store.error,
    refresh: () => store.refreshTrendsData(focusId, store.currentPeriod, store.currentDate),
    clearError: store.clearError
  };
};

export const useTrendsPeriod = () => {
  const { currentPeriod, currentDate, setPeriod, setCurrentDate } = useTrendsStore();
  
  return {
    currentPeriod,
    currentDate,
    setPeriod,
    setCurrentDate,
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