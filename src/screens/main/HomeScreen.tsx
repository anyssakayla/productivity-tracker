import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, Modal, TextInput, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { TopBar, Card, AddCategoryModal } from '@/components/common';
import { TimeClockWidget } from '@/components/home';
import { Colors, Typography, Spacing } from '@/constants';
import { useUserStore, useFocusStore, useCategoryStore, useEntryStore } from '@/store';
import { Category, TimeType, TimeEntry } from '@/types';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { formatDate } from '@/utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FocusSwitcherModal } from './FocusSwitcherModal';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface CategoryCardProps {
  category: Category;
  todayCount: number;
  todayDuration?: number;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, todayCount, todayDuration, onPress }) => {
  // Format display based on timeType
  const getDisplayText = () => {
    if (category.timeType === TimeType.DURATION && todayDuration !== undefined) {
      const hours = Math.floor(todayDuration / 60);
      const minutes = todayDuration % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m today`;
      }
      return `${minutes}m today`;
    }
    return `${todayCount} tasks today`;
  };
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.categoryCard}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>
            {getDisplayText()}
          </Text>
        </View>
        <Text style={styles.categoryArrow}>›</Text>
      </Card>
    </TouchableOpacity>
  );
};


export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user: currentUser } = useUserStore();
  const { activeFocus, getFocuses, loadFocuses } = useFocusStore();
  const { categories: allCategories, loadCategoriesByFocus, createCategory } = useCategoryStore();
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
  const [todayDurations, setTodayDurations] = useState<Record<string, number>>({});
  const [timeClockCategory, setTimeClockCategory] = useState<Category | null>(null);
  const [showFocusSwitcher, setShowFocusSwitcher] = useState(false);

  // Get categories directly from store (like CategoryManagementScreen)
  const categories = activeFocus ? (allCategories[activeFocus.id] || []) : [];
  
  // Add category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Simple refresh trigger for manual refresh operations
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);


  // Load focuses when component mounts
  useEffect(() => {
    console.log('🏠 HomeScreen: Mount effect - currentUser:', currentUser ? 'exists' : 'null');
    if (currentUser) {
      console.log('🏠 HomeScreen: Loading focuses on mount');
      loadFocuses();
    }
  }, [currentUser, loadFocuses]);

  // Trigger refresh when refresh trigger changes (for manual refreshes)
  useEffect(() => {
    console.log('🏠 HomeScreen: Manual refresh triggered');
    // The useFocusEffect will handle the actual data loading with fresh values
  }, [refreshTrigger]);

  // Refresh data whenever screen comes into focus (e.g., returning from CategoryDetailScreen)
  // Using fresh store values inside useFocusEffect to prevent stale closure issues
  useFocusEffect(
    React.useCallback(() => {
      const loadDataFresh = async () => {
        console.log('🏠 HomeScreen: Screen focused - refreshing data with fresh values');
        console.log('🏠 HomeScreen: currentUser:', currentUser ? 'exists' : 'null');
        console.log('🏠 HomeScreen: activeFocus:', activeFocus ? `${activeFocus.name} (${activeFocus.id})` : 'null');
        
        if (!currentUser) {
          console.log('🏠 HomeScreen: No current user, returning early');
          return;
        }

        if (!activeFocus) {
          console.log('🏠 HomeScreen: No active focus available');
          return;
        }

        try {
          console.log('🏠 HomeScreen: Loading categories...');
          const cats = await loadCategoriesByFocus(activeFocus.id);
          console.log('🏠 HomeScreen: Categories loaded:', cats.length);
          
          // Find clock category
          const clockCat = cats.find(c => c.timeType === TimeType.CLOCK);
          setTimeClockCategory(clockCat || null);
          
          // Load today's entries with fresh store values
          const today = formatDate(new Date());
          console.log('🏠 HomeScreen: Loading entries for date:', today, 'focusId:', activeFocus.id);
          await loadEntriesForDate(today, activeFocus.id);
          
          // Get fresh entries from store after loading
          const currentEntries = useEntryStore.getState().entries;
          const todayEntries = currentEntries[today] || [];
          console.log('🏠 HomeScreen: Today entries (fresh):', todayEntries.length);
          
          const counts: Record<string, number> = {};
          const durations: Record<string, number> = {};
          
          // Calculate counts and durations per category based on TimeType
          for (const category of cats) {
            const categoryEntry = todayEntries.find(e => e.categoryId === category.id);
            if (categoryEntry && categoryEntry.taskCompletions) {
              if (category.timeType === TimeType.DURATION) {
                // Sum durations for DURATION categories
                durations[category.id] = categoryEntry.taskCompletions.reduce(
                  (sum, completion) => sum + (completion.duration || 0), 0
                );
                counts[category.id] = categoryEntry.taskCompletions.length; // Still track task count for stats
                console.log(`⏱️ ${category.name}: ${durations[category.id]} minutes (${categoryEntry.taskCompletions.length} tasks)`);
              } else {
                // Sum quantities for quantity-based categories (NONE, CLOCK)
                counts[category.id] = categoryEntry.taskCompletions.reduce(
                  (sum, completion) => sum + completion.quantity, 0
                );
                durations[category.id] = 0;
                console.log(`📊 ${category.name}: ${counts[category.id]} tasks`);
              }
            } else {
              counts[category.id] = 0;
              durations[category.id] = 0;
            }
          }
          
          console.log('🏠 HomeScreen: Task counts (fresh):', counts);
          console.log('🏠 HomeScreen: Task durations (fresh):', durations);
          setTodayCounts(counts);
          setTodayDurations(durations);
          console.log('🏠 HomeScreen: Fresh data loading completed successfully');
        } catch (error) {
          console.error('🏠 HomeScreen: Error loading fresh data:', error);
        }
      };
      
      if (currentUser && activeFocus) {
        loadDataFresh();
      }
    }, [currentUser, activeFocus, loadCategoriesByFocus, loadEntriesForDate, refreshTrigger])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Load focuses first, then trigger refresh
    await loadFocuses();
    triggerRefresh(); // This will cause useFocusEffect to re-run with fresh data
    setRefreshing(false);
  };

  const handleClockIn = async () => {
    if (!timeClockCategory || !activeFocus) return;
    
    try {
      const today = formatDate(new Date());
      const entry = await getOrCreateEntry(today, timeClockCategory.id, activeFocus.id);
      await startClock(entry.id);
      triggerRefresh(); // Refresh with fresh data
    } catch (error) {
      console.error('Clock in error:', error);
    }
  };

  const handleClockOut = async () => {
    if (!activeClockEntry) return;
    
    try {
      await stopClock(activeClockEntry.entryId);
      triggerRefresh(); // Refresh with fresh data
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

  const handleProfilePress = () => {
    navigation.navigate('Profile' as any);
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
                  todayDuration={todayDurations[category.id]}
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
        onPress={() => setShowAddCategoryModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[themeColors.primary.start, themeColors.primary.end]}
          style={styles.fabGradient}
        >
          <Text style={[styles.fabIcon, { color: themeColors.contrastText }]}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <AddCategoryModal
        visible={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={() => {
          // Refresh categories after adding
          triggerRefresh();
        }}
      />

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body.large,
    color: Colors.text.dark,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: Spacing.borderRadius.base,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    alignItems: 'center',
  },
  typeButtonText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
});