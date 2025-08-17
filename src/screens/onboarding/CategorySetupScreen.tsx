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
import { useAppStore, useUserStore, useFocusStore, useCategoryStore } from '@/store';
import { CategoryFormData, CategoryType, TimeType } from '@/types';

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
  type: CategoryType;
  timeType: TimeType;
  subcategories?: string[];
}

const presetCategories: PresetCategory[] = [
  {
    id: 'administrative',
    name: 'Administrative',
    emoji: '📋',
    color: Colors.categoryColors[0],
    type: CategoryType.TYPE_IN,
    timeType: TimeType.NONE,
  },
  {
    id: 'treatments',
    name: 'Treatments',
    emoji: '🏥',
    color: Colors.categoryColors[1],
    type: CategoryType.SELECT_COUNT,
    timeType: TimeType.NONE,
    subcategories: ['Ultrasound Therapy', 'Ice Pack Application', 'Stretching Session', 'Manual Therapy'],
  },
  {
    id: 'time_clock',
    name: 'Time Clock',
    emoji: '⏰',
    color: Colors.categoryColors[2],
    type: CategoryType.TYPE_IN,
    timeType: TimeType.CLOCK,
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
            type: preset.type,
            timeType: preset.timeType,
            subcategories: preset.subcategories,
          };
          await createCategory(focus.id, categoryData);
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
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.xxxl,
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
  },
});