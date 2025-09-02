import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { formatDate } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryStore } from '@/store/categoryStore';
import { useEntryStore } from '@/store/entryStore';
import { useTaskStore } from '@/store/taskStore';
import { useFocusStore } from '@/store/focusStore';
import { Category, Focus, TaskCompletionFormData } from '@/types';
import { Colors, Spacing, Typography } from '@/constants';
import { DatabaseService } from '@/services/database';

interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
}

interface TaskEntry {
  taskId?: string;
  taskName: string;
  quantity: number;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  isOtherTask: boolean;
}

type NavigationStep = 'focus' | 'category' | 'tasks';

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  selectedDate,
}) => {
  const { categories, loadCategoriesByFocus, getCategories } = useCategoryStore();
  const { getOrCreateEntry } = useEntryStore();
  const { tasks, loadTasksByCategory, createTaskCompletion } = useTaskStore();
  const { focuses, loadFocuses } = useFocusStore();

  // Navigation state
  const [currentStep, setCurrentStep] = useState<NavigationStep>('focus');
  const [selectedFocus, setSelectedFocus] = useState<Focus | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);

  // Load focuses when modal opens
  useEffect(() => {
    if (visible) {
      loadFocuses();
      // Reset navigation state
      setCurrentStep('focus');
      setSelectedFocus(null);
      setSelectedCategory(null);
      setTaskEntries([]);
    }
  }, [visible, loadFocuses]);

  // Load categories when focus is selected
  useEffect(() => {
    if (selectedFocus) {
      loadCategoriesByFocus(selectedFocus.id);
    }
  }, [selectedFocus?.id, loadCategoriesByFocus]);

  // Load tasks when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setIsLoadingExistingData(true);
      loadTasksByCategory(selectedCategory.id);
    }
  }, [selectedCategory, loadTasksByCategory]);

  // Initialize task entries with existing data when tasks are loaded
  useEffect(() => {
    const initializeTaskEntries = async () => {
      if (!selectedCategory || !selectedFocus || !tasks[selectedCategory.id]) {
        return;
      }

      try {
        // Check for existing entries on the selected date
        const dateString = formatDate(selectedDate);
        console.log('📅 AddEntryModal: Using dateString for save:', dateString);
        const existingEntries = await DatabaseService.getEntriesByDate(dateString, selectedFocus.id);
        
        // Find existing entry for this category
        const existingEntry = existingEntries.find(entry => entry.categoryId === selectedCategory.id);
        
        // Get all tasks for this category
        const categoryTasks = tasks[selectedCategory.id] || [];
        
        // Initialize task entries with existing data or defaults
        const initialEntries: TaskEntry[] = categoryTasks.map(task => {
          // Check if there's an existing completion for this task
          const existingCompletion = existingEntry?.taskCompletions?.find(
            completion => completion.taskId === task.id
          );
          
          return {
            taskId: task.id,
            taskName: task.name,
            quantity: existingCompletion?.quantity || 0,
            duration: selectedCategory.timeType === 'DURATION' 
              ? (existingCompletion?.duration || 0) 
              : undefined,
            isOtherTask: false,
          };
        });
        
        // Add any "other" tasks that exist in the existing data
        if (existingEntry?.taskCompletions) {
          const otherCompletions = existingEntry.taskCompletions.filter(
            completion => completion.isOtherTask && completion.taskName
          );
          
          otherCompletions.forEach(completion => {
            initialEntries.push({
              taskId: undefined,
              taskName: completion.taskName || '',
              quantity: completion.quantity || 0,
              duration: selectedCategory.timeType === 'DURATION' 
                ? (completion.duration || 0) 
                : undefined,
              isOtherTask: true,
            });
          });
        }
        
        setTaskEntries(initialEntries);
      } catch (error) {
        console.error('Failed to load existing data:', error);
        // Fallback to default initialization
        const categoryTasks = tasks[selectedCategory.id] || [];
        const initialEntries: TaskEntry[] = categoryTasks.map(task => ({
          taskId: task.id,
          taskName: task.name,
          quantity: 0,
          duration: selectedCategory.timeType === 'DURATION' ? 0 : undefined,
          isOtherTask: false,
        }));
        setTaskEntries(initialEntries);
      } finally {
        setIsLoadingExistingData(false);
      }
    };

    initializeTaskEntries();
  }, [selectedCategory, selectedFocus, selectedDate, tasks]);

  const availableCategories = selectedFocus
    ? getCategories(selectedFocus.id)
    : [];

  // Navigation functions
  const handleFocusSelect = (focus: Focus) => {
    setSelectedFocus(focus);
    setCurrentStep('category');
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCurrentStep('tasks');
  };

  const handleBackNavigation = () => {
    if (currentStep === 'category') {
      setCurrentStep('focus');
      setSelectedFocus(null);
    } else if (currentStep === 'tasks') {
      setCurrentStep('category');
      setSelectedCategory(null);
      setTaskEntries([]);
    }
  };

  const handleModalClose = () => {
    console.log('🚪 AddEntryModal: Closing modal and calling onClose callback');
    // Reset all state
    setCurrentStep('focus');
    setSelectedFocus(null);
    setSelectedCategory(null);
    setTaskEntries([]);
    onClose();
  };

  const updateTaskEntry = (index: number, updates: Partial<TaskEntry>) => {
    setTaskEntries(prev => 
      prev.map((entry, i) => i === index ? { ...entry, ...updates } : entry)
    );
  };

  const addOtherTask = () => {
    const newEntry: TaskEntry = {
      taskName: '',
      quantity: 0,
      duration: selectedCategory?.timeType === 'DURATION' ? 0 : undefined,
      isOtherTask: true,
    };
    setTaskEntries(prev => [...prev, newEntry]);
  };

  const removeTaskEntry = (index: number) => {
    setTaskEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCategory || !selectedFocus) return;

    console.log('💾 AddEntryModal: Save button pressed');
    console.log('   Selected category:', selectedCategory.name);
    console.log('   Selected focus:', selectedFocus.name);
    console.log('   Task entries:', taskEntries.length);

    // Separate regular tasks from "other" tasks for different validation
    const regularTasks = taskEntries.filter(entry => !entry.isOtherTask);
    const otherTasks = taskEntries.filter(entry => 
      entry.isOtherTask && 
      entry.taskName.trim() && 
      (entry.quantity > 0 || (entry.duration && entry.duration > 0))
    );

    console.log('🔍 Task filtering results:', {
      totalTasks: taskEntries.length,
      regularTasks: regularTasks.length,
      otherTasks: otherTasks.length
    });

    // Combine regular tasks (all of them, including quantity 0) with valid other tasks
    const validEntries = [...regularTasks, ...otherTasks];

    // Check if there's any meaningful data to save
    // For regular tasks: allow saving even with quantity 0 (user might be clearing data)
    // For other tasks: require quantity > 0 (already filtered above)
    const hasRegularTasks = regularTasks.length > 0;
    const hasOtherTasks = otherTasks.length > 0;
    const hasPositiveQuantities = validEntries.some(entry => 
      entry.quantity > 0 || (entry.duration && entry.duration > 0)
    );

    // Save if we have regular tasks OR if we have other tasks with positive quantities
    // This allows saving regular tasks with all quantities set to 0 (clearing data)
    if (!hasRegularTasks && !hasOtherTasks) {
      Alert.alert('No Entries', 'Please add at least one task entry.');
      return;
    }

    // If we only have regular tasks and all are 0, ask for confirmation
    if (hasRegularTasks && !hasPositiveQuantities && !hasOtherTasks) {
      Alert.alert(
        'Clear All Tasks?', 
        'All task quantities are set to 0. This will clear your data for this category on this date. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Data', style: 'destructive', onPress: () => proceedWithSave() }
        ]
      );
      return;
    }

    // Otherwise proceed with save
    await proceedWithSave();

    async function proceedWithSave() {
      const dateString = formatDate(selectedDate);
      
      console.log('🔵 AddEntryModal: Starting save process', {
        date: dateString,
        category: selectedCategory?.name,
        focus: selectedFocus?.name,
        taskCount: validEntries.length,
        tasks: validEntries.map(t => ({
          name: t.taskName,
          quantity: t.quantity,
          isOther: t.isOtherTask
        }))
      });

      setIsLoading(true);
      try {
        // Create or get entry for the selected date and category
        console.log('📝 Creating/getting entry for date:', dateString);
        const entry = await getOrCreateEntry(
          dateString,
          selectedCategory.id,
          selectedFocus.id
        );
        console.log('✅ Entry created/retrieved:', {
          entryId: entry.id,
          categoryId: selectedCategory.id,
          focusId: selectedFocus.id
        });

        // Check if we have existing task completions for this entry
        console.log('🔍 Checking for existing completions on date:', dateString);
        const existingEntries = await DatabaseService.getEntriesByDate(dateString, selectedFocus.id);
        const existingEntry = existingEntries.find(e => e.categoryId === selectedCategory.id);
        
        if (existingEntry?.taskCompletions) {
          console.log('🗑️ Deleting existing completions:', existingEntry.taskCompletions.length);
          for (const completion of existingEntry.taskCompletions) {
            await DatabaseService.deleteTaskCompletion(completion.id);
            console.log('  - Deleted completion:', completion.id, completion.taskName || 'Regular task');
          }
        } else {
          console.log('ℹ️ No existing completions found to delete');
        }

        // Add the new task completions (including those with quantity 0)
        console.log('➕ Adding new task completions:', validEntries.length);
        for (const [index, taskEntry] of validEntries.entries()) {
          const completionData: TaskCompletionFormData = {
            taskId: taskEntry.isOtherTask ? undefined : taskEntry.taskId,
            taskName: taskEntry.taskName, // Always save the task name for both regular and other tasks
            quantity: taskEntry.quantity,
            isOtherTask: taskEntry.isOtherTask,
          };

          console.log(`  ${index + 1}. Adding completion:`, {
            taskName: taskEntry.taskName,
            quantity: taskEntry.quantity,
            isOther: taskEntry.isOtherTask,
            taskId: taskEntry.taskId
          });

          const savedCompletion = await createTaskCompletion({
            ...completionData,
            entryId: entry.id,
          });
          
          console.log('    ✅ Completion saved with ID:', savedCompletion.id);
        }

        console.log('✅ Save process completed successfully');
        console.log('🔄 Closing modal and triggering calendar refresh');
        
        handleModalClose();
      } catch (error) {
        console.error('❌ Save process failed:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        Alert.alert('Error', 'Failed to save entry. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Focus Selection Screen (Step 1)
  const renderFocusSelection = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Select Focus</Text>
      <Text style={styles.stepSubtitle}>Choose which focus area to add tasks to</Text>
      
      <View style={styles.focusGrid}>
        {focuses.map((focus: Focus) => (
          <TouchableOpacity
            key={focus.id}
            style={[
              styles.focusCard,
              { borderColor: focus.color }
            ]}
            onPress={() => handleFocusSelect(focus)}
            activeOpacity={0.7}
          >
            <View style={[styles.focusColorIndicator, { backgroundColor: focus.color }]} />
            <Text style={styles.focusEmoji}>{focus.emoji}</Text>
            <Text style={styles.focusName}>{focus.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Category Selection Screen (Step 2)
  const renderCategorySelection = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Select Category</Text>
      <Text style={styles.stepSubtitle}>
        Choose a category from {selectedFocus?.name}
      </Text>
      
      <View style={styles.categoryGrid}>
        {availableCategories.map((category: Category) => {
          const taskCount = tasks[category.id]?.length || 0;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { borderColor: category.color }
              ]}
              onPress={() => handleCategorySelect(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryColorIndicator, { backgroundColor: category.color }]} />
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryTaskCount}>
                {taskCount} task{taskCount !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          );
        })}
        
        {availableCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubtext}>Create categories in this focus first</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Task Entry Screen (Step 3)
  const renderTaskEntry = (entry: TaskEntry, index: number) => (
    <View key={index} style={styles.taskEntry}>
      <View style={styles.taskEntryHeader}>
        {entry.isOtherTask ? (
          <TextInput
            style={styles.taskNameInput}
            value={entry.taskName}
            onChangeText={(text) => updateTaskEntry(index, { taskName: text })}
            placeholder="Enter task name"
            placeholderTextColor={Colors.text.secondary}
          />
        ) : (
          <Text style={styles.taskName}>{entry.taskName}</Text>
        )}
        {entry.isOtherTask && (
          <TouchableOpacity
            onPress={() => removeTaskEntry(index)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.taskControls}>
        {selectedCategory?.timeType === 'DURATION' ? (
          <View style={styles.durationControl}>
            <Text style={styles.controlLabel}>Duration (min)</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateTaskEntry(index, { 
                  duration: Math.max(0, (entry.duration || 0) - 15) 
                })}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{entry.duration || 0}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateTaskEntry(index, { 
                  duration: (entry.duration || 0) + 15 
                })}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.quantitySection}>
            <Text style={styles.controlLabel}>Quantity</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateTaskEntry(index, { 
                  quantity: Math.max(0, entry.quantity - 1) 
                })}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{entry.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateTaskEntry(index, { 
                  quantity: entry.quantity + 1 
                })}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderTaskEntryScreen = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>
          {selectedFocus?.emoji} {selectedFocus?.name}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
        <Text style={styles.breadcrumbText}>
          {selectedCategory?.emoji} {selectedCategory?.name}
        </Text>
      </View>

      <Text style={styles.stepTitle}>Add Tasks</Text>
      <Text style={styles.stepSubtitle}>
        Set quantities for existing tasks or add custom tasks
      </Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TouchableOpacity
            onPress={addOtherTask}
            style={styles.addOtherButton}
          >
            <Ionicons name="add-circle" size={20} color={selectedCategory?.color} />
            <Text style={[styles.addOtherText, { color: selectedCategory?.color }]}>
              Add Other Task
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingExistingData ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading existing data...</Text>
          </View>
        ) : (
          <>
            {taskEntries.map((entry, index) => renderTaskEntry(entry, index))}

            {taskEntries.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks available</Text>
                <Text style={styles.emptySubtext}>Add an "other" task to get started</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          {/* Back/Close Button */}
          <TouchableOpacity 
            onPress={currentStep === 'focus' ? handleModalClose : handleBackNavigation}
            style={styles.closeButton}
          >
            <Ionicons 
              name={currentStep === 'focus' ? "close" : "arrow-back"} 
              size={24} 
              color={Colors.text.dark} 
            />
          </TouchableOpacity>

          {/* Header Title */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {currentStep === 'focus' && 'Add Entry'}
              {currentStep === 'category' && 'Select Category'}  
              {currentStep === 'tasks' && 'Add Tasks'}
            </Text>
            <Text style={styles.headerDate}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
          </View>

          {/* Save Button (only visible in tasks step) */}
          {currentStep === 'tasks' ? (
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              disabled={isLoading || !selectedCategory || !selectedFocus}
            >
              <Text style={[
                styles.saveButtonText,
                (!selectedCategory || isLoading || !selectedFocus) && styles.saveButtonTextDisabled
              ]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.saveButton} />
          )}
        </View>

        {/* Content based on current step */}
        {currentStep === 'focus' && renderFocusSelection()}
        {currentStep === 'category' && renderCategorySelection()}
        {currentStep === 'tasks' && renderTaskEntryScreen()}
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.light,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    alignItems: 'center' as const,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
  },
  headerDate: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
    fontWeight: '600' as const,
  },
  saveButtonTextDisabled: {
    color: Colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginVertical: Spacing.md,
  },
  
  // Step navigation styles
  stepTitle: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    textAlign: 'center' as const,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  
  // Breadcrumb styles
  breadcrumb: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  breadcrumbText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '500' as const,
  },
  
  // Focus selection styles
  focusGrid: {
    gap: Spacing.md,
  },
  focusCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    shadowColor: Colors.text.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  focusColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  focusEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  focusName: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    flex: 1,
    fontWeight: '600' as const,
  },
  
  // Category selection styles  
  categoryGrid: {
    gap: Spacing.md,
  },
  categoryCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    shadowColor: Colors.text.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  categoryName: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '600' as const,
    flex: 1,
  },
  categoryTaskCount: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginRight: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
  },
  addOtherButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  addOtherText: {
    ...Typography.body.regular,
    fontWeight: '500' as const,
  },
  taskEntry: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskEntryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.sm,
  },
  taskName: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    flex: 1,
  },
  taskNameInput: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.light,
    paddingBottom: 4,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  taskControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  quantitySection: {
    flex: 1,
  },
  durationControl: {
    flex: 1,
  },
  controlLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  quantityControl: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.text.light,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityButtonText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '600' as const,
  },
  quantityValue: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500' as const,
    minWidth: 40,
    textAlign: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
  },
  emptySubtext: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: Spacing.xs,
  },
  loadingState: {
    alignItems: 'center' as const,
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
  },
};