import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Category, TimeEntry } from '@/types';
import { Colors, Typography, Spacing } from '@/constants';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

interface TimeClockWidgetProps {
  category: Category;
  activeClockEntry?: TimeEntry | null;
  onClockIn: () => void;
  onClockOut: () => void;
  focusColor?: string;
}

export const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({
  category,
  activeClockEntry,
  onClockIn,
  onClockOut,
  focusColor,
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isActive, setIsActive] = useState(false);

  const themeColors = focusColor 
    ? generateThemeFromFocus(focusColor)
    : DEFAULT_THEME_COLORS;

  // Calculate elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeClockEntry?.startTime && !activeClockEntry.endTime) {
      setIsActive(true);
      
      const updateElapsedTime = () => {
        const start = new Date(activeClockEntry.startTime!);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };
      
      updateElapsedTime(); // Initial update
      interval = setInterval(updateElapsedTime, 1000);
    } else {
      setIsActive(false);
      setElapsedTime('00:00:00');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeClockEntry]);

  return (
    <View style={[styles.container, { borderColor: themeColors.primary.solid }]}>
      <View style={styles.header}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>
      
      <View style={styles.timeDisplay}>
        <Text style={[styles.timeText, isActive && { color: themeColors.primary.solid }]}>
          {elapsedTime}
        </Text>
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: themeColors.primary.solid }]} />
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.button,
          isActive 
            ? { backgroundColor: Colors.status.error }
            : { backgroundColor: themeColors.primary.solid }
        ]}
        onPress={isActive ? onClockOut : onClockIn}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isActive ? '⏹️ Clock Out' : '▶️ Clock In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.base,
    shadowColor: Colors.ui.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  categoryName: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '600',
    flex: 1,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  timeText: {
    ...Typography.heading.h2,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: 'bold',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    right: -20,
    top: '50%',
    marginTop: -4,
  },
  button: {
    borderRadius: Spacing.borderRadius.button,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.button.regular,
    color: Colors.text.white,
    fontWeight: '600',
  },
});