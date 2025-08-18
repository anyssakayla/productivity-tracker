import { create } from 'zustand';
import { Task, TaskFormData, TaskCompletion, TaskCompletionFormData } from '@/types';
import { DatabaseService } from '@/services/database';

interface TaskState {
  tasks: Record<string, Task[]>; // Keyed by categoryId
  taskCompletions: Record<string, TaskCompletion[]>; // Keyed by entryId
  isLoading: boolean;
  error: string | null;

  // Task Actions
  loadTasksByCategory: (categoryId: string) => Promise<void>;
  createTask: (categoryId: string, data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: string, categoryId: string) => Promise<void>;
  reorderTasks: (categoryId: string, taskIds: string[]) => Promise<void>;

  // Task Completion Actions
  loadTaskCompletionsByEntry: (entryId: string) => Promise<void>;
  createTaskCompletion: (data: TaskCompletionFormData & { entryId: string }) => Promise<TaskCompletion>;
  updateTaskCompletion: (id: string, data: Partial<TaskCompletionFormData>) => Promise<void>;
  deleteTaskCompletion: (id: string, entryId: string) => Promise<void>;

  clearError: () => void;
  clearTasksForCategory: (categoryId: string) => void;
  clearCompletionsForEntry: (entryId: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: {},
  taskCompletions: {},
  isLoading: false,
  error: null,

  loadTasksByCategory: async (categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await DatabaseService.getTasksByCategory(categoryId);
      set((state) => ({
        tasks: { ...state.tasks, [categoryId]: tasks },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        isLoading: false 
      });
    }
  },

  createTask: async (categoryId: string, data: TaskFormData) => {
    set({ isLoading: true, error: null });
    try {
      const task = await DatabaseService.createTask({
        ...data,
        categoryId
      });

      // Reload tasks for this category
      await get().loadTasksByCategory(categoryId);
      
      return task;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<TaskFormData>) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.updateTask(id, data);
      
      // Update in local state
      set((state) => {
        const newTasks = { ...state.tasks };
        
        Object.keys(newTasks).forEach(categoryId => {
          newTasks[categoryId] = newTasks[categoryId].map(task =>
            task.id === id ? { ...task, ...data } : task
          );
        });
        
        return { tasks: newTasks, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteTask: async (id: string, categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.deleteTask(id);
      
      set((state) => ({
        tasks: {
          ...state.tasks,
          [categoryId]: state.tasks[categoryId]?.filter(t => t.id !== id) || []
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false 
      });
      throw error;
    }
  },

  reorderTasks: async (categoryId: string, taskIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      // Update order in database (would need to add this method to DatabaseService)
      // For now, just update local state
      
      const categoryTasks = get().tasks[categoryId] || [];
      const reorderedTasks = taskIds
        .map((id, index) => {
          const task = categoryTasks.find(t => t.id === id);
          return task ? { ...task, order: index } : null;
        })
        .filter((t): t is Task => t !== null);
      
      set((state) => ({
        tasks: {
          ...state.tasks,
          [categoryId]: reorderedTasks
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reorder tasks',
        isLoading: false 
      });
      throw error;
    }
  },

  loadTaskCompletionsByEntry: async (entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      const completions = await DatabaseService.getTaskCompletionsByEntry(entryId);
      set((state) => ({
        taskCompletions: { ...state.taskCompletions, [entryId]: completions },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load task completions',
        isLoading: false 
      });
    }
  },

  createTaskCompletion: async (data: TaskCompletionFormData & { entryId: string }) => {
    set({ isLoading: true, error: null });
    try {
      const completion = await DatabaseService.createTaskCompletion({
        entryId: data.entryId,
        taskId: data.taskId || '',
        taskName: data.taskName || '',
        quantity: data.quantity,
        isOtherTask: data.isOtherTask
      });

      // Reload completions for this entry
      await get().loadTaskCompletionsByEntry(data.entryId);
      
      return completion;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task completion',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTaskCompletion: async (id: string, data: Partial<TaskCompletionFormData>) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.updateTaskCompletion(id, data);
      
      // Update in local state
      set((state) => {
        const newCompletions = { ...state.taskCompletions };
        
        Object.keys(newCompletions).forEach(entryId => {
          newCompletions[entryId] = newCompletions[entryId].map(completion =>
            completion.id === id ? { ...completion, ...data } : completion
          );
        });
        
        return { taskCompletions: newCompletions, isLoading: false };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task completion',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteTaskCompletion: async (id: string, entryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.deleteTaskCompletion(id);
      
      set((state) => ({
        taskCompletions: {
          ...state.taskCompletions,
          [entryId]: state.taskCompletions[entryId]?.filter(c => c.id !== id) || []
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task completion',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearTasksForCategory: (categoryId: string) => {
    set((state) => {
      const newTasks = { ...state.tasks };
      delete newTasks[categoryId];
      return { tasks: newTasks };
    });
  },
  
  clearCompletionsForEntry: (entryId: string) => {
    set((state) => {
      const newCompletions = { ...state.taskCompletions };
      delete newCompletions[entryId];
      return { taskCompletions: newCompletions };
    });
  }
}));