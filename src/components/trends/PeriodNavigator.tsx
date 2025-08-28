import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { TrendsPeriod } from '@/types';
import { TRENDS_PERIODS } from '@/services/trends/TrendsService';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, isAfter } from 'date-fns';

// Utility function to calculate luminance for contrast
const getLuminance = (color: string): number => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
};

// Predefined color mappings for optimal contrast
const predefinedColorMap: Record<string, string> = {
  '#FFD93D': '#000000', // Yellow -> Black
  '#A8E6CF': '#000000', // Mint -> Black
  '#DDA0DD': '#000000', // Plum -> Black
  '#96CEB4': '#000000', // Sage Green -> Black
  '#4ECDC4': '#000000', // Teal -> Black
  '#45B7D1': '#FFFFFF', // Sky Blue -> White
  '#FF6B6B': '#FFFFFF', // Coral -> White
  '#FF8C42': '#FFFFFF', // Orange -> White
  '#6C5CE7': '#FFFFFF', // Purple -> White
  '#3498DB': '#FFFFFF', // Blue -> White
  '#2ECC71': '#FFFFFF', // Green -> White
  '#E74C3C': '#FFFFFF', // Red -> White
};

// Get optimal text color for background
const getOptimalTextColor = (backgroundColor: string): string => {
  // Check predefined mappings first
  if (predefinedColorMap[backgroundColor.toUpperCase()]) {
    return predefinedColorMap[backgroundColor.toUpperCase()];
  }
  
  // Fall back to luminance calculation
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

interface PeriodNavigatorProps {
  selectedPeriod: TrendsPeriod;
  currentDate: Date;
  onPeriodChange: (period: TrendsPeriod) => void;
  onDateChange: (date: Date) => void;
  focusColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const PeriodNavigator: React.FC<PeriodNavigatorProps> = ({
  selectedPeriod,
  currentDate,
  onPeriodChange,
  onDateChange,
  focusColor = Colors.focus.work
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const today = new Date();

  // Calculate if we can navigate forward (not into the future)
  const canNavigateForward = () => {
    if (selectedPeriod.value === 'all') return false;
    
    const nextDate = getNextDate();
    const nextStart = getStartDate(nextDate);
    // Allow navigation if the start of the next period is today or in the past
    return !isAfter(nextStart, today);
  };

  const getNextDate = (): Date => {
    switch (selectedPeriod.value) {
      case 'week':
        return addWeeks(currentDate, 1);
      case 'month':
        return addMonths(currentDate, 1);
      case '3months':
        return addMonths(currentDate, 3);
      case 'year':
        return addYears(currentDate, 1);
      default:
        return currentDate;
    }
  };

  const getPreviousDate = (): Date => {
    switch (selectedPeriod.value) {
      case 'week':
        return subWeeks(currentDate, 1);
      case 'month':
        return subMonths(currentDate, 1);
      case '3months':
        return subMonths(currentDate, 3);
      case 'year':
        return subYears(currentDate, 1);
      default:
        return currentDate;
    }
  };

  const getStartDate = (date: Date): Date => {
    switch (selectedPeriod.value) {
      case 'week':
        return startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
      case 'month':
        return startOfMonth(date);
      case '3months':
        // Start of 3-month period (quarter-like but based on current month)
        const currentMonth = date.getMonth();
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return new Date(date.getFullYear(), quarterStart, 1);
      case 'year':
        return startOfYear(date);
      default:
        return new Date('2020-01-01'); // All time start
    }
  };

  const getEndDate = (date: Date): Date => {
    switch (selectedPeriod.value) {
      case 'week':
        return endOfWeek(date, { weekStartsOn: 1 }); // End on Sunday
      case 'month':
        return endOfMonth(date);
      case '3months':
        const currentMonth = date.getMonth();
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return endOfMonth(new Date(date.getFullYear(), quarterStart + 2, 1));
      case 'year':
        return endOfYear(date);
      default:
        return today; // All time end
    }
  };

  const formatDateRange = (): string => {
    const startDate = getStartDate(currentDate);
    const endDate = getEndDate(currentDate);

    switch (selectedPeriod.value) {
      case 'week':
        if (startDate.getMonth() === endDate.getMonth()) {
          return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
        } else {
          return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
        }
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case '3months':
        const start3Month = getStartDate(currentDate);
        const end3Month = getEndDate(currentDate);
        return `${format(start3Month, 'MMM')} - ${format(end3Month, 'MMM yyyy')}`;
      case 'year':
        return format(currentDate, 'yyyy');
      case 'all':
        return 'All Time';
      default:
        return 'Unknown Period';
    }
  };

  const handlePreviousPress = () => {
    const previousDate = getPreviousDate();
    onDateChange(previousDate);
  };

  const handleNextPress = () => {
    if (canNavigateForward()) {
      const nextDate = getNextDate();
      onDateChange(nextDate);
    }
  };

  const handlePeriodSelect = (period: TrendsPeriod) => {
    onPeriodChange(period);
    setShowDropdown(false);
    
    // Reset to current period when changing period type
    if (period.value !== 'all') {
      onDateChange(today);
    }
  };

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(dropdownAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowDropdown(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigator}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.leftButton,
            selectedPeriod.value === 'all' && styles.disabledButton
          ]}
          onPress={handlePreviousPress}
          disabled={selectedPeriod.value === 'all'}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navButtonText,
            { color: focusColor },
            selectedPeriod.value === 'all' && styles.disabledButtonText
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Period Display */}
        <TouchableOpacity
          style={[styles.periodButton, { borderColor: `${focusColor}30` }]}
          onPress={openDropdown}
          activeOpacity={0.8}
        >
          <View style={styles.periodContent}>
            <Text style={[styles.periodType, { color: focusColor }]}>
              {selectedPeriod.label}
            </Text>
            <Text style={styles.dateRange}>
              {formatDateRange()}
            </Text>
          </View>
          <Text style={[styles.dropdownIcon, { color: focusColor }]}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.rightButton,
            (!canNavigateForward() || selectedPeriod.value === 'all') && styles.disabledButton
          ]}
          onPress={handleNextPress}
          disabled={!canNavigateForward() || selectedPeriod.value === 'all'}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navButtonText,
            { color: focusColor },
            (!canNavigateForward() || selectedPeriod.value === 'all') && styles.disabledButtonText
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <Animated.View
            style={[
              styles.dropdown,
              {
                opacity: dropdownAnimation,
                transform: [{
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                }],
              }
            ]}
          >
            {TRENDS_PERIODS.map((period) => {
              const isSelected = period.value === selectedPeriod.value;
              const isHovered = hoveredItem === period.value;
              const shouldHighlight = isSelected || isHovered;
              const optimalTextColor = getOptimalTextColor(focusColor);
              
              return (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.dropdownItem,
                    shouldHighlight && {
                      backgroundColor: focusColor,
                    }
                  ]}
                  onPress={() => handlePeriodSelect(period)}
                  onPressIn={() => setHoveredItem(period.value)}
                  onPressOut={() => setHoveredItem(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    shouldHighlight && {
                      color: optimalTextColor,
                      fontWeight: '600'
                    }
                  ]}>
                    {period.label}
                  </Text>
                  {period.days && (
                    <Text style={[
                      styles.dropdownItemSubtext,
                      shouldHighlight && {
                        color: optimalTextColor,
                        opacity: 0.8
                      }
                    ]}>
                      {period.days}d
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.large,
    marginHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftButton: {
    marginRight: Spacing.base,
  },
  rightButton: {
    marginLeft: Spacing.base,
  },
  disabledButton: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  disabledButtonText: {
    color: Colors.text.light,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
  },
  periodContent: {
    flex: 1,
    alignItems: 'center',
  },
  periodType: {
    ...Typography.body.medium,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateRange: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  dropdownIcon: {
    ...Typography.body.small,
    marginLeft: Spacing.sm,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 120, // Position dropdown below the navigator
  },
  dropdown: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.padding.screen,
    borderRadius: Spacing.borderRadius.large,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedDropdownItem: {
    // Removed - styling now handled dynamically in component
  },
  dropdownItemText: {
    ...Typography.body.medium,
    color: Colors.text.dark,
  },
  dropdownItemSubtext: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});