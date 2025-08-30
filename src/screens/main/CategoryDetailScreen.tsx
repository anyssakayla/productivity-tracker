import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';
import { TopBar, Card, Button, DurationPicker } from '@/components/common';
import { TimeClockWidget } from '@/components/home';
import { AddTaskModal } from '@/components/AddTaskModal';
import { 
  useFocusStore, 
  useCategoryStore, 
  useTaskStore, 
  useEntryStore 
} from '@/store';
import { 
  Category, 
  Task, 
  TaskCompletion,
  TimeType 
} from '@/types';
import { formatDate } from '@/utils/helpers';
import { format } from 'date-fns';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

type CategoryDetailScreenNavigationProp = StackNavigationProp<any>;
type CategoryDetailScreenRouteProp = RouteProp<any, any>;

interface TaskItemProps {
  task: Task;
  completion: TaskCompletion | null;
  onCheck: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  onLongPress?: () => void;
  timeType?: TimeType;
  duration?: number; // minutes
  onDurationChange?: (minutes: number) => void;
  focusColor?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  completion,
  onCheck,
  onQuantityChange,
  onLongPress,
  timeType = TimeType.NONE,
  duration = 0,
  onDurationChange,
  focusColor,
}) => {
  const [isChecked, setIsChecked] = useState(!!completion);
  const [quantity, setQuantity] = useState(completion?.quantity?.toString() || '');
  const [showQuantity, setShowQuantity] = useState(!!completion);
  
  // Duration state for DURATION type
  const [hours, setHours] = useState(Math.floor(duration / 60).toString());
  const [minutes, setMinutes] = useState((duration % 60).toString());

  const handleCheck = () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    setShowQuantity(newChecked);
    onCheck(newChecked);
    if (!newChecked) {
      setQuantity('');
    }
  };

  const handleQuantityChange = (text: string) => {
    const num = parseInt(text) || 0;
    setQuantity(text);
    if (text && num > 0) {
      onQuantityChange(num);
    }
  };

  const handleHoursChange = (text: string) => {
    const numHours = parseInt(text) || 0;
    setHours(text);
    const totalMinutes = numHours * 60 + (parseInt(minutes) || 0);
    if (onDurationChange && totalMinutes >= 0) {
      onDurationChange(totalMinutes);
    }
  };

  const handleMinutesChange = (text: string) => {
    const numMinutes = Math.min(parseInt(text) || 0, 59); // Cap at 59 minutes
    setMinutes(numMinutes.toString());
    const totalMinutes = (parseInt(hours) || 0) * 60 + numMinutes;
    if (onDurationChange && totalMinutes >= 0) {
      onDurationChange(totalMinutes);
    }
  };

  return (
    <TouchableOpacity
      style={styles.taskItem}
      onLongPress={onLongPress}
      activeOpacity={0.9}
      disabled={!onLongPress}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handleCheck}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkboxInner, 
          isChecked && { backgroundColor: focusColor || Colors.primary.solid }
        ]}>
          {isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{task.name}</Text>
        {timeType !== TimeType.DURATION && completion && completion.quantity > 0 && !showQuantity && (
          <Text style={styles.taskCount}>#{completion.quantity}</Text>
        )}
      </View>

      {showQuantity && timeType === TimeType.DURATION && (
        <DurationPicker
          value={duration}
          onValueChange={onDurationChange || (() => {})}
          focusColor={focusColor}
        />
      )}
      
      {showQuantity && timeType !== TimeType.DURATION && (
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={handleQuantityChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.text.secondary}
        />
      )}
    </TouchableOpacity>
  );
};

interface TemporaryTaskItemProps {
  completion: TaskCompletion;
  timeType: TimeType;
  onQuantityChange: (quantity: number) => void;
  onDurationChange?: (duration: number) => void;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  focusColor?: string;
}

