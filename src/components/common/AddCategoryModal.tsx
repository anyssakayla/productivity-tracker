import React, { useState, useEffect } from 'react';
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
import { CategoryColorPicker } from '@/components/common';
import { useCategoryStore, useFocusStore } from '@/store';
import { TimeType } from '@/types';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoryAdded?: () => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onCategoryAdded,
}) => {
  const insets = useSafeAreaInsets();
  const { createCategory, loadCategoriesByFocus } = useCategoryStore();
  const { activeFocus } = useFocusStore();
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryTimeType, setCategoryTimeType] = useState<TimeType>(TimeType.NONE);
  const [categoryColor, setCategoryColor] = useState<string>(activeFocus?.color || Colors.primary.solid);

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  // Update default color when focus changes
  useEffect(() => {
    setCategoryColor(activeFocus?.color || Colors.primary.solid);
  }, [activeFocus]);

  const handleAddCategory = async () => {
    if (!categoryName.trim() || !activeFocus) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    try {
      await createCategory(activeFocus.id, {
        name: categoryName.trim(),
        emoji: '', // Empty emoji since categories should not have emojis
        color: categoryColor,
        timeType: categoryTimeType,
      });
      
      // Reset form and close modal
      setCategoryName('');
      setCategoryTimeType(TimeType.NONE);
      setCategoryColor(activeFocus?.color || Colors.primary.solid);
      onClose();
      
      // Reload categories and notify parent
      await loadCategoriesByFocus(activeFocus.id);
      onCategoryAdded?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const handleCancel = () => {
    setCategoryName('');
    setCategoryTimeType(TimeType.NONE);
    setCategoryColor(activeFocus?.color || Colors.primary.solid);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Add New Category</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={Colors.text.light}
              maxLength={30}
              autoFocus={true}
            />
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
                    {type === TimeType.CLOCK ? 'Clock' : 
                     type === TimeType.DURATION ? 'Duration' : 'None'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Color</Text>
            <CategoryColorPicker
              focusColor={activeFocus?.color || Colors.primary.solid}
              selectedColor={categoryColor}
              onColorSelect={setCategoryColor}
              showRelationship={false}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColors.primary.solid }]}
              onPress={handleAddCategory}
            >
              <Text style={[styles.saveButtonText, { color: themeColors.contrastText }]}>
                Add Category
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.padding.screen,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
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
    ...Typography.body.regular,
    color: Colors.text.dark,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.ui.backgroundSecondary,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.base,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.ui.backgroundSecondary,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.body.regular,
    fontWeight: '600',
  },
});