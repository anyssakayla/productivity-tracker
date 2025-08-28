import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore } from '@/store';
import { FocusSwitcherModal } from './FocusSwitcherModal';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';

type CalendarScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Calendar'>;

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { activeFocus } = useFocusStore();
  const [showFocusSwitcher, setShowFocusSwitcher] = useState(false);

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as any);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as any);
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title={activeFocus?.name || 'ProductiTrack'}
        emoji={activeFocus?.emoji}
        gradient={true}
        focusColor={activeFocus?.color}
        onTitlePress={() => setShowFocusSwitcher(true)}
        rightIcon={
          <Text style={[styles.settingsIcon, { color: themeColors.contrastText }]}>
            ⚙
          </Text>
        }
        onRightPress={handleSettingsPress}
        profileIcon={
          <Ionicons 
            name="person-circle-outline" 
            size={24} 
            color={themeColors.contrastText}
          />
        }
        onProfilePress={handleProfilePress}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Calendar Screen</Text>
        <Text style={styles.subtitle}>To be implemented</Text>
      </View>
      
      <FocusSwitcherModal
        visible={showFocusSwitcher}
        onClose={() => setShowFocusSwitcher(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
  settingsIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});