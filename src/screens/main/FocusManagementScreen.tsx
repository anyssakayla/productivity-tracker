import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore } from '@/store';
import { TopBar, Card } from '@/components/common';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusFormData } from '@/types';
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

export const FocusManagementScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { focuses, activeFocus, createFocus, updateFocus, deleteFocus, setActiveFocus } = useFocusStore();
  
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💼');
  const [selectedColor, setSelectedColor] = useState(Colors.focus.work);
  const [editingFocusId, setEditingFocusId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Generate theme colors from current focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a focus name');
      return;
    }

    const focusData: FocusFormData = {
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
    };

    try {
      if (editingFocusId) {
        await updateFocus(editingFocusId, focusData);
        Alert.alert('Success', 'Focus updated successfully');
      } else {
        const newFocus = await createFocus(focusData);
        if (focuses.length === 0) {
          await setActiveFocus(newFocus.id);
        }
        Alert.alert('Success', 'Focus created successfully');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save focus');
    }
  };

  const handleEdit = (focus: any) => {
    setEditingFocusId(focus.id);
    setName(focus.name);
    setSelectedEmoji(focus.emoji);
    setSelectedColor(focus.color);
    setIsCreating(true);
  };

  const handleDelete = (focusId: string) => {
    Alert.alert(
      'Delete Focus',
      'Are you sure you want to delete this focus? All associated data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFocus(focusId);
              Alert.alert('Success', 'Focus deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Cannot delete the last focus');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setSelectedEmoji('💼');
    setSelectedColor(Colors.focus.work);
    setEditingFocusId(null);
    setIsCreating(false);
  };

  const handleStartCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Manage Focuses"
        gradient={true}
        focusColor={activeFocus?.color}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isCreating ? (
          <>
            {/* Existing Focuses */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Focuses</Text>
              {focuses.map((focus) => (
                <Card key={focus.id} style={styles.focusCard}>
                  <View style={styles.focusCardContent}>
                    <View style={[styles.focusIcon, { backgroundColor: focus.color }]}>
                      <Text style={styles.focusEmoji}>{focus.emoji}</Text>
                    </View>
                    <View style={styles.focusInfo}>
                      <Text style={styles.focusName}>{focus.name}</Text>
                      {focus.isActive && (
                        <Text style={styles.activeLabel}>Active</Text>
                      )}
                    </View>
                    <View style={styles.focusActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(focus)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      {focuses.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleDelete(focus.id)}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {/* Add New Focus Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleStartCreating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[themeColors.primary.start, themeColors.primary.end]}
                style={styles.addButtonGradient}
              >
                <Text style={[styles.addButtonIcon, { color: themeColors.contrastText }]}>+</Text>
                <Text style={[styles.addButtonText, { color: themeColors.contrastText }]}>Create New Focus</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Create/Edit Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {editingFocusId ? 'Edit Focus' : 'Create New Focus'}
              </Text>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter focus name"
                  placeholderTextColor={Colors.text.light}
                  maxLength={20}
                />
              </View>

              {/* Emoji Selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Emoji</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.emojiScroll}
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        selectedEmoji === emoji && styles.emojiOptionSelected,
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Color Selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.inputLabel}>Preview</Text>
                <View style={styles.preview}>
                  <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                    <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                  </View>
                  <Text style={styles.previewName}>{name || 'Focus Name'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[themeColors.primary.start, themeColors.primary.end]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={[styles.saveButtonText, { color: themeColors.contrastText }]}>
                      {editingFocusId ? 'Update' : 'Create'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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
  focusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  focusEmoji: {
    fontSize: 24,
  },
  focusInfo: {
    flex: 1,
  },
  focusName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  activeLabel: {
    ...Typography.body.small,
    color: Colors.primary.solid,
    marginTop: 2,
  },
  focusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    ...Typography.body.regular,
    color: Colors.primary.solid,
    fontWeight: '600',
  },
  deleteButton: {},
  deleteText: {
    color: Colors.ui.error,
  },
  addButton: {
    marginTop: Spacing.xl,
    borderRadius: Spacing.borderRadius.base,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  addButtonIcon: {
    fontSize: 24,
    color: Colors.ui.white,
    marginRight: Spacing.sm,
    fontWeight: '600',
  },
  addButtonText: {
    ...Typography.body.large,
    color: Colors.ui.white,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: Spacing.xl,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text.dark,
  },
  previewContainer: {
    marginBottom: Spacing.xl,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.backgroundSecondary,
    padding: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewName: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.base,
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
    borderRadius: Spacing.borderRadius.base,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.body.large,
    color: Colors.ui.white,
    fontWeight: '600',
  },
});