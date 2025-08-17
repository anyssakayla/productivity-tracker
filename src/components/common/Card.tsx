import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing } from '@/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = Spacing.padding.card,
  onPress,
  shadow = true,
}) => {
  const content = (
    <View
      style={[
        styles.card,
        shadow && styles.shadow,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.card,
  },
  shadow: {
    shadowColor: Colors.ui.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});