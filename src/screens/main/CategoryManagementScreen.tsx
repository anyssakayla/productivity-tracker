import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';
import { TopBar, Card, Button } from '@/components/common';
import { useFocusStore, useCategoryStore, useTaskStore } from '@/store';
import { Category, TimeType, CategoryFormData, Task, TaskFormData } from '@/types';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

type CategoryManagementScreenNavigationProp = StackNavigationProp<any>;

interface CategoryItemProps {
  category: Category;
  tasks: Task[];
  onEdit: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  category, 
  tasks,
  onEdit, 
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card style={styles.categoryItem}>
      <TouchableOpacity 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryType}>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                {category.timeType !== TimeType.NONE && ` • ${category.timeType === TimeType.CLOCK ? 'Clock in/out' : 'Duration'}`}
              </Text>
            </View>
          </View>
          <View style={styles.categoryActions}>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskName}>{task.name}</Text>
                <View style={styles.taskActions}>
                  <TouchableOpacity onPress={() => onEditTask(task)} style={styles.taskActionButton}>
                    <Text style={styles.taskActionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteTask(task)} style={styles.taskActionButton}>
                    <Text style={styles.taskActionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.addTaskButton}
            onPress={onAddTask}
            activeOpacity={0.7}
          >
            <Text style={styles.addTaskButtonText}>+ Add Task</Text>
          </TouchableOpacity>

          <View style={styles.categoryManageActions}>
            <TouchableOpacity onPress={onEdit} style={styles.manageButton}>
              <Text style={styles.manageButtonText}>Edit Category</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.manageButton}>
              <Text style={[styles.manageButtonText, styles.deleteText]}>Delete Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
};

