import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';

interface TopBarProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  onTitlePress?: () => void;
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
  onTitlePress,
  gradient = true,
  style,
  emoji,
}) => {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={styles.contentContainer}>
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
        <TouchableOpacity
          style={styles.titleContainer}
          onPress={onTitlePress}
          disabled={!onTitlePress}
          activeOpacity={0.7}
        >
          <View style={styles.titleRow}>
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <Text style={[styles.title, gradient && styles.whiteText]}>
              {title}
            </Text>
            {onTitlePress && (
              <Text style={[styles.dropdownIcon, gradient && styles.whiteText]}>
                ▼
              </Text>
            )}
          </View>
          {subtitle && (
            <Text style={[styles.subtitle, gradient && styles.whiteText]}>
              {subtitle}
            </Text>
          )}
        </TouchableOpacity>
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
    </View>
  );
  
  if (gradient) {
    return (
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, { paddingTop: insets.top }, style]}
      >
        {content}
      </LinearGradient>
    );
  }
  
  return (
    <View style={[styles.container, styles.solidContainer, { paddingTop: insets.top }, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.padding.screen,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
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
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
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
  dropdownIcon: {
    fontSize: 10,
    marginLeft: Spacing.xs,
    color: Colors.text.primary,
  },
});