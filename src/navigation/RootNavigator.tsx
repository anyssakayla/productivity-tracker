import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '@/store';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { RootStackParamList } from './types';
import { Colors } from '@/constants';

const Stack = createStackNavigator<RootStackParamList>();

// Custom theme for NavigationContainer
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary.solid,
    background: Colors.background.secondary,
    card: Colors.background.primary,
    text: Colors.text.primary,
    border: Colors.ui.border,
  },
};

export const RootNavigator: React.FC = () => {
  const { hasCompletedOnboarding, isInitialized, initializeApp } = useAppStore();
  
  useEffect(() => {
    console.log('🧭 RootNavigator: Component mounted, initializing app...');
    initializeApp();
  }, []);
  
  console.log('🧭 RootNavigator: Render - isInitialized:', isInitialized, 'hasCompletedOnboarding:', hasCompletedOnboarding);
  
  if (!isInitialized) {
    console.log('🧭 RootNavigator: App not initialized yet, showing loading state');
    // Could show a splash screen here
    return null;
  }
  
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {hasCompletedOnboarding ? (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};