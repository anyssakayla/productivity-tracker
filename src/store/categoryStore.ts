import { create } from 'zustand';
import { 
  Category, 
  CategoryWithSubcategories, 
  Subcategory, 
  CategoryFormData,
  CategoryType 
} from '@/types';
import { DatabaseService } from '@/services/database';

interface CategoryState {
  categories: Record<string, CategoryWithSubcategories[]>; // Keyed by focusId
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCategoriesByFocus: (focusId: string) => Promise<void>;
  createCategory: (focusId: string, data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<void>;
  deleteCategory: (id: string, focusId: string) => Promise<void>;
  reorderCategories: (focusId: string, categoryIds: string[]) => Promise<void>;
  
  // Subcategory actions
  createSubcategory: (categoryId: string, name: string) => Promise<void>;
  updateSubcategory: (id: string, name: string) => Promise<void>;
  deleteSubcategory: (id: string, categoryId: string) => Promise<void>;
  toggleSubcategory: (id: string, categoryId: string) => Promise<void>;
  
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
        type: data.type,
        timeType: data.timeType
      });

      // Create subcategories if it's a SELECT_COUNT type
      if (data.type === CategoryType.SELECT_COUNT && data.subcategories) {
        await Promise.all(
          data.subcategories.map(name => 
            DatabaseService.createSubcategory({
              categoryId: category.id,
              name,
              isActive: true
            })
          )
        );
      }

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
      // Delete from database (would need to add this method to DatabaseService)
      // await DatabaseService.deleteCategory(id);
      
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
        .filter((c): c is CategoryWithSubcategories => c !== null);
      
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

  createSubcategory: async (categoryId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.createSubcategory({
        categoryId,
        name,
        isActive: true
      });
      
      // Find the focus that contains this category and reload
      const { categories } = get();
      const focusId = Object.keys(categories).find(fId =>
        categories[fId].some(c => c.id === categoryId)
      );
      
      if (focusId) {
        await get().loadCategoriesByFocus(focusId);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create subcategory',
        isLoading: false 
      });
      throw error;
    }
  },

  updateSubcategory: async (id: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      // Update in database (would need to add this method to DatabaseService)
      // await DatabaseService.updateSubcategory(id, { name });
      
      // Update in local state
      set((state) => {
        const newCategories = { ...state.categories };
        
        Object.keys(newCategories).forEach(focusId => {
          newCategories[focusId] = newCategories[focusId].map(category => ({
            ...category,
            subcategories: category.subcategories?.map(sub =>
              sub.id === id ? { ...sub, name } : sub
            )
          }));
        });
        
        return { categories: newCategories, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update subcategory',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteSubcategory: async (id: string, categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Delete from database (would need to add this method to DatabaseService)
      // await DatabaseService.deleteSubcategory(id);
      
      set((state) => {
        const newCategories = { ...state.categories };
        
        Object.keys(newCategories).forEach(focusId => {
          newCategories[focusId] = newCategories[focusId].map(category =>
            category.id === categoryId
              ? {
                  ...category,
                  subcategories: category.subcategories?.filter(sub => sub.id !== id)
                }
              : category
          );
        });
        
        return { categories: newCategories, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete subcategory',
        isLoading: false 
      });
      throw error;
    }
  },

  toggleSubcategory: async (id: string, categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Toggle in database (would need to add this method to DatabaseService)
      // await DatabaseService.toggleSubcategory(id);
      
      set((state) => {
        const newCategories = { ...state.categories };
        
        Object.keys(newCategories).forEach(focusId => {
          newCategories[focusId] = newCategories[focusId].map(category =>
            category.id === categoryId
              ? {
                  ...category,
                  subcategories: category.subcategories?.map(sub =>
                    sub.id === id ? { ...sub, isActive: !sub.isActive } : sub
                  )
                }
              : category
          );
        });
        
        return { categories: newCategories, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle subcategory',
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