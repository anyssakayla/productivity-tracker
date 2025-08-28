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
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  onTitlePress?: () => void;
  onBack?: () => void;
  gradient?: boolean;
  focusColor?: string;
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
  onBack,
  gradient = true,
  focusColor,
  style,
  emoji,
}) => {
  const insets = useSafeAreaInsets();
  
  // Generate theme colors from focus color
  const themeColors = focusColor 
    ? generateThemeFromFocus(focusColor)
    : DEFAULT_THEME_COLORS;
  const content = (
    <View style={styles.contentContainer}>
      <View style={styles.leftSection}>
        {(leftIcon || onBack) && (
          <TouchableOpacity
            onPress={onLeftPress || onBack}
            style={styles.iconButton}
            disabled={!onLeftPress && !onBack}
          >
            {leftIcon || (onBack && <Text style={[styles.backArrow, gradient && { color: themeColors.contrastText }]}>‹</Text>)}
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
            <Text style={[styles.title, gradient && { color: themeColors.contrastText }]}>
              {title}
            </Text>
            {onTitlePress && (
              <Text style={[styles.dropdownIcon, gradient && { color: themeColors.contrastText }]}>
                ▼
              </Text>
            )}
          </View>
          {subtitle && (
            <Text style={[styles.subtitle, gradient && { color: themeColors.contrastText }]}>
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
        colors={[themeColors.primary.start, themeColors.primary.end]}
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
  backArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.white,
  },
});