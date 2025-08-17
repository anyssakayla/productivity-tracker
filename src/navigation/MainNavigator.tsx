import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { Colors, Spacing } from '@/constants';
// Placeholder screens - will be implemented in Phase 7
import { HomeScreen } from '@/screens/main/HomeScreen';
import { TrendsScreen } from '@/screens/main/TrendsScreen';
import { CalendarScreen } from '@/screens/main/CalendarScreen';
import { ProfileScreen } from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps & { name: string }> = ({ focused, color, size, name }) => {
  // Simple placeholder icon
  return (
    <View
      style={[
        styles.tabIcon,
        { backgroundColor: focused ? color : Colors.navigation.tabIconDefault },
      ]}
    />
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.navigation.tabIconActive,
        tabBarInactiveTintColor: Colors.navigation.tabIconDefault,
        tabBarStyle: {
          height: Spacing.layout.bottomNavHeight,
          backgroundColor: Colors.navigation.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.navigation.tabBarBorder,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: (props) => <TabIcon {...props} name="home" />,
        }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{
          tabBarIcon: (props) => <TabIcon {...props} name="trends" />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: (props) => <TabIcon {...props} name="calendar" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: (props) => <TabIcon {...props} name="profile" />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
});