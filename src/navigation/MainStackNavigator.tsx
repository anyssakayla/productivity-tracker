import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainNavigator } from './MainNavigator';
import { CategoryManagementScreen } from '@/screens/main/CategoryManagementScreen';
import { CategoryDetailScreen } from '@/screens/main/CategoryDetailScreen';
import { FocusManagementScreen } from '@/screens/main/FocusManagementScreen';
import { SettingsScreen } from '@/screens/main/SettingsScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  CategoryManagement: undefined;
  CategoryDetail: { categoryId: string };
  FocusManagement: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Screen 
        name="CategoryManagement" 
        component={CategoryManagementScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen}
      />
      <Stack.Screen 
        name="FocusManagement" 
        component={FocusManagementScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
};