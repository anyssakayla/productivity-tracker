// User types
export interface User {
  id: string;
  name: string;
  email: string;
  birthday?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

// Focus types
export interface Focus {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex color
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Category types
export enum TimeType {
  CLOCK = 'CLOCK',      // Clock in/out functionality
  DURATION = 'DURATION', // Just enter duration
  NONE = 'NONE'         // No time tracking
}

export interface Category {
  id: string;
  focusId: string;
  name: string;
  emoji: string;
  color: string; // hex color
  timeType: TimeType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Task for categories
export interface Task {
  id: string;
  categoryId: string;
  name: string;
  isRecurring: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Entry types
export interface Entry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  focusId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

// Task completion for tracking task quantities
export interface TaskCompletion {
  id: string;
  entryId: string;
  taskId: string;
  taskName: string; // For 'other' tasks
  quantity: number;
  duration?: number; // Duration in minutes for DURATION type tasks
  isOtherTask: boolean;
  createdAt: string;
}

// Time entries
export interface TimeEntry {
  id: string;
  entryId: string;
  type: TimeType;
  startTime?: string; // ISO datetime for CLOCK type
  endTime?: string;   // ISO datetime for CLOCK type
  duration?: number;  // minutes for DURATION type
  createdAt: string;
  updatedAt: string;
}

// Aggregate types for queries
export interface DailyAggregate {
  date: string;
  focusId: string;
  categoryId: string;
  totalQuantity?: number;
  totalMinutes?: number;
}

export interface CategoryWithTasks extends Category {
  tasks?: Task[];
}

export interface EntryWithTaskCompletions extends Entry {
  taskCompletions?: TaskCompletion[];
  timeEntry?: TimeEntry;
  category?: Category;
}

// Form types
export interface ProfileFormData {
  name: string;
  email: string;
  birthday?: string;
}

export interface FocusFormData {
  name: string;
  emoji: string;
  color: string;
}

export interface CategoryFormData {
  name: string;
  emoji: string;
  color: string;
  timeType: TimeType;
}

// App state types
export interface AppSettings {
  hasCompletedOnboarding: boolean;
  defaultFocusId?: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  exportEmail?: string;
}

export interface OnboardingState {
  currentStep: number;
  profile?: ProfileFormData;
  firstFocus?: FocusFormData;
  categories?: CategoryFormData[];
}

export interface TaskFormData {
  name: string;
  isRecurring: boolean;
}

export interface TaskCompletionFormData {
  taskId?: string;
  taskName?: string;
  quantity: number;
  isOtherTask: boolean;
}

// Trends types
export * from './trends';