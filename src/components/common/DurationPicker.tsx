import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TimerPickerModal } from 'react-native-timer-picker';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

interface DurationPickerProps {
  value: number; // minutes
  onValueChange: (minutes: number) => void;
  focusColor?: string;
  disabled?: boolean;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onValueChange,
  focusColor,
  disabled = false,
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const themeColors = focusColor 
    ? generateThemeFromFocus(focusColor)
    : DEFAULT_THEME_COLORS;

  // Convert minutes to hours and minutes for display and picker
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const formatDuration = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0 && m === 0) {
      return '0m';
    } else if (h === 0) {
      return `${m}m`;
    } else if (m === 0) {
      return `${h}h`;
    } else {
      return `${h}h ${m}m`;
    }
  };

  const handleConfirm = (pickedDuration: { hours: number; minutes: number; seconds: number }) => {
    const totalMinutes = pickedDuration.hours * 60 + pickedDuration.minutes;
    onValueChange(totalMinutes);
    setIsPickerVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.durationButton,
          { borderColor: themeColors.primary.solid },
          disabled && styles.disabledButton
        ]}
        onPress={() => !disabled && setIsPickerVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.durationText,
          { color: value > 0 ? themeColors.primary.solid : Colors.text.secondary },
          disabled && styles.disabledText
        ]}>
          {formatDuration(value)}
        </Text>
      </TouchableOpacity>

      <TimerPickerModal
        visible={isPickerVisible}
        setIsVisible={setIsPickerVisible}
        onConfirm={handleConfirm}
        modalTitle="Set Duration"
        onCancel={() => setIsPickerVisible(false)}
        closeOnOverlayPress
        initialValue={{
          hours,
          minutes,
          seconds: 0
        }}
        modalProps={{
          overlayOpacity: 0.2,
        }}
        confirmButtonText="Set Duration"
        cancelButtonText="Cancel"
        // Hide seconds picker since we only need hours and minutes
        hideSeconds={true}
        // Pass LinearGradient and MaskedView for iOS-style appearance
        LinearGradient={LinearGradient}
        MaskedView={MaskedView}
        // Custom labels for hours and minutes
        hourLabel="hours"
        minuteLabel="min"
        // Custom styles for iOS wheel picker appearance
        styles={{
          theme: "light",
          backgroundColor: Colors.background.primary,
          pickerItem: {
            fontSize: 26,
          },
          pickerLabel: {
            fontSize: 26,
            marginTop: 0,
            color: Colors.text.dark,
            fontWeight: '500',
          },
          pickerContainer: {
            marginRight: 8,
          },
          pickerItemContainer: {
            width: 130,
          },
          pickerLabelContainer: {
            right: -20,
            top: 0,
            bottom: 6,
            width: 80,
            alignItems: "center",
          },
          confirmButton: {
            backgroundColor: themeColors.primary.solid,
            borderRadius: Spacing.borderRadius.button,
          },
          confirmButtonText: {
            color: Colors.text.white,
            fontWeight: '600',
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  durationButton: {
    borderWidth: 1,
    borderRadius: Spacing.borderRadius.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  disabledButton: {
    borderColor: Colors.ui.border,
    backgroundColor: Colors.ui.backgroundSecondary,
  },
  durationText: {
    ...Typography.body.regular,
    fontWeight: '500',
  },
  disabledText: {
    color: Colors.text.secondary,
  },
});