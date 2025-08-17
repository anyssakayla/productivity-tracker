import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';

export const CalendarScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <TopBar 
        title="Work Calendar"
        gradient={true}
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