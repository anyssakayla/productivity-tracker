import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';

interface StatusBarProps {
  time?: string;
  battery?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '9:41 AM',
  battery = '100%',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{time}</Text>
      <Text style={styles.text}>{battery}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Spacing.layout.statusBarHeight,
    backgroundColor: Colors.background.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  text: {
    ...Typography.body.small,
    color: Colors.text.primary,
  },
});