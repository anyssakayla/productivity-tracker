import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { TopBar, Card } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useUserStore, useFocusStore, useCategoryStore, useEntryStore } from '@/store';
import { Category, TimeType, TimeEntry } from '@/types';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { formatDate } from '@/utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusSwitcherModal } from './FocusSwitcherModal';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface CategoryCardProps {
  category: Category;
  todayCount: number;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, todayCount, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.categoryCard}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>
            {todayCount} tasks today
          </Text>
        </View>
        <Text style={styles.categoryArrow}>›</Text>
      </Card>
    </TouchableOpacity>
  );
};

interface TimeClockWidgetProps {
  category: Category;
  activeClockEntry: { entryId: string; startTime: string } | null;
  onClockIn: () => void;
  onClockOut: () => void;
  focusColor?: string;
}

const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({
  category,
  activeClockEntry,
  onClockIn,
  onClockOut,
  focusColor,
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Generate theme colors from focus color
  const themeColors = focusColor 
    ? generateThemeFromFocus(focusColor)
    : DEFAULT_THEME_COLORS;

  useEffect(() => {
    if (!activeClockEntry) return;

    const updateElapsed = () => {
      const start = new Date(activeClockEntry.startTime);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeClockEntry]);

  return (
    <LinearGradient
      colors={[themeColors.primary.start, themeColors.primary.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.timeClockWidget}
    >
      <View style={styles.timeClockHeader}>
        <Text style={styles.timeClockEmoji}>{category.emoji}</Text>
        <Text style={[styles.timeClockTitle, { color: themeColors.contrastText }]}>{category.name}</Text>
      </View>
      
      {activeClockEntry ? (
        <>
          <Text style={[styles.timeClockStatus, { color: themeColors.contrastText }]}>Clocked In</Text>
          <Text style={[styles.timeClockTime, { color: themeColors.contrastText }]}>{elapsedTime}</Text>
          <Text style={[styles.timeClockSubtext, { color: themeColors.contrastText }]}>Started at {format(new Date(activeClockEntry.startTime), 'h:mm a')}</Text>
          <TouchableOpacity style={styles.clockButton} onPress={onClockOut}>
            <Text style={[styles.clockButtonText, { color: themeColors.contrastText }]}>Clock Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.timeClockStatus, { color: themeColors.contrastText }]}>Not Clocked In</Text>
          <Text style={[styles.timeClockSubtext, { color: themeColors.contrastText }]}>Ready to start your day?</Text>
          <TouchableOpacity style={styles.clockButton} onPress={onClockIn}>
            <Text style={[styles.clockButtonText, { color: themeColors.contrastText }]}>Clock In</Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user: currentUser } = useUserStore();
  const { activeFocus, getFocuses, loadFocuses } = useFocusStore();
  const { categories: allCategories, loadCategoriesByFocus } = useCategoryStore();
  const { 
    entries: allEntries,
    loadEntriesForDate,
    getOrCreateEntry,
    startClock,
    stopClock,
    activeClockEntry
  } = useEntryStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [timeClockCategory, setTimeClockCategory] = useState<Category | null>(null);
  const [showFocusSwitcher, setShowFocusSwitcher] = useState(false);

  // Get categories directly from store (like CategoryManagementScreen)
  const categories = activeFocus ? (allCategories[activeFocus.id] || []) : [];

  const loadData = async () => {
    console.log('🏠 HomeScreen: loadData called');
    console.log('🏠 HomeScreen: currentUser:', currentUser ? 'exists' : 'null');
    console.log('🏠 HomeScreen: activeFocus:', activeFocus ? `${activeFocus.name} (${activeFocus.id})` : 'null');
    
    if (!currentUser) {
      console.log('🏠 HomeScreen: No current user, returning early');
      return;
    }

    try {
      console.log('🏠 HomeScreen: Loading focuses...');
      // Load focuses first to ensure we have the latest data
      await getFocuses();
      console.log('🏠 HomeScreen: Focuses loaded');
      
      // Load categories for active focus
      if (activeFocus) {
        console.log('🏠 HomeScreen: Loading categories for focus:', activeFocus.name, activeFocus.id);
        const cats = await loadCategoriesByFocus(activeFocus.id);
        
        console.log('🏠 HomeScreen: Categories returned directly:', cats.length, cats.map(c => ({name: c.name, id: c.id, timeType: c.timeType})));
        console.log('🏠 HomeScreen: allCategories from store:', allCategories);
        
        // Find time clock category (using fresh data from loadCategoriesByFocus)
        const clockCat = cats.find(c => c.timeType === TimeType.CLOCK);
        console.log('🏠 HomeScreen: Time clock category:', clockCat ? clockCat.name : 'none');
        setTimeClockCategory(clockCat || null);
        
        // Load today's entries
        const today = formatDate(new Date());
        console.log('🏠 HomeScreen: Loading entries for date:', today, 'focusId:', activeFocus.id);
        await loadEntriesForDate(today, activeFocus.id);
        
        const todayEntries = allEntries[today] || [];
        console.log('🏠 HomeScreen: Today entries:', todayEntries.length);
        const counts: Record<string, number> = {};
        
        // Count task completions per category (using fresh data from loadCategoriesByFocus)
        for (const category of cats) {
          const categoryEntry = todayEntries.find(e => e.categoryId === category.id);
          if (categoryEntry && categoryEntry.taskCompletions) {
            counts[category.id] = categoryEntry.taskCompletions.length;
          } else {
            counts[category.id] = 0;
          }
        }
        
        console.log('🏠 HomeScreen: Task counts:', counts);
        setTodayCounts(counts);
        console.log('🏠 HomeScreen: loadData completed successfully');
      } else {
        console.log('🏠 HomeScreen: No active focus available');
      }
    } catch (error) {
      console.error('🏠 HomeScreen: Error loading data:', error);
    }
  };

  // Load focuses when component mounts
  useEffect(() => {
    console.log('🏠 HomeScreen: Mount effect - currentUser:', currentUser ? 'exists' : 'null');
    if (currentUser) {
      console.log('🏠 HomeScreen: Loading focuses on mount');
      loadFocuses();
    }
  }, [currentUser, loadFocuses]);

  // Load data when active focus changes
  useEffect(() => {
    console.log('🏠 HomeScreen: Active focus effect - currentUser:', currentUser ? 'exists' : 'null', 'activeFocus:', activeFocus ? activeFocus.name : 'null');
    loadData();
  }, [currentUser, activeFocus]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Load focuses first, then data
    await loadFocuses();
    await loadData();
    setRefreshing(false);
  };

  const handleClockIn = async () => {
    if (!timeClockCategory || !activeFocus) return;
    
    try {
      const today = formatDate(new Date());
      const entry = await getOrCreateEntry(today, timeClockCategory.id, activeFocus.id);
      await startClock(entry.id);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Clock in error:', error);
    }
  };

  const handleClockOut = async () => {
    if (!activeClockEntry) return;
    
    try {
      await stopClock(activeClockEntry.entryId);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Clock out error:', error);
    }
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryDetail' as any, { categoryId: category.id });
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as any);
  };

  const firstName = currentUser?.name.split(' ')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : 
                   new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

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
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, {firstName}!</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {timeClockCategory && (
          <TimeClockWidget
            category={timeClockCategory}
            activeClockEntry={activeClockEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            focusColor={activeFocus?.color}
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {categories.length > 0 && (
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeColors.primary.solid }]}
                onPress={() => navigation.navigate('CategoryManagement' as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.addButtonText, { color: themeColors.contrastText }]}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          {categories.filter(c => c.timeType !== TimeType.CLOCK).length > 0 ? (
            <>
              {categories.filter(c => c.timeType !== TimeType.CLOCK).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  todayCount={todayCounts[category.id] || 0}
                  onPress={() => handleCategoryPress(category)}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No Categories Yet</Text>
              <Text style={styles.emptySubtitle}>Add categories to start tracking your {activeFocus?.name.toLowerCase()} activities</Text>
              <TouchableOpacity 
                style={[styles.addCategoryButton, { backgroundColor: themeColors.primary.solid }]}
                onPress={() => navigation.navigate('CategoryManagement' as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.addCategoryButtonText, { color: themeColors.contrastText }]}>Add Categories</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.dailySummary}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.isLight ? Colors.text.dark : themeColors.primary.solid }]}>
                {Object.values(todayCounts).reduce((sum, count) => sum + count, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.isLight ? Colors.text.dark : themeColors.primary.solid }]}>
                {categories.filter(c => (todayCounts[c.id] || 0) > 0).length}
              </Text>
              <Text style={styles.statLabel}>Active Categories</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CategoryManagement' as any)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[themeColors.primary.start, themeColors.primary.end]}
          style={styles.fabGradient}
        >
          <Text style={[styles.fabIcon, { color: themeColors.contrastText }]}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

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
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    marginBottom: Spacing.xs,
  },
  date: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
  timeClockWidget: {
    marginHorizontal: 0, // Remove horizontal margins to go edge-to-edge
    marginBottom: Spacing.xl,
    borderRadius: 0, // Remove border radius for edge-to-edge
    padding: Spacing.xl,
    alignItems: 'center',
  },
  timeClockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timeClockEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  timeClockTitle: {
    ...Typography.heading.h3,
  },
  timeClockStatus: {
    ...Typography.body.regular,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  timeClockTime: {
    fontSize: 56,
    fontWeight: '400',
    fontFamily: Platform.select({
      ios: 'Menlo-Regular',
      android: 'monospace', 
      default: 'monospace'
    }),
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 70, // Explicit line height larger than fontSize
    includeFontPadding: false, // Android specific fix
    textAlignVertical: 'center',
    minHeight: 70, // Ensure container has enough height
    marginBottom: Spacing.sm,
  },
  timeClockSubtext: {
    ...Typography.body.small,
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  clockButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clockButtonText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.base,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingVertical: Spacing.base,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: Spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryCount: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  categoryArrow: {
    fontSize: 20,
    color: Colors.text.light,
  },
  dailySummary: {
    marginHorizontal: Spacing.padding.screen,
    padding: Spacing.lg,
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.base,
  },
  summaryTitle: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    marginBottom: Spacing.base,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h2,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  addCategoryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.button,
  },
  addCategoryButtonText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  addButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.xs,
  },
  addButtonText: {
    ...Typography.body.regular,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.layout.bottomNavHeight + Spacing.xl,
    right: Spacing.padding.screen,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: Colors.ui.white,
    fontWeight: '300',
  },
  settingsIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});