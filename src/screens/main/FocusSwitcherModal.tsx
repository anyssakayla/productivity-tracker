import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore } from '@/store';
import { Focus } from '@/types';

interface FocusSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FocusSwitcherModal: React.FC<FocusSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { focuses, activeFocus, setActiveFocus } = useFocusStore();

  const handleSelectFocus = async (focus: Focus) => {
    await setActiveFocus(focus.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>Switch Focus</Text>
            </View>

            <ScrollView style={styles.focusList}>
              {focuses.map((focus) => (
                <TouchableOpacity
                  key={focus.id}
                  style={[
                    styles.focusItem,
                    activeFocus?.id === focus.id && styles.focusItemActive,
                  ]}
                  onPress={() => handleSelectFocus(focus)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.focusIcon, { backgroundColor: focus.color }]}>
                    <Text style={styles.focusEmoji}>{focus.emoji}</Text>
                  </View>
                  <Text 
                    style={[
                      styles.focusName,
                      activeFocus?.id === focus.id && styles.focusNameActive,
                    ]}
                  >
                    {focus.name}
                  </Text>
                  {activeFocus?.id === focus.id && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.ui.border,
    borderRadius: 2,
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
  },
  focusList: {
    padding: Spacing.padding.screen,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
    marginBottom: Spacing.sm,
  },
  focusItemActive: {
    backgroundColor: Colors.ui.backgroundSecondary,
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
  focusName: {
    ...Typography.body.large,
    color: Colors.text.dark,
    flex: 1,
  },
  focusNameActive: {
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.solid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.ui.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});