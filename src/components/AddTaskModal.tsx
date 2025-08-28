import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';
import { Button } from '@/components/common';
import { useTaskStore } from '@/store';
import { TaskFormData } from '@/types';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId: string;
  onTaskAdded?: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  categoryId,
  onTaskAdded,
}) => {
  const insets = useSafeAreaInsets();
  const { createTask, isLoading } = useTaskStore();
  const [taskName, setTaskName] = useState('');

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      const taskData: TaskFormData = {
        name: taskName.trim(),
        isRecurring: true, // Permanent tasks are recurring
      };

      await createTask(categoryId, taskData);
      
      // Reset form and close modal
      setTaskName('');
      onClose();
      
      // Notify parent if callback provided
      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleCancel = () => {
    setTaskName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.modalTitle}>Add Permanent Task</Text>
          <Text style={styles.modalSubtitle}>
            This task will be available every day for this category
          </Text>
          
          <View style={styles.modalForm}>
            <Text style={styles.inputLabel}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Enter task name (e.g., Study, Exercise, Read)"
              placeholderTextColor={Colors.text.secondary}
              autoFocus={true}
              maxLength={50}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              size="medium"
              disabled={isLoading}
            />
            <Button
              title={isLoading ? "Adding..." : "Add Task"}
              onPress={handleAddTask}
              variant="primary"
              size="medium"
              disabled={isLoading || !taskName.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Spacing.borderRadius.large,
    borderTopRightRadius: Spacing.borderRadius.large,
    padding: Spacing.lg,
    minHeight: 300,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
    ...Typography.body.medium,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...Typography.body.regular,
    backgroundColor: Colors.ui.backgroundSecondary,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text.dark,
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
});