const TemporaryTaskItem: React.FC<TemporaryTaskItemProps> = ({
  completion,
  timeType,
  onQuantityChange,
  onDurationChange,
  onStartEdit,
  onEndEdit,
  focusColor,
}) => {
  const [quantity, setQuantity] = useState(completion.quantity.toString());
  const [isEditing, setIsEditing] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handlePress = () => {
    setIsEditing(true);
    onStartEdit?.();
  };

  const handleQuantitySubmit = () => {
    const newQuantity = parseInt(quantity) || 1;
    if (newQuantity > 0) {
      onQuantityChange(newQuantity);
    }
    setIsEditing(false);
  };

  const handleQuantityChange = (text: string) => {
    setQuantity(text);
  };

  const handleDurationChange = (minutes: number) => {
    console.log('🔄 Temp Task Duration Update:', { taskName: completion.taskName, duration: minutes });
    onDurationChange?.(minutes);
  };

  const handleEndEditing = () => {
    handleQuantitySubmit();
    onEndEdit?.();
  };

  return (
    <View style={styles.otherTaskItem}>
      <View style={styles.otherTaskInfo}>
        <Text style={styles.otherTaskName}>{completion.taskName}</Text>
      </View>
      
      {timeType === TimeType.DURATION ? (
        <DurationPicker
          value={completion.duration || 0}
          onValueChange={handleDurationChange}
          focusColor={focusColor}
        />
      ) : (
        <>
          {isEditing ? (
            <TextInput
              ref={textInputRef}
              style={styles.quantityInput}
              value={quantity}
              onChangeText={handleQuantityChange}
              onBlur={handleEndEditing}
              onEndEditing={handleEndEditing}
              onSubmitEditing={handleQuantitySubmit}
              keyboardType="number-pad"
              autoFocus={true}
              selectTextOnFocus={true}
              blurOnSubmit={true}
            />
          ) : (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
              <Text style={styles.otherTaskQuantity}>{completion.quantity}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export const CategoryDetailScreen: React.FC = () => {
  const navigation = useNavigation<CategoryDetailScreenNavigationProp>();
  const route = useRoute<CategoryDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { categoryId } = route.params || {};
  const { activeFocus } = useFocusStore();
  const { categories: allCategories } = useCategoryStore();
  const { tasks: allTasks, loadTasksByCategory, deleteTask, updateTask } = useTaskStore();
  const {
    entries: allEntries,
    loadEntriesForDate,
    getOrCreateEntry,
    addTaskCompletion,
    updateTaskCompletion,
    removeTaskCompletion,
    setDuration,
    startClock,
    stopClock,
    getActiveClockForEntry,
  } = useEntryStore();

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherTaskName, setOtherTaskName] = useState('');
  const [otherTaskQuantity, setOtherTaskQuantity] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskName, setEditTaskName] = useState('');
  const [isEditingTemporaryTask, setIsEditingTemporaryTask] = useState(false);
  
  // Duration tracking state for DURATION type categories
  const [taskDurations, setTaskDurations] = useState<Record<string, number>>({});

  // Use consistent date format
  const today = formatDate(new Date());

  // Load individual task durations from task completions
  useEffect(() => {
    console.log('📋 Loading Task Durations:', { taskCompletions: taskCompletions.length, categoryTimeType: category?.timeType });
    if (category?.timeType === TimeType.DURATION && taskCompletions.length > 0) {
      const durations: Record<string, number> = {};
      taskCompletions.forEach(completion => {
        if (completion.taskId && completion.duration !== undefined) {
          durations[completion.taskId] = completion.duration;
          console.log('⏱️ Task Duration Found:', { taskId: completion.taskId, duration: completion.duration });
        }
      });
      console.log('📋 Final Task Durations:', durations);
      setTaskDurations(durations);
    } else if (category?.timeType !== TimeType.DURATION) {
      // Clear durations for non-duration categories
      setTaskDurations({});
    }
  }, [taskCompletions, category?.timeType]);
  
  const category = allCategories[activeFocus?.id || '']?.find(c => c.id === categoryId);
  const tasks = allTasks[categoryId] || [];
  const todayEntries = allEntries[today] || [];
  const categoryEntry = todayEntries.find(e => e.categoryId === categoryId);
  const taskCompletions = categoryEntry?.taskCompletions || [];
  
  // Get active clock entry for this specific category
  const activeClockEntry = categoryEntry ? getActiveClockForEntry(categoryEntry.id) : null;

  // Generate theme colors from category color
  const themeColors = category?.color 
    ? generateThemeFromFocus(category.color)
    : DEFAULT_THEME_COLORS;

  useEffect(() => {
    if (categoryId) {
      loadTasksByCategory(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (activeFocus) {
      loadEntriesForDate(today, activeFocus.id);
    }
  }, [today, activeFocus]);

  // Load existing durations for DURATION type categories
  useEffect(() => {
    console.log('📥 Loading Durations:', { category: category?.name, timeType: category?.timeType, taskCompletions });
    
    if (category?.timeType === TimeType.DURATION) {
      // Use individual task durations from TaskCompletion records
      const durations: Record<string, number> = {};
      
      taskCompletions.forEach(tc => {
        if (!tc.isOtherTask && tc.taskId && tc.duration) {
          durations[tc.taskId] = tc.duration;
          console.log('📊 Loaded individual duration:', { taskId: tc.taskId, taskName: tc.taskName, duration: tc.duration });
        }
      });
      
      setTaskDurations(durations);
      console.log('✅ Set task durations:', durations);
    }
  }, [category, categoryEntry, taskCompletions]);

  const handleTaskCheck = async (task: Task, checked: boolean) => {
    if (!activeFocus || !category) return;

    try {
      // Get or create entry for today
      const entry = categoryEntry || await getOrCreateEntry(today, categoryId, activeFocus.id);

      const existingCompletion = taskCompletions.find(tc => tc.taskId === task.id);

      if (checked && !existingCompletion) {
        // Create new completion with default quantity of 1
        await addTaskCompletion(entry.id, task.id, task.name, 1, false);
      } else if (!checked && existingCompletion) {
        // Remove completion
        await removeTaskCompletion(existingCompletion.id, entry.id);
      }

      // Reload data
      await loadEntriesForDate(today, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleQuantityChange = async (task: Task, quantity: number) => {
    console.log('🔢 Quantity Change Request:', { taskId: task.id, taskName: task.name, quantity, categoryTimeType: category?.timeType });
    if (!activeFocus || !category) {
      console.log('❌ Missing activeFocus or category for quantity change');
      return;
    }

    try {
      const entry = categoryEntry || await getOrCreateEntry(today, categoryId, activeFocus.id);
      const existingCompletion = taskCompletions.find(tc => tc.taskId === task.id);
      
      console.log('📋 Task Completion Check:', { hasExistingCompletion: !!existingCompletion, existingCompletion });

      if (existingCompletion) {
        console.log('📝 Updating existing task completion quantity:', { completionId: existingCompletion.id, newQuantity: quantity });
        await updateTaskCompletion(existingCompletion.id, { quantity });
      } else {
        console.log('➕ Creating new task completion:', { entryId: entry.id, taskId: task.id, taskName: task.name, quantity });
        await addTaskCompletion(entry.id, task.id, task.name, quantity, false);
      }

      await loadEntriesForDate(today, activeFocus.id);
      console.log('✅ Successfully updated task quantity');
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleAddOtherTask = async () => {
    console.log('➕ Adding Other Task:', { taskName: otherTaskName, quantity: otherTaskQuantity, categoryTimeType: category?.timeType });
    if (!otherTaskName.trim() || !otherTaskQuantity.trim()) {
      console.log('⚠️ Missing task name or quantity');
      Alert.alert('Error', 'Please enter task name and quantity');
      return;
    }

    if (!activeFocus || !category) {
      console.log('❌ Missing activeFocus or category for other task');
      return;
    }

    try {
      const entry = categoryEntry || await getOrCreateEntry(today, categoryId, activeFocus.id);
      const quantity = parseInt(otherTaskQuantity) || 1;
      
      console.log('📝 Creating other task completion:', { entryId: entry.id, taskName: otherTaskName, quantity, isOtherTask: true });
      await addTaskCompletion(entry.id, null, otherTaskName, quantity, true);
      
      setShowOtherModal(false);
      setOtherTaskName('');
      setOtherTaskQuantity('');
      
      await loadEntriesForDate(today, activeFocus.id);
      console.log('✅ Successfully added other task');
    } catch (error) {
      console.error('❌ Error adding other task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleTaskLongPress = (task: Task) => {
    Alert.alert(
      task.name,
      'Choose an action:',
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditingTask(task);
            setEditTaskName(task.name);
            setShowEditModal(true);
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Task',
              `Are you sure you want to delete "${task.name}"? This will remove it from all days.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteTask(task.id, categoryId);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete task');
                    }
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEditTask = async () => {
    if (!editTaskName.trim() || !editingTask) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      await updateTask(editingTask.id, { name: editTaskName.trim() });
      setShowEditModal(false);
      setEditingTask(null);
      setEditTaskName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleTemporaryTaskQuantityChange = async (completionId: string, quantity: number) => {
    if (!activeFocus || !category) return;

    try {
      await updateTaskCompletion(completionId, { quantity });
      await loadEntriesForDate(today, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleTemporaryTaskDurationChange = async (completionId: string, duration: number) => {
    console.log('🕐 Temporary Task Duration Change:', { completionId, duration });
    if (!activeFocus || !category) {
      console.log('❌ Missing activeFocus or category for temporary task duration change');
      return;
    }

    try {
      console.log('📝 Updating temporary task completion duration:', { completionId, duration });
      await updateTaskCompletion(completionId, { duration });
      await loadEntriesForDate(today, activeFocus.id);
      console.log('✅ Successfully updated temporary task duration');
    } catch (error) {
      console.error('❌ Error updating temporary task duration:', error);
      Alert.alert('Error', 'Failed to update duration');
    }
  };

  const handleDurationChange = async (task: Task, minutes: number) => {
    console.log('🕐 Duration Change:', { taskId: task.id, taskName: task.name, minutes, oldDuration: taskDurations[task.id] });
    
    if (!activeFocus || !category || category.timeType !== TimeType.DURATION) return;

    try {
      const entry = categoryEntry || await getOrCreateEntry(today, categoryId, activeFocus.id);
      
      // Update local duration state
      setTaskDurations(prev => ({
        ...prev,
        [task.id]: minutes
      }));

      // Find the existing task completion for this task
      const existingCompletion = taskCompletions.find(tc => tc.taskId === task.id);
      
      if (existingCompletion) {
        // Update the existing task completion with the individual duration
        await updateTaskCompletion(existingCompletion.id, { duration: minutes });
        console.log('✅ Updated task completion duration:', { taskId: task.id, duration: minutes });
      } else if (minutes > 0) {
        // Create a new task completion with the duration
        await addTaskCompletion(entry.id, task.id, task.name, 1, false, minutes);
        console.log('✅ Created new task completion with duration:', { taskId: task.id, duration: minutes });
      }

      // Reload data
      await loadEntriesForDate(today, activeFocus.id);
    } catch (error) {
      console.error('❌ Failed to update task duration:', error);
      Alert.alert('Error', 'Failed to update task duration');
    }
  };

  const handleClockIn = async () => {
    if (!category || !activeFocus) return;
    
    try {
      const todayForClock = today;
      const entry = await getOrCreateEntry(todayForClock, categoryId, activeFocus.id);
      await startClock(entry.id);
      await loadEntriesForDate(today, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    console.log('🕐 Clock Out Request:', { hasActiveClockEntry: !!activeClockEntry, hasCategoryEntry: !!categoryEntry });
    if (!activeClockEntry || !categoryEntry) {
      console.log('❌ Missing activeClockEntry or categoryEntry for clock out');
      return;
    }
    
    try {
      console.log('⏹️ Stopping clock for entry:', { entryId: categoryEntry.id });
      await stopClock(categoryEntry.id);
      await loadEntriesForDate(today, activeFocus.id);
      console.log('✅ Successfully clocked out');
    } catch (error) {
      console.error('❌ Error clocking out:', error);
      Alert.alert('Error', 'Failed to clock out');
    }
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <TopBar
          title="Category Not Found"
          leftIcon={<Text style={styles.backIcon}>‹</Text>}
          onLeftPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  // For time clock categories, show TimeClockWidget at the top

  return (
    <View style={styles.container}>
      <TopBar
        title={category.name}
        leftIcon={<Text style={styles.backIcon}>‹</Text>}
        onLeftPress={() => navigation.goBack()}
        gradient={true}
        focusColor={category.color}
      />

      <TouchableWithoutFeedback 
        onPress={() => {
          if (isEditingTemporaryTask) {
            // Dismiss keyboard and blur active input
            Keyboard.dismiss();
            setIsEditingTemporaryTask(false);
          }
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* TimeClockWidget for CLOCK categories */}
        {category.timeType === TimeType.CLOCK && (
          <View style={styles.timeClockSection}>
            <TimeClockWidget
              category={category}
              activeClockEntry={activeClockEntry}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              focusColor={category.color}
            />
          </View>
        )}

        {/* Tasks Section */}
        <View style={styles.firstSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
          </View>
          
          <View style={styles.tasksList}>
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const completion = taskCompletions.find(tc => tc.taskId === task.id);
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    completion={completion}
                    onCheck={(checked) => handleTaskCheck(task, checked)}
                    onQuantityChange={(quantity) => handleQuantityChange(task, quantity)}
                    onLongPress={() => handleTaskLongPress(task)}
                    timeType={category.timeType}
                    duration={taskDurations[task.id] || 0}
                    onDurationChange={category.timeType === TimeType.DURATION ? (minutes) => handleDurationChange(task, minutes) : undefined}
                    focusColor={category.color}
                  />
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No tasks yet. Add tasks that you want to track regularly.
                </Text>
              </View>
            )}
          </View>
          
          {/* Add Task Button - moved below tasks */}
          <TouchableOpacity
            style={[styles.addTaskButtonFull, { backgroundColor: themeColors.primary.solid }]}
            onPress={() => setShowAddTaskModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addTaskButtonFullText, { color: themeColors.contrastText }]}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Temporary Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Additional Tasks</Text>
          </View>
          
          <View style={styles.tasksList}>
            {/* Show other tasks that were added for today */}
            {taskCompletions
              .filter(tc => tc.isOtherTask)
              .map((completion) => (
                <TemporaryTaskItem
                  key={completion.id}
                  completion={completion}
                  timeType={category.timeType}
                  onQuantityChange={(quantity) => handleTemporaryTaskQuantityChange(completion.id, quantity)}
                  onDurationChange={(duration) => handleTemporaryTaskDurationChange(completion.id, duration)}
                  onStartEdit={() => setIsEditingTemporaryTask(true)}
                  onEndEdit={() => setIsEditingTemporaryTask(false)}
                  focusColor={category.color}
                />
              ))}
            
            {taskCompletions.filter(tc => tc.isOtherTask).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No additional tasks added for today.
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.otherButton,
            {
              borderColor: themeColors.primary.solid,
              borderWidth: 1,
              borderStyle: 'dotted',
              backgroundColor: `${themeColors.primary.solid}15`, // 15 = ~8% opacity
            }
          ]}
          onPress={() => setShowOtherModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.otherButtonText,
            { color: themeColors.primary.solid }
          ]}>+ Other</Text>
        </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      <AddTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        categoryId={categoryId}
        onTaskAdded={() => {
          // Reload tasks after adding a new one
          loadTasksByCategory(categoryId);
        }}
      />
      
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput
                style={styles.input}
                value={editTaskName}
                onChangeText={setEditTaskName}
                placeholder="Enter task name"
                placeholderTextColor={Colors.text.secondary}
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                  setEditTaskName('');
                }}
                variant="secondary"
                size="medium"
              />
              <Button
                title="Update Task"
                onPress={handleEditTask}
                variant="primary"
                size="medium"
              />
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showOtherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOtherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Other Task</Text>
            <Text style={styles.modalSubtitle}>
              This task will only be tracked for today
            </Text>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput
                style={styles.input}
                value={otherTaskName}
                onChangeText={setOtherTaskName}
                placeholder="Enter task name"
                placeholderTextColor={Colors.text.secondary}
              />

              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={otherTaskQuantity}
                onChangeText={setOtherTaskQuantity}
                placeholder="Enter quantity"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowOtherModal(false);
                  setOtherTaskName('');
                  setOtherTaskQuantity('');
                }}
                variant="secondary"
                size="regular"
                style={{ borderColor: themeColors.primary.solid }}
                textStyle={{ color: themeColors.primary.solid }}
              />
              <Button
                title="Add"
                onPress={handleAddOtherTask}
                variant="primary"
                size="regular"
                backgroundColor={themeColors.primary.solid}
                textStyle={{ color: themeColors.contrastText }}
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
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  tasksList: {
    paddingHorizontal: Spacing.padding.screen,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  checkbox: {
    marginRight: Spacing.base,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.solid,
    borderColor: Colors.primary.solid,
  },
  checkmark: {
    color: Colors.ui.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    flex: 1,
  },
  taskCount: {
    ...Typography.body.medium,
    color: Colors.primary.solid,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  firstSection: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    fontWeight: '600',
  },
  addTaskButtonFull: {
    marginHorizontal: Spacing.padding.screen,
    marginTop: Spacing.base,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.button,
    alignItems: 'center',
  },
  addTaskButtonFullText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.padding.screen,
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quantityInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: Spacing.borderRadius.small,
    paddingHorizontal: Spacing.sm,
    textAlign: 'center',
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  otherTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  otherTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  otherTaskName: {
    ...Typography.body.large,
    color: Colors.text.dark,
  },
  otherTaskQuantity: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  otherButton: {
    marginHorizontal: Spacing.padding.screen,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.button,
    alignItems: 'center',
  },
  otherButtonText: {
    ...Typography.body.large,
    fontWeight: '600',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.ui.white,
  },
  timeClockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
  },
  timeClockEmoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  timeClockMessage: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    textAlign: 'center',
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeClockSection: {
    marginBottom: Spacing.base,
  },
});