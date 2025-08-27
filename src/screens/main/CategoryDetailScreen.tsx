import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';
import { TopBar, Card, Button } from '@/components/common';
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

type CategoryDetailScreenNavigationProp = StackNavigationProp<any>;
type CategoryDetailScreenRouteProp = RouteProp<any, any>;

interface TaskItemProps {
  task: Task;
  completion: TaskCompletion | null;
  onCheck: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  completion,
  onCheck,
  onQuantityChange,
}) => {
  const [isChecked, setIsChecked] = useState(!!completion);
  const [quantity, setQuantity] = useState(completion?.quantity?.toString() || '');
  const [showQuantity, setShowQuantity] = useState(!!completion);

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

  return (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handleCheck}
        activeOpacity={0.7}
      >
        <View style={[styles.checkboxInner, isChecked && styles.checkboxChecked]}>
          {isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Text style={styles.taskName}>{task.name}</Text>

      {showQuantity && (
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={handleQuantityChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.text.secondary}
        />
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
  const { tasks: allTasks, loadTasksByCategory } = useTaskStore();
  const {
    entries: allEntries,
    currentDate,
    loadEntriesForDate,
    getOrCreateEntry,
    addTaskCompletion,
    updateTaskCompletion,
    removeTaskCompletion,
  } = useEntryStore();

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherTaskName, setOtherTaskName] = useState('');
  const [otherTaskQuantity, setOtherTaskQuantity] = useState('');

  const category = allCategories[activeFocus?.id || '']?.find(c => c.id === categoryId);
  const tasks = allTasks[categoryId] || [];
  const todayEntries = allEntries[currentDate] || [];
  const categoryEntry = todayEntries.find(e => e.categoryId === categoryId);
  const taskCompletions = categoryEntry?.taskCompletions || [];

  useEffect(() => {
    if (categoryId) {
      loadTasksByCategory(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (activeFocus) {
      loadEntriesForDate(currentDate, activeFocus.id);
    }
  }, [currentDate, activeFocus]);

  const handleTaskCheck = async (task: Task, checked: boolean) => {
    if (!activeFocus || !category) return;

    try {
      // Get or create entry for today
      const entry = categoryEntry || await getOrCreateEntry(currentDate, categoryId, activeFocus.id);

      const existingCompletion = taskCompletions.find(tc => tc.taskId === task.id);

      if (checked && !existingCompletion) {
        // Create new completion with default quantity of 1
        await addTaskCompletion(entry.id, task.id, task.name, 1, false);
      } else if (!checked && existingCompletion) {
        // Remove completion
        await removeTaskCompletion(existingCompletion.id, entry.id);
      }

      // Reload data
      await loadEntriesForDate(currentDate, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleQuantityChange = async (task: Task, quantity: number) => {
    if (!activeFocus || !category) return;

    try {
      const entry = categoryEntry || await getOrCreateEntry(currentDate, categoryId, activeFocus.id);
      const existingCompletion = taskCompletions.find(tc => tc.taskId === task.id);

      if (existingCompletion) {
        await updateTaskCompletion(existingCompletion.id, quantity);
      } else {
        await addTaskCompletion(entry.id, task.id, task.name, quantity, false);
      }

      await loadEntriesForDate(currentDate, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleAddOtherTask = async () => {
    if (!otherTaskName.trim() || !otherTaskQuantity.trim()) {
      Alert.alert('Error', 'Please enter task name and quantity');
      return;
    }

    if (!activeFocus || !category) return;

    try {
      const entry = categoryEntry || await getOrCreateEntry(currentDate, categoryId, activeFocus.id);
      const quantity = parseInt(otherTaskQuantity) || 1;

      await addTaskCompletion(entry.id, null, otherTaskName, quantity, true);
      
      setShowOtherModal(false);
      setOtherTaskName('');
      setOtherTaskQuantity('');
      
      await loadEntriesForDate(currentDate, activeFocus.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
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

  // For time clock categories, show a different UI
  if (category.timeType === TimeType.CLOCK) {
    return (
      <View style={styles.container}>
        <TopBar
          title={activeFocus?.name || ''}
          subtitle={category.name}
          leftIcon={<Text style={styles.backIcon}>‹</Text>}
          onLeftPress={() => navigation.goBack()}
          gradient={true}
        />
        <View style={styles.timeClockContainer}>
          <Text style={styles.timeClockEmoji}>{category.emoji}</Text>
          <Text style={styles.timeClockMessage}>
            Use the time clock widget on the home screen to track your time
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        title={activeFocus?.name || ''}
        subtitle={category.name}
        leftIcon={<Text style={styles.backIcon}>‹</Text>}
        onLeftPress={() => navigation.goBack()}
        gradient={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        <View style={styles.tasksList}>
          {tasks.map((task) => {
            const completion = taskCompletions.find(tc => tc.taskId === task.id);
            return (
              <TaskItem
                key={task.id}
                task={task}
                completion={completion}
                onCheck={(checked) => handleTaskCheck(task, checked)}
                onQuantityChange={(quantity) => handleQuantityChange(task, quantity)}
              />
            );
          })}

          {/* Show other tasks that were added for today */}
          {taskCompletions
            .filter(tc => tc.isOtherTask)
            .map((completion) => (
              <View key={completion.id} style={styles.otherTaskItem}>
                <View style={styles.otherTaskInfo}>
                  <Text style={styles.otherTaskLabel}>Other:</Text>
                  <Text style={styles.otherTaskName}>{completion.taskName}</Text>
                </View>
                <Text style={styles.otherTaskQuantity}>{completion.quantity}</Text>
              </View>
            ))}
        </View>

        <TouchableOpacity
          style={styles.otherButton}
          onPress={() => setShowOtherModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.otherButtonText}>+ Other</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showOtherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOtherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Add Other Task</Text>
            
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
                size="medium"
              />
              <Button
                title="Add Task"
                onPress={handleAddOtherTask}
                variant="primary"
                size="medium"
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
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.padding.screen,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    marginBottom: Spacing.xs,
  },
  dateText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
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
  taskName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    flex: 1,
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
  otherTaskLabel: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
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
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.button,
    alignItems: 'center',
  },
  otherButtonText: {
    ...Typography.body.large,
    color: Colors.primary.solid,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});