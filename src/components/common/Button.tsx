import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'gradient';
  size?: 'small' | 'regular' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;
  
  const sizeStyles = {
    small: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.base,
    },
    regular: {
      paddingVertical: Spacing.padding.button.vertical,
      paddingHorizontal: Spacing.padding.button.horizontal,
    },
    large: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxxl,
    },
  };
  
  const textSizeStyles = {
    small: Typography.button.small,
    regular: Typography.button.regular,
    large: Typography.button.large,
  };
  
  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? Colors.primary.solid : Colors.text.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            textSizeStyles[size],
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'gradient' && styles.gradientText,
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </>
  );
  
  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.primary.start, Colors.primary.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            fullWidth && styles.fullWidth,
          ]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyles[size],
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {buttonContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.button.primaryBackground,
  },
  secondary: {
    backgroundColor: Colors.button.secondaryBackground,
    borderWidth: 2,
    borderColor: Colors.primary.solid,
  },
  disabled: {
    backgroundColor: Colors.button.disabledBackground,
    borderColor: Colors.button.disabledBackground,
  },
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.button.primaryText,
  },
  secondaryText: {
    color: Colors.primary.solid,
  },
  gradientText: {
    color: Colors.text.white,
  },
  disabledText: {
    color: Colors.button.disabledText,
  },
});