export const CategoryManagementScreen: React.FC = () => {
  const navigation = useNavigation<CategoryManagementScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { activeFocus } = useFocusStore();
  const { categories: allCategories, loadCategoriesByFocus, createCategory, deleteCategory } = useCategoryStore();
  const { tasks: allTasks, loadTasksByCategory, createTask, deleteTask } = useTaskStore();
  const categories = activeFocus ? (allCategories[activeFocus.id] || []) : [];
  
  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;
    
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<CategoryFormData>>({
    name: '',
    emoji: '📋',
    color: Colors.categoryColors[0],
    timeType: TimeType.NONE,
  });
  const [newTask, setNewTask] = useState<TaskFormData>({
    name: '',
    isRecurring: true,
  });

  useEffect(() => {
    if (activeFocus) {
      loadCategoriesByFocus(activeFocus.id);
    }
  }, [activeFocus]);

  useEffect(() => {
    // Load tasks for each category
    categories.forEach(category => {
      loadTasksByCategory(category.id);
    });
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategory.name?.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!activeFocus) {
      Alert.alert('Error', 'No active focus selected');
      return;
    }

    try {
      await createCategory(activeFocus.id, newCategory as CategoryFormData);
      setShowAddModal(false);
      setNewCategory({
        name: '',
        emoji: '📋',
        color: Colors.categoryColors[0],
        timeType: TimeType.NONE,
      });
      await loadCategoriesByFocus(activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will also delete all associated entries.`,
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
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleEditCategory = (category: Category) => {
    Alert.alert('Edit Category', 'Category editing will be implemented in the next update');
  };

  const handleAddTask = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTask(null);
    setNewTask({ name: '', isRecurring: true });
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setNewTask({ name: task.name, isRecurring: task.isRecurring });
    setShowTaskModal(true);
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const categoryId = task.categoryId;
              await deleteTask(task.id, categoryId);
              await loadTasksByCategory(categoryId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleSaveTask = async () => {
    if (!newTask.name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      if (selectedTask) {
        // Update existing task
        await useTaskStore.getState().updateTask(selectedTask.id, newTask);
        if (selectedTask.categoryId) {
          await loadTasksByCategory(selectedTask.categoryId);
        }
      } else if (selectedCategory) {
        // Create new task
        await createTask(selectedCategory.id, newTask);
        await loadTasksByCategory(selectedCategory.id);
      }
      
      setShowTaskModal(false);
      setSelectedTask(null);
      setSelectedCategory(null);
      setNewTask({ name: '', isRecurring: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Manage Categories"
        leftIcon={<Text style={styles.backIcon}>‹</Text>}
        onLeftPress={() => navigation.goBack()}
        gradient={false}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.focusLabel}>Current Focus</Text>
          <View style={styles.focusInfo}>
            <Text style={styles.focusEmoji}>{activeFocus?.emoji}</Text>
            <Text style={styles.focusName}>{activeFocus?.name}</Text>
          </View>
        </View>

        {categories.length > 0 ? (
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                tasks={allTasks[category.id] || []}
                onEdit={() => handleEditCategory(category)}
                onDelete={() => handleDeleteCategory(category)}
                onAddTask={() => handleAddTask(category)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No Categories</Text>
            <Text style={styles.emptySubtitle}>
              Add your first category to start tracking
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Category</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={newCategory.name}
                onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
                placeholder="Enter category name"
                placeholderTextColor={Colors.text.secondary}
              />

              <Text style={styles.inputLabel}>Emoji</Text>
              <View style={styles.emojiPicker}>
                {['📋', '🏥', '⏰', '💊', '🩺', '📊', '🔬', '📝'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      newCategory.emoji === emoji && styles.emojiOptionSelected
                    ]}
                    onPress={() => setNewCategory({ ...newCategory, emoji })}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {Colors.categoryColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategory.color === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewCategory({ ...newCategory, color })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                variant="secondary"
                size="medium"
              />
              <Button
                title="Add Category"
                onPress={handleAddCategory}
                variant="primary"
                size="medium"
                backgroundColor={themeColors.primary.solid}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>
              {selectedTask ? 'Edit Task' : 'Add New Task'}
            </Text>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput
                style={styles.input}
                value={newTask.name}
                onChangeText={(text) => setNewTask({ ...newTask, name: text })}
                placeholder="Enter task name"
                placeholderTextColor={Colors.text.secondary}
              />

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNewTask({ ...newTask, isRecurring: !newTask.isRecurring })}
                >
                  <View style={[styles.checkboxInner, newTask.isRecurring && styles.checkboxChecked]}>
                    {newTask.isRecurring && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Recurring Task</Text>
                </TouchableOpacity>
                <Text style={styles.checkboxHint}>
                  {newTask.isRecurring 
                    ? 'This task will appear every day' 
                    : 'This task will only appear once'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowTaskModal(false)}
                variant="secondary"
                size="medium"
              />
              <Button
                title={selectedTask ? 'Update Task' : 'Add Task'}
                onPress={handleSaveTask}
                variant="primary"
                size="medium"
                backgroundColor={themeColors.primary.solid}
              />
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
  content: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    padding: Spacing.padding.screen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  focusLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  focusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  focusName: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
  },
  categoriesList: {
    padding: Spacing.padding.screen,
  },
  categoryItem: {
    marginBottom: Spacing.base,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryType: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  categoryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  actionIcon: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge * 2,
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.solid,
    marginHorizontal: Spacing.padding.screen,
    padding: Spacing.base,
    borderRadius: Spacing.borderRadius.button,
  },
  addButtonIcon: {
    fontSize: 24,
    color: Colors.ui.white,
    marginRight: Spacing.sm,
  },
  addButtonText: {
    ...Typography.body.large,
    color: Colors.ui.white,
    fontWeight: '600',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    padding: Spacing.padding.screen,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.ui.white,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: Spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.ui.backgroundSecondary,
  },
  emojiOptionSelected: {
    backgroundColor: Colors.primary.solid,
  },
  emojiText: {
    fontSize: 24,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.text.dark,
  },
  typeOptions: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  typeOption: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    backgroundColor: Colors.ui.backgroundSecondary,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: Colors.primary.solid,
  },
  typeOptionText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  expandedContent: {
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.borderLight,
  },
  tasksList: {
    paddingVertical: Spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.small,
    marginBottom: Spacing.xs,
  },
  taskName: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
  },
  taskActionButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  taskActionIcon: {
    fontSize: 16,
  },
  addTaskButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.small,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  addTaskButtonText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
    fontWeight: '500',
  },
  categoryManageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.borderLight,
  },
  manageButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  manageButtonText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
    fontWeight: '500',
  },
  deleteText: {
    color: Colors.ui.error,
  },
  checkboxContainer: {
    marginBottom: Spacing.lg,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.solid,
    borderColor: Colors.primary.solid,
  },
  checkmark: {
    color: Colors.ui.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  checkboxHint: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginLeft: 28,
  },
});