import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, ProgressBar } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';

type ProfileSetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'ProfileSetup'>;

interface ProfileSetupScreenProps {
  navigation: ProfileSetupScreenNavigationProp;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar />
      
      <View style={styles.content}>
        <ProgressBar progress={0.33} style={styles.progressBar} />
        <Text style={styles.title}>Profile Setup Screen</Text>
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