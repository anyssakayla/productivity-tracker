import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';

interface TopBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  gradient?: boolean;
  style?: ViewStyle;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  gradient = true,
  style,
}) => {
  const content = (
    <>
      <View style={styles.leftSection}>
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.iconButton}
            disabled={!onLeftPress}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, gradient && styles.whiteText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, gradient && styles.whiteText]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {rightIcon && (
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.iconButton}
          disabled={!onRightPress}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </>
  );
  
  if (gradient) {
    return (
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, style]}
      >
        {content}
      </LinearGradient>
    );
  }
  
  return (
    <View style={[styles.container, styles.solidContainer, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Spacing.layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.padding.screen,
  },
  solidContainer: {
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.borderLight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: Spacing.sm,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  whiteText: {
    color: Colors.text.white,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});