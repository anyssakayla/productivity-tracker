import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainNavigator } from './MainNavigator';
import { CategoryManagementScreen } from '@/screens/main/CategoryManagementScreen';
import { CategoryDetailScreen } from '@/screens/main/CategoryDetailScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  CategoryManagement: undefined;
  CategoryDetail: { categoryId: string };
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
    </Stack.Navigator>
  );
};