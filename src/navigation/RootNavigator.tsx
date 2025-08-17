import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '@/store';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { hasCompletedOnboarding, isInitialized, initializeApp } = useAppStore();
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  if (!isInitialized) {
    // Could show a splash screen here
    return null;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {hasCompletedOnboarding ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};