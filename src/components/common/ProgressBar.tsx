import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  backgroundColor = Colors.ui.borderLight,
  progressColor = Colors.primary.solid,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
});