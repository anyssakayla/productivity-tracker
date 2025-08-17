import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';

interface BackButtonProps {
  onPress: () => void;
  color?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  color = Colors.text.secondary 
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={[styles.text, { color }]}>‹ Back</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginLeft: -Spacing.base, // Align with content edge
  },
  text: {
    ...Typography.body.large,
    fontWeight: '500',
  },
});