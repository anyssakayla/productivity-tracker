import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, ProgressBar, Button, BackButton } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useAppStore } from '@/store';
import { FocusFormData } from '@/types';

type FocusSelectionScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'FocusSelection'>;
type FocusSelectionScreenRouteProp = RouteProp<OnboardingStackParamList, 'FocusSelection'>;

interface FocusSelectionScreenProps {
  navigation: FocusSelectionScreenNavigationProp;
  route: FocusSelectionScreenRouteProp;
}

interface FocusOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const focusOptions: FocusOption[] = [
  {
    id: 'work',
    name: 'Work',
    emoji: '💼',
    color: Colors.focus.work,
    description: 'Track professional tasks and time',
  },
  {
    id: 'personal',
    name: 'Personal',
    emoji: '🏠',
    color: Colors.focus.personal,
    description: 'Monitor personal goals and habits',
  },
  {
    id: 'custom',
    name: 'Custom Focus',
    emoji: '➕',
    color: Colors.focus.custom,
    description: 'Create your own tracking area',
  },
];

export const FocusSelectionScreen: React.FC<FocusSelectionScreenProps> = ({ navigation, route }) => {
  const { updateOnboardingData } = useAppStore();
  const [selectedFocus, setSelectedFocus] = useState<string>('');

  const handleContinue = () => {
    const selected = focusOptions.find(f => f.id === selectedFocus);
    if (selected && selected.id !== 'custom') {
      const focusData: FocusFormData = {
        name: selected.name,
        emoji: selected.emoji,
        color: selected.color,
      };
      updateOnboardingData({ firstFocus: focusData });
      navigation.navigate('CategorySetup', { 
        profile: route.params.profile,
        focus: focusData,
      });
    }
    // TODO: Handle custom focus creation
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <ProgressBar progress={0.66} style={styles.progressBar} />
          
          <Text style={styles.title}>Choose Your First Focus</Text>
          <Text style={styles.subtitle}>Select a tracking area or create your own</Text>
          
          <View style={styles.focusOptions}>
            {focusOptions.map((focus) => (
              <TouchableOpacity
                key={focus.id}
                style={[
                  styles.focusOption,
                  selectedFocus === focus.id && styles.focusOptionSelected,
                ]}
                onPress={() => setSelectedFocus(focus.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.focusIcon, { backgroundColor: focus.color }]}>
                  <Text style={styles.focusEmoji}>{focus.emoji}</Text>
                </View>
                <View style={styles.focusDetails}>
                  <Text style={styles.focusName}>{focus.name}</Text>
                  <Text style={styles.focusDescription}>{focus.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <Button
            title="Next: Add Categories"
            onPress={handleContinue}
            variant="gradient"
            size="large"
            fullWidth
            disabled={!selectedFocus || selectedFocus === 'custom'}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
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
    marginBottom: Spacing.xxxl,
  },
  focusOptions: {
    marginBottom: Spacing.xxxl,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  focusOptionSelected: {
    borderColor: Colors.primary.solid,
    backgroundColor: '#f0f4ff',
  },
  focusIcon: {
    width: 50,
    height: 50,
    borderRadius: Spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  focusEmoji: {
    fontSize: 24,
  },
  focusDetails: {
    flex: 1,
  },
  focusName: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    marginBottom: Spacing.xs,
  },
  focusDescription: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
  button: {
    marginTop: 'auto',
  },
});