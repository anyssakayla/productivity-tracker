import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  required = false,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.form.inputPlaceholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.label.large,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.status.error,
  },
  input: {
    backgroundColor: Colors.form.inputBackground,
    borderWidth: 2,
    borderColor: Colors.form.inputBorder,
    borderRadius: Spacing.borderRadius.input,
    paddingVertical: Spacing.padding.input.vertical,
    paddingHorizontal: Spacing.padding.input.horizontal,
    fontSize: Typography.fontSize.md,
    color: Colors.form.inputText,
  },
  inputFocused: {
    borderColor: Colors.form.inputBorderFocus,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.status.error,
    marginTop: Spacing.xs,
  },
});