import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore } from '@/store';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

export const CalendarScreen: React.FC = () => {
  const { activeFocus } = useFocusStore();

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  return (
    <View style={styles.container}>
      <TopBar 
        title={`${activeFocus?.name || 'Focus'} Calendar`}
        emoji={activeFocus?.emoji}
        gradient={true}
        focusColor={activeFocus?.color}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Calendar Screen</Text>
        <Text style={styles.subtitle}>To be implemented</Text>
      </View>
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
});