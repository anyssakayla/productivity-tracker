import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
}

const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({
  category,
  activeClockEntry,
  onClockIn,
  onClockOut,
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

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
      colors={[Colors.primary.start, Colors.primary.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.timeClockWidget}
    >
      <View style={styles.timeClockHeader}>
        <Text style={styles.timeClockEmoji}>{category.emoji}</Text>
        <Text style={styles.timeClockTitle}>{category.name}</Text>
      </View>
      
      {activeClockEntry ? (
        <>
          <Text style={styles.timeClockStatus}>Clocked In</Text>
          <Text style={styles.timeClockTime}>{elapsedTime}</Text>
          <Text style={styles.timeClockSubtext}>Started at {format(new Date(activeClockEntry.startTime), 'h:mm a')}</Text>
          <TouchableOpacity style={styles.clockButton} onPress={onClockOut}>
            <Text style={styles.clockButtonText}>Clock Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.timeClockStatus}>Not Clocked In</Text>
          <Text style={styles.timeClockSubtext}>Ready to start your day?</Text>
          <TouchableOpacity style={styles.clockButton} onPress={onClockIn}>
            <Text style={styles.clockButtonText}>Clock In</Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { currentUser } = useUserStore();
  const { activeFocus, getFocuses } = useFocusStore();
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [timeClockCategory, setTimeClockCategory] = useState<Category | null>(null);
  const [showFocusSwitcher, setShowFocusSwitcher] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;

    // Load focuses if not loaded
    const focuses = await getFocuses();
    
    // Load categories for active focus
    if (activeFocus) {
      await loadCategoriesByFocus(activeFocus.id);
      const cats = allCategories[activeFocus.id] || [];
      setCategories(cats);
      
      // Find time clock category
      const clockCat = cats.find(c => c.timeType === TimeType.CLOCK);
      setTimeClockCategory(clockCat || null);
      
      // Load today's entries
      const today = formatDate(new Date());
      await loadEntriesForDate(today, activeFocus.id);
      
      const todayEntries = allEntries[today] || [];
      const counts: Record<string, number> = {};
      
      // Count task completions per category
      for (const category of cats) {
        const categoryEntry = todayEntries.find(e => e.categoryId === category.id);
        if (categoryEntry && categoryEntry.taskCompletions) {
          counts[category.id] = categoryEntry.taskCompletions.length;
        } else {
          counts[category.id] = 0;
        }
      }
      
      setTodayCounts(counts);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, activeFocus]);

  const onRefresh = async () => {
    setRefreshing(true);
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

  const firstName = currentUser?.name.split(' ')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : 
                   new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      <TopBar 
        title={activeFocus?.name || 'ProductiTrack'}
        emoji={activeFocus?.emoji}
        gradient={true}
        onTitlePress={() => setShowFocusSwitcher(true)}
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
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {categories.length > 0 && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('CategoryManagement' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
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
                style={styles.addCategoryButton}
                onPress={() => navigation.navigate('CategoryManagement' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.addCategoryButtonText}>Add Categories</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.dailySummary}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Object.values(todayCounts).reduce((sum, count) => sum + count, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
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
          colors={[Colors.primary.start, Colors.primary.end]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
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
    marginHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.xl,
    borderRadius: Spacing.borderRadius.large,
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
    color: Colors.ui.white,
  },
  timeClockStatus: {
    ...Typography.body.regular,
    color: Colors.ui.white,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  timeClockTime: {
    ...Typography.heading.h1,
    color: Colors.ui.white,
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.sm,
  },
  timeClockSubtext: {
    ...Typography.body.small,
    color: Colors.ui.white,
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
    color: Colors.ui.white,
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
    color: Colors.primary.solid,
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
    backgroundColor: Colors.primary.solid,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.button,
  },
  addCategoryButtonText: {
    ...Typography.body.large,
    color: Colors.ui.white,
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
  },
  addButtonText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
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
});