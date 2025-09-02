import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Pressable,
  RefreshControl,
  Alert
} from 'react-native';
import { PanGestureHandler, State as GestureState } from 'react-native-gesture-handler';
import { TopBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore, useCategoryStore } from '@/store';
import { FocusSwitcherModal } from './FocusSwitcherModal';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { formatDate } from '@/utils/helpers';
import { DatabaseService } from '@/services/database';
import { EntryWithTaskCompletions } from '@/types';

type CalendarScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Calendar'>;

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasActivity: boolean;
  entries?: EntryWithTaskCompletions[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { activeFocus } = useFocusStore();
  const { getCategories, loadCategoriesByFocus } = useCategoryStore();
  const [showFocusSwitcher, setShowFocusSwitcher] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<Record<string, EntryWithTaskCompletions[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  // Generate calendar days for the current month
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and how many days in month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get first day of week (0 = Sunday)
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    const todayString = formatDate(today);
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonth.getDate() - i);
      const dateString = formatDate(prevDate);
      days.push({
        date: prevDate,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate === dateString,
        hasActivity: !!monthlyEntries[dateString]?.length,
        entries: monthlyEntries[dateString] || []
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dateString = formatDate(currentDay);
      days.push({
        date: currentDay,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isSelected: selectedDate === dateString,
        hasActivity: !!monthlyEntries[dateString]?.length,
        entries: monthlyEntries[dateString] || []
      });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateString = formatDate(nextDate);
      days.push({
        date: nextDate,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate === dateString,
        hasActivity: !!monthlyEntries[dateString]?.length,
        entries: monthlyEntries[dateString] || []
      });
    }
    
    return days;
  };

  // Load entries for the current month
  const loadMonthlyEntries = async (date: Date, focusId?: string) => {
    if (!activeFocus && !focusId) return;
    
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Get date range for current month (include some buffer for previous/next month)
      const startDate = new Date(year, month - 1, 15); // Mid previous month
      const endDate = new Date(year, month + 2, 15);   // Mid next month
      
      const entries: Record<string, EntryWithTaskCompletions[]> = {};
      
      // Load entries for each day in the range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = formatDate(currentDate);
        try {
          const dayEntries = await DatabaseService.getEntriesByDate(dateString, focusId || activeFocus?.id);
          if (dayEntries.length > 0) {
            entries[dateString] = dayEntries;
          }
        } catch (error) {
          console.warn(`Failed to load entries for ${dateString}:`, error);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setMonthlyEntries(entries);
    } catch (error) {
      console.error('Failed to load monthly entries:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    }
  };

  // Refresh calendar data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMonthlyEntries(currentDate, activeFocus?.id);
    setIsRefreshing(false);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null); // Clear selection when changing months
  };

  // Handle swipe gestures for month navigation
  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === GestureState.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Minimum swipe distance and velocity to trigger navigation
      const minSwipeDistance = 50;
      const minVelocity = 500;
      
      if (Math.abs(translationX) > minSwipeDistance || Math.abs(velocityX) > minVelocity) {
        if (translationX > 0) {
          // Swipe right - go to previous month
          navigateMonth('prev');
        } else {
          // Swipe left - go to next month
          navigateMonth('next');
        }
      }
    }
  };

  // Jump to today
  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDate(today));
  };

  // Handle date press
  const handleDatePress = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      // If clicking on previous/next month day, navigate to that month
      setCurrentDate(new Date(day.date));
      setSelectedDate(day.dateString);
    } else {
      setSelectedDate(day.dateString);
    }
  };

  // Handle long press for quick add entry
  const handleDateLongPress = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.dateString);
      // Show add entry modal
      Alert.alert(
        'Quick Add Entry',
        `Add an entry for ${day.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Entry',
            onPress: () => {
              // TODO: Open add entry modal with pre-selected date
              Alert.alert('Add Entry', 'Add entry modal will open here');
            },
          },
        ]
      );
    }
  };

  // Generate smart activity dots
  const generateActivityDots = (entries: EntryWithTaskCompletions[], isSelected: boolean) => {
    if (!entries.length) return null;

    // Group entries by category and calculate activity score
    const categoryStats = entries.reduce((acc, entry) => {
      const categoryId = entry.categoryId;
      const taskCount = entry.taskCompletions?.length || 0;
      const timeMinutes = entry.timeEntry?.duration || 0;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: entry.category,
          taskCount: 0,
          timeMinutes: 0,
          activityScore: 0
        };
      }
      
      acc[categoryId].taskCount += taskCount;
      acc[categoryId].timeMinutes += timeMinutes;
      // Activity score: tasks weighted more than time
      acc[categoryId].activityScore += taskCount * 2 + Math.min(timeMinutes / 30, 4);
      
      return acc;
    }, {} as Record<string, {
      category?: any;
      taskCount: number;
      timeMinutes: number;
      activityScore: number;
    }>);

    // Sort categories by activity score (highest first)
    const sortedCategories = Object.values(categoryStats)
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 3); // Max 3 dots

    // Determine dot sizes based on activity score
    const getDotSize = (score: number, index: number) => {
      if (index === 0) { // Primary dot (most active)
        if (score >= 10) return 6; // Large
        if (score >= 5) return 5;  // Medium
        return 4; // Small
      } else { // Secondary dots
        return 3; // Always small for secondary
      }
    };

    const dotColor = isSelected ? 'rgba(255, 255, 255, 0.9)' : undefined;

    return (
      <View style={styles.dotsContainer}>
        {sortedCategories.map((categoryStat, index) => {
          const size = getDotSize(categoryStat.activityScore, index);
          const color = dotColor || categoryStat.category?.color || activeFocus?.color;
          
          return (
            <View
              key={`${categoryStat.category?.id}-${index}`}
              style={[
                styles.activityDot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: color,
                  marginHorizontal: index > 0 ? 1 : 0,
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Load data when component mounts or focus/date changes
  useEffect(() => {
    if (activeFocus) {
      loadMonthlyEntries(currentDate, activeFocus.id);
      loadCategoriesByFocus(activeFocus.id);
    }
  }, [activeFocus?.id, currentDate]);

  // Regenerate calendar days when current date, selected date, or entries change
  useEffect(() => {
    setCalendarDays(generateCalendarDays(currentDate));
  }, [currentDate, selectedDate, monthlyEntries]);

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as any);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as any);
  };

  if (!activeFocus) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="ProductiTrack"
          gradient={true}
          focusColor={Colors.focus.work}
        />
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Focus Selected</Text>
          <Text style={styles.emptySubtitle}>
            Switch to a focus area to see your calendar
          </Text>
        </View>
      </View>
    );
  }

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
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[activeFocus.color]}
            tintColor={activeFocus.color}
          />
        }
      >
        {/* Month Navigation Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity 
            onPress={() => navigateMonth('prev')}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color={activeFocus.color} />
          </TouchableOpacity>
          
          <View style={styles.monthTitle}>
            <Text style={styles.monthText}>
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => navigateMonth('next')}
            style={styles.navButton}
          >
            <Ionicons name="chevron-forward" size={24} color={activeFocus.color} />
          </TouchableOpacity>
        </View>

        {/* Today Button */}
        <View style={styles.todayButtonContainer}>
          <TouchableOpacity 
            onPress={jumpToToday}
            style={[styles.todayButton, { borderColor: activeFocus.color }]}
          >
            <Text style={[styles.todayButtonText, { color: activeFocus.color }]}>
              Today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAY_NAMES.map((dayName, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{dayName}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => handleDatePress(day)}
                onLongPress={() => handleDateLongPress(day)}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.dayCellDisabled,
                  day.isToday && styles.dayCellToday,
                  day.isSelected && [styles.dayCellSelected, { backgroundColor: activeFocus.color }]
                ]}
              >
                <Text style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextDisabled,
                  day.isToday && !day.isSelected && [styles.dayTextToday, { color: activeFocus.color }],
                  day.isSelected && styles.dayTextSelected
                ]}>
                  {day.date.getDate()}
                </Text>
                
                {/* Activity Indicator */}
                {day.hasActivity && (
                  <View style={styles.activityIndicator}>
                    {generateActivityDots(day.entries || [], day.isSelected)}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </PanGestureHandler>

        {/* Selected Date Details */}
        {selectedDate && monthlyEntries[selectedDate]?.length > 0 && (
          <View style={styles.selectedDateDetails}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            
            <View style={styles.entriesList}>
              {monthlyEntries[selectedDate].map((entry) => (
                <View key={entry.id} style={styles.entryItem}>
                  <View style={[
                    styles.entryIndicator,
                    { backgroundColor: entry.category?.color || activeFocus.color }
                  ]} />
                  <View style={styles.entryContent}>
                    <Text style={styles.entryCategory}>
                      {entry.category?.emoji} {entry.category?.name}
                    </Text>
                    <Text style={styles.entryStats}>
                      {entry.taskCompletions?.length || 0} task{entry.taskCompletions?.length !== 1 ? 's' : ''}
                      {entry.timeEntry?.duration && ` • ${Math.round(entry.timeEntry.duration / 60)}h ${entry.timeEntry.duration % 60}m`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.addEntryButton, { borderColor: activeFocus.color }]}
              onPress={() => {
                // TODO: Open add entry modal
                Alert.alert('Add Entry', 'Add entry functionality coming soon!');
              }}
            >
              <Text style={[styles.addEntryText, { color: activeFocus.color }]}>
                Add Entry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty selection state */}
        {selectedDate && (!monthlyEntries[selectedDate] || monthlyEntries[selectedDate].length === 0) && (
          <View style={styles.selectedDateDetails}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            
            <Text style={styles.noEntriesText}>No entries for this day</Text>
            
            <TouchableOpacity 
              style={[styles.addEntryButton, { borderColor: activeFocus.color }]}
              onPress={() => {
                // TODO: Open add entry modal
                Alert.alert('Add Entry', 'Add entry functionality coming soon!');
              }}
            >
              <Text style={[styles.addEntryText, { color: activeFocus.color }]}>
                Add Entry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Legend/Key */}
        {activeFocus && (
          <View style={styles.legendContainer}>
            <TouchableOpacity 
              onPress={() => setShowLegend(!showLegend)}
              style={styles.legendHeader}
            >
              <Text style={styles.legendTitle}>Category Colors</Text>
              <Ionicons 
                name={showLegend ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showLegend && (
              <View style={styles.legendContent}>
                {getCategories(activeFocus.id).map((category) => (
                  <View key={category.id} style={styles.legendItem}>
                    <View style={[
                      styles.legendColorDot,
                      { backgroundColor: category.color }
                    ]} />
                    <Text style={styles.legendText}>
                      {category.emoji} {category.name}
                    </Text>
                  </View>
                ))}
                
                {getCategories(activeFocus.id).length === 0 && (
                  <Text style={styles.legendEmptyText}>
                    No categories in this focus
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
      
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
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.light,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body.regular,
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 22,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.padding.screen,
    paddingVertical: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: Spacing.borderRadius.base,
  },
  monthTitle: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    fontWeight: '600',
  },
  todayButtonContainer: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  todayButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
  },
  todayButtonText: {
    ...Typography.body.regular,
    fontWeight: '500',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.padding.screen,
    paddingBottom: Spacing.sm,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.padding.screen,
  },
  dayCell: {
    width: '14.285%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: Spacing.borderRadius.sm,
    marginBottom: Spacing.xs,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.text.secondary,
  },
  dayCellSelected: {
    borderWidth: 0,
  },
  dayText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: Colors.text.light,
  },
  dayTextToday: {
    fontWeight: '700',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  activityIndicator: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    // Base dot styles - size and color are set dynamically
  },
  selectedDateDetails: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.padding.screen,
    marginTop: Spacing.lg,
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
  selectedDateTitle: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  entriesList: {
    marginBottom: Spacing.lg,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  entryIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  entryContent: {
    flex: 1,
  },
  entryCategory: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  entryStats: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  noEntriesText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  addEntryButton: {
    borderWidth: 1,
    borderRadius: Spacing.borderRadius.base,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  addEntryText: {
    ...Typography.body.regular,
    fontWeight: '600',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
  legendContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    marginHorizontal: Spacing.padding.screen,
    marginTop: Spacing.lg,
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
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  legendTitle: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '600',
  },
  legendContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  legendEmptyText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});