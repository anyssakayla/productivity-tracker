import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
// Placeholder screens - will be implemented in Phase 6
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';
import { FocusSelectionScreen } from '@/screens/onboarding/FocusSelectionScreen';
import { CategorySetupScreen } from '@/screens/onboarding/CategorySetupScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f0f2f5' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="FocusSelection" component={FocusSelectionScreen} />
      <Stack.Screen name="CategorySetup" component={CategorySetupScreen} />
    </Stack.Navigator>
  );
};