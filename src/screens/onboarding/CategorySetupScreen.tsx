import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, ProgressBar, Button, BackButton } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useAppStore, useUserStore, useFocusStore, useCategoryStore, useTaskStore } from '@/store';
import { CategoryFormData, TimeType } from '@/types';

type CategorySetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CategorySetup'>;
type CategorySetupScreenRouteProp = RouteProp<OnboardingStackParamList, 'CategorySetup'>;

interface CategorySetupScreenProps {
  navigation: CategorySetupScreenNavigationProp;
  route: CategorySetupScreenRouteProp;
}

interface PresetCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  timeType: TimeType;
  defaultTasks?: string[];
}

const presetCategories: PresetCategory[] = [
  {
    id: 'administrative',
    name: 'Administrative',
    emoji: '📋',
    color: Colors.categoryColors[0],
    timeType: TimeType.NONE,
    defaultTasks: ['Email', 'Phone calls', 'Documentation', 'Meetings'],
  },
  {
    id: 'treatments',
    name: 'Treatments',
    emoji: '🏥',
    color: Colors.categoryColors[1],
    timeType: TimeType.NONE,
    defaultTasks: ['Ultrasound Therapy', 'Ice Pack Application', 'Stretching Session', 'Manual Therapy'],
  },
  {
    id: 'time_clock',
    name: 'Time Clock',
    emoji: '⏰',
    color: Colors.categoryColors[2],
    timeType: TimeType.CLOCK,
    // No tasks for time clock - it's just for clocking in/out
  },
];

export const CategorySetupScreen: React.FC<CategorySetupScreenProps> = ({ navigation, route }) => {
  const { completeOnboarding } = useAppStore();
  const { createUser } = useUserStore();
  const { createFocus } = useFocusStore();
  const { createCategory } = useCategoryStore();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['administrative', 'treatments', 'time_clock']);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleStartTracking = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Select Categories', 'Please select at least one category to track.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create user
      await createUser(route.params.profile);
      
      // 2. Create focus
      const focus = await createFocus(route.params.focus);
      
      // 3. Create selected categories
      for (const categoryId of selectedCategories) {
        const preset = presetCategories.find(c => c.id === categoryId);
        if (preset) {
          const categoryData: CategoryFormData = {
            name: preset.name,
            emoji: preset.emoji,
            color: preset.color,
            timeType: preset.timeType,
          };
          const newCategory = await createCategory(focus.id, categoryData);
          
          // Create default tasks for this category
          if (preset.defaultTasks) {
            const { createTask } = useTaskStore.getState();
            for (const taskName of preset.defaultTasks) {
              await createTask(newCategory.id, { name: taskName, isRecurring: true });
            }
          }
        }
      }
      
      // 4. Complete onboarding
      await completeOnboarding();
      
      // Navigation will happen automatically due to RootNavigator watching hasCompletedOnboarding
    } catch (error) {
      Alert.alert('Setup Error', 'Failed to complete setup. Please try again.');
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <ProgressBar progress={1} style={styles.progressBar} />
          
          <Text style={styles.title}>Setup Categories</Text>
          <Text style={styles.subtitle}>Add categories for your {route.params.focus.name} focus</Text>
          
          <View style={styles.categoryList}>
            {presetCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryType}>
                      {category.type === CategoryType.TYPE_IN ? 'Type-in tasks' : 'Select & count'}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.removeButton,
                  !selectedCategories.includes(category.id) && styles.addButton
                ]}>
                  {selectedCategories.includes(category.id) ? '✕' : '＋'}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.addCategoryButton} activeOpacity={0.7}>
              <Text style={styles.addCategoryText}>+ Add New Category</Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Start Tracking!"
            onPress={handleStartTracking}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={selectedCategories.length === 0}
            style={styles.button}
          />
        </View>
      </ScrollView>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },
  progressBar: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.xxxl,
  },
  categoryList: {
    marginBottom: Spacing.xxl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: Spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryType: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  removeButton: {
    fontSize: 24,
    color: Colors.ui.error,
    padding: Spacing.sm,
  },
  addButton: {
    color: Colors.primary.solid,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    borderStyle: 'dashed',
  },
  addCategoryText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
    fontWeight: '600',
  },
  button: {
    marginTop: 'auto',
  },
});