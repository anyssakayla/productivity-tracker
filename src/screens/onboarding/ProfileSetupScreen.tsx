import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, ProgressBar, Input, Button } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { useAppStore } from '@/store';
import { ProfileFormData } from '@/types';

type ProfileSetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'ProfileSetup'>;

interface ProfileSetupScreenProps {
  navigation: ProfileSetupScreenNavigationProp;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
  const { updateOnboardingData } = useAppStore();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    birthday: undefined,
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateOnboardingData({ profile: formData });
      navigation.navigate('FocusSelection', { profile: formData });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <ProgressBar progress={0.33} style={styles.progressBar} />
            
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>Let's personalize your experience</Text>
            
            <View style={styles.form}>
              <Input
                label="Your Name"
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(name) => setFormData({ ...formData, name })}
                error={errors.name}
                required
              />
              
              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(email) => setFormData({ ...formData, email })}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />
              
              <Input
                label="Birthday (Optional)"
                placeholder="MM/DD/YYYY"
                value={formData.birthday}
                onChangeText={(birthday) => setFormData({ ...formData, birthday })}
              />
              
              <Text style={styles.helpText}>
                Your email will be used for data exports.{'\n'}
                Birthday unlocks special celebrations! 🎉
              </Text>
            </View>
            
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="gradient"
              size="large"
              fullWidth
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
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
  form: {
    marginBottom: Spacing.xxl,
  },
  helpText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  button: {
    marginTop: 'auto',
  },
});