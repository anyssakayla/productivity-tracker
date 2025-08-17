import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, ProgressBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';

type CategorySetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CategorySetup'>;

interface CategorySetupScreenProps {
  navigation: CategorySetupScreenNavigationProp;
}

export const CategorySetupScreen: React.FC<CategorySetupScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar />
      
      <View style={styles.content}>
        <ProgressBar progress={1} style={styles.progressBar} />
        <Text style={styles.title}>Category Setup Screen</Text>
        <Text style={styles.subtitle}>To be implemented</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.xxxl,
  },
  progressBar: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
});