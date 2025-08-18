import { create } from 'zustand';
import { 
  Category, 
  CategoryWithTasks, 
  CategoryFormData 
} from '@/types';
import { DatabaseService } from '@/services/database';

interface CategoryState {
  categories: Record<string, CategoryWithTasks[]>; // Keyed by focusId
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCategoriesByFocus: (focusId: string) => Promise<void>;
  createCategory: (focusId: string, data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<void>;
  deleteCategory: (id: string, focusId: string) => Promise<void>;
  reorderCategories: (focusId: string, categoryIds: string[]) => Promise<void>;
  
  clearError: () => void;
  clearCategoriesForFocus: (focusId: string) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: {},
  isLoading: false,
  error: null,

  loadCategoriesByFocus: async (focusId: string) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await DatabaseService.getCategoriesByFocus(focusId);
      set((state) => ({
        categories: { ...state.categories, [focusId]: categories },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load categories',
        isLoading: false 
      });
    }
  },

  createCategory: async (focusId: string, data: CategoryFormData) => {
    set({ isLoading: true, error: null });
    try {
      // Create the category
      const category = await DatabaseService.createCategory({
        ...data,
        focusId,
        timeType: data.timeType
      });

      // Reload categories for this focus
      await get().loadCategoriesByFocus(focusId);
      
      return category;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create category',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCategory: async (id: string, data: Partial<CategoryFormData>) => {
    set({ isLoading: true, error: null });
    try {
      // Update in database (would need to add this method to DatabaseService)
      // await DatabaseService.updateCategory(id, data);
      
      // Update in local state
      set((state) => {
        const newCategories = { ...state.categories };
        
        Object.keys(newCategories).forEach(focusId => {
          newCategories[focusId] = newCategories[focusId].map(category =>
            category.id === id ? { ...category, ...data } : category
          );
        });
        
        return { categories: newCategories, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update category',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteCategory: async (id: string, focusId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Delete from database
      await DatabaseService.deleteCategory(id);
      
      set((state) => ({
        categories: {
          ...state.categories,
          [focusId]: state.categories[focusId]?.filter(c => c.id !== id) || []
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete category',
        isLoading: false 
      });
      throw error;
    }
  },

  reorderCategories: async (focusId: string, categoryIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      // Update order in database (would need to add this method to DatabaseService)
      // await DatabaseService.reorderCategories(categoryIds);
      
      const focusCategories = get().categories[focusId] || [];
      const reorderedCategories = categoryIds
        .map((id, index) => {
          const category = focusCategories.find(c => c.id === id);
          return category ? { ...category, order: index } : null;
        })
        .filter((c): c is CategoryWithTasks => c !== null);
      
      set((state) => ({
        categories: {
          ...state.categories,
          [focusId]: reorderedCategories
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reorder categories',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearCategoriesForFocus: (focusId: string) => {
    set((state) => {
      const newCategories = { ...state.categories };
      delete newCategories[focusId];
      return { categories: newCategories };
    });
  }
}));