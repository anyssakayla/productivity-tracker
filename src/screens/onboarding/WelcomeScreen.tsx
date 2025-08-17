import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { StatusBar, Button } from '@/components/common';
import { Colors, Typography, Spacing } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('ProfileSetup');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.primary.start, Colors.primary.end]}
            style={styles.logo}
          >
            <Text style={styles.logoText}>📊</Text>
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>ProductiTrack</Text>
        <Text style={styles.subtitle}>
          Track your productivity across work and life with customizable categories and insightful trends
        </Text>
        
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="gradient"
          size="large"
          style={styles.button}
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen * 2,
  },
  logoContainer: {
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    ...Typography.heading.h1,
    color: Colors.text.dark,
    marginBottom: Spacing.base,
  },
  subtitle: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    maxWidth: 250,
  },
});