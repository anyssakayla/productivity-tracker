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
export enum CategoryType {
  TYPE_IN = 'TYPE_IN',        // User types different tasks each day
  SELECT_COUNT = 'SELECT_COUNT' // Pre-set subcategories with quantities
}

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
  type: CategoryType;
  timeType: TimeType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Subcategory for SELECT_COUNT type categories
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  order: number;
  isActive: boolean;
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

// Task entry for TYPE_IN categories
export interface TaskEntry {
  id: string;
  entryId: string;
  description: string;
  order: number;
  createdAt: string;
}

// Count entry for SELECT_COUNT categories
export interface CountEntry {
  id: string;
  entryId: string;
  subcategoryId: string;
  quantity: number;
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
  taskCount?: number;
  totalQuantity?: number;
  totalMinutes?: number;
}

export interface CategoryWithSubcategories extends Category {
  subcategories?: Subcategory[];
}

export interface EntryWithDetails extends Entry {
  tasks?: TaskEntry[];
  counts?: CountEntry[];
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
  type: CategoryType;
  timeType: TimeType;
  subcategories?: string[]; // For SELECT_COUNT type
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