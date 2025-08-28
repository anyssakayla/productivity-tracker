import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore, useCategoryStore } from '@/store';
import { TopBar, Card } from '@/components/common';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusFormData, CategoryFormData, TimeType, Category } from '@/types';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

type Navigation = BottomTabNavigationProp<MainTabParamList>;

const EMOJI_OPTIONS = ['💼', '🏠', '🎨', '📚', '💪', '🎯', '🧘', '🎸', '🌱', '💡', '🚀', '⚡'];
const COLOR_OPTIONS = [
  Colors.focus.work,
  Colors.focus.personal,
  Colors.focus.custom,
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#DDA0DD', // Plum
  '#FFD93D', // Yellow
  '#FF8C42', // Orange
  '#6C5CE7', // Purple
  '#A8E6CF', // Mint
];

const CATEGORY_EMOJIS = ['📝', '💼', '🏃', '📚', '🍽️', '🛒', '🏠', '💻', '📱', '🎯', '⚡', '🔥'];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { activeFocus, updateFocus } = useFocusStore();
  const { categories: allCategories, createCategory, updateCategory, deleteCategory, loadCategoriesByFocus } = useCategoryStore();
  const categories = activeFocus ? (allCategories[activeFocus.id] || []) : [];
  
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Focus inline editing state
  const [focusName, setFocusName] = useState(activeFocus?.name || '');
  const [focusEmoji, setFocusEmoji] = useState(activeFocus?.emoji || '💼');
  const [focusColor, setFocusColor] = useState(activeFocus?.color || Colors.focus.work);
  
  // Category edit state
  const [categoryName, setCategoryName] = useState('');
  const [categoryEmoji, setCategoryEmoji] = useState('📝');
  const [categoryColor, setCategoryColor] = useState(Colors.focus.work);
  const [categoryTimeType, setCategoryTimeType] = useState<TimeType>(TimeType.TASK);

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  // Initialize focus state when activeFocus changes
  useEffect(() => {
    if (activeFocus) {
      setFocusName(activeFocus.name);
      setFocusEmoji(activeFocus.emoji);
      setFocusColor(activeFocus.color);
      loadCategoriesByFocus(activeFocus.id);
    }
  }, [activeFocus, loadCategoriesByFocus]);

  // Auto-save focus name with debouncing
  useEffect(() => {
    if (!activeFocus || focusName === activeFocus.name) return;
    
    const saveTimer = setTimeout(async () => {
      if (focusName.trim() && focusName !== activeFocus.name) {
        try {
          const focusData: Partial<FocusFormData> = {
            name: focusName.trim(),
          };
          await updateFocus(activeFocus.id, focusData);
        } catch (error) {
          console.error('Failed to auto-save focus name:', error);
          // Revert to original name on error
          setFocusName(activeFocus.name);
        }
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [focusName, activeFocus, updateFocus]);

  // Auto-save emoji selection
  const handleEmojiChange = async (emoji: string) => {
    if (!activeFocus) return;
    
    setFocusEmoji(emoji);
    try {
      const focusData: Partial<FocusFormData> = {
        emoji: emoji,
      };
      await updateFocus(activeFocus.id, focusData);
    } catch (error) {
      console.error('Failed to save emoji:', error);
      // Revert on error
      setFocusEmoji(activeFocus.emoji);
    }
  };

  // Auto-save color selection
  const handleColorChange = async (color: string) => {
    if (!activeFocus) return;
    
    setFocusColor(color);
    try {
      const focusData: Partial<FocusFormData> = {
        color: color,
      };
      await updateFocus(activeFocus.id, focusData);
    } catch (error) {
      console.error('Failed to save color:', error);
      // Revert on error
      setFocusColor(activeFocus.color);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryEmoji(category.emoji);
    setCategoryColor(category.color);
    setCategoryTimeType(category.timeType);
    setShowCategoryEdit(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryEmoji('📝');
    setCategoryColor(Colors.focus.work);
    setCategoryTimeType(TimeType.TASK);
    setShowCategoryEdit(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !activeFocus) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const categoryData: CategoryFormData = {
        name: categoryName.trim(),
        emoji: categoryEmoji,
        color: categoryColor,
        timeType: categoryTimeType,
        focusId: activeFocus.id,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await createCategory(categoryData);
        Alert.alert('Success', 'Category created successfully');
      }
      
      // Reload categories
      await loadCategoriesByFocus(activeFocus.id);
      setShowCategoryEdit(false);
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? All associated data will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              if (activeFocus) {
                await loadCategoriesByFocus(activeFocus.id);
              }
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Settings"
        gradient={true}
        focusColor={activeFocus?.color}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Focus Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus</Text>
          <Card style={styles.focusCard}>
            {/* Focus Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.inlineInput}
                value={focusName}
                onChangeText={setFocusName}
                placeholder="Enter focus name"
                placeholderTextColor={Colors.text.light}
                maxLength={20}
              />
            </View>

            {/* Emoji Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Emoji</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.inlineEmojiScroll}
                contentContainerStyle={styles.emojiScrollContent}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.inlineEmojiOption,
                      focusEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => handleEmojiChange(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.inlineColorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.inlineColorOption,
                      { backgroundColor: color },
                      focusColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => handleColorChange(color)}
                  />
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {categories.map((category) => (
            <Card key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryContent}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryType}>
                    {category.timeType === TimeType.TASK ? 'Task' : 
                     category.timeType === TimeType.COUNT ? 'Count' : 
                     category.timeType === TimeType.TIME ? 'Time' : 'Clock'}
                  </Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    onPress={() => handleEditCategory(category)}
                    style={[styles.actionButton, { backgroundColor: themeColors.primary.solid }]}
                  >
                    <Text style={[styles.actionButtonText, { color: themeColors.contrastText }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category)}
                    style={styles.deleteActionButton}
                  >
                    <Text style={styles.deleteActionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
          
          {(!categories || categories.length === 0) && (
            <Card style={styles.emptyCategoriesCard}>
              <Text style={styles.emptyCategoriesText}>No categories yet</Text>
              <Text style={styles.emptyCategoriesSubtext}>Add your first category to get started</Text>
            </Card>
          )}
          
          {/* Add Category Button */}
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={handleAddCategory}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[themeColors.primary.start, themeColors.primary.end]}
              style={styles.addCategoryGradient}
            >
              <Text style={[styles.addCategoryIcon, { color: themeColors.contrastText }]}>+</Text>
              <Text style={[styles.addCategoryText, { color: themeColors.contrastText }]}>Add Category</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>


      {/* Category Edit Modal */}
      <Modal
        visible={showCategoryEdit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryEdit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
                placeholderTextColor={Colors.text.light}
                maxLength={30}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Emoji</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiScroll}
              >
                {CATEGORY_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      categoryEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => setCategoryEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      categoryColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {Object.values(TimeType).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      categoryTimeType === type && { backgroundColor: themeColors.primary.solid },
                    ]}
                    onPress={() => setCategoryTimeType(type)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      categoryTimeType === type && { color: themeColors.contrastText },
                    ]}>
                      {type === TimeType.TASK ? 'Task' : 
                       type === TimeType.COUNT ? 'Count' : 
                       type === TimeType.TIME ? 'Time' : 'Clock'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryEdit(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: themeColors.primary.solid }]}
                onPress={handleSaveCategory}
              >
                <Text style={[styles.saveButtonText, { color: themeColors.contrastText }]}>
                  {editingCategory ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.padding.screen,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.base,
  },
  focusCard: {
    marginBottom: Spacing.base,
  },
  focusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  focusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  focusEmoji: {
    fontSize: 28,
  },
  focusInfo: {
    flex: 1,
  },
  focusName: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
  },
  // Inline editing styles
  inlineInput: {
    ...Typography.body.large,
    color: Colors.text.dark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  inlineEmojiScroll: {
    marginTop: Spacing.xs,
  },
  emojiScrollContent: {
    paddingRight: Spacing.base,
  },
  inlineEmojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ui.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  inlineColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inlineColorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  categoryCard: {
    marginBottom: Spacing.sm,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  categoryType: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.xs,
  },
  actionButtonText: {
    ...Typography.body.small,
    fontWeight: '600',
  },
  deleteActionButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  deleteActionButtonText: {
    ...Typography.body.small,
    color: Colors.ui.error,
    fontWeight: '600',
  },
  addCategoryButton: {
    marginTop: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    overflow: 'hidden',
  },
  addCategoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
  addCategoryIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
    fontWeight: '600',
  },
  addCategoryText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
  emptyCategoriesCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyCategoriesText: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  emptyCategoriesSubtext: {
    ...Typography.body.regular,
    color: Colors.text.light,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  input: {
    ...Typography.body.large,
    color: Colors.text.dark,
    backgroundColor: Colors.ui.backgroundSecondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  emojiScroll: {
    flexGrow: 0,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: Spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    backgroundColor: Colors.ui.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  emojiOptionSelected: {
    borderColor: Colors.primary.solid,
    backgroundColor: Colors.ui.backgroundTertiary,
  },
  emojiText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text.dark,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.base,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    alignItems: 'center',
  },
  typeButtonText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    fontWeight: '500',
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