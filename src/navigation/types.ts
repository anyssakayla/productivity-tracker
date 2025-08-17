import { NavigatorScreenParams } from '@react-navigation/native';
import { CategoryFormData, FocusFormData, ProfileFormData } from '@/types';

// Root Stack
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  FocusSelection: { profile: ProfileFormData };
  CategorySetup: { 
    profile: ProfileFormData;
    focus: FocusFormData;
  };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Trends: undefined;
  Calendar: undefined;
  Profile: undefined;
};

// Modal Stack
export type ModalStackParamList = {
  TaskEntry: { categoryId: string; categoryName: string };
  CountEntry: { categoryId: string; categoryName: string };
  TimeEntry: { 
    categoryId: string; 
    categoryName: string;
    type: 'clock' | 'duration';
  };
  FocusSwitcher: undefined;
  CategoryManager: { focusId: string };
  FocusManager: undefined;
};