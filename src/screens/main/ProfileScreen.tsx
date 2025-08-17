import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants';

export const ProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>User Name</Text>
        <Text style={styles.email}>user@email.com</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Profile Screen</Text>
        <Text style={styles.subtitle}>To be implemented</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  avatarText: {
    fontSize: 36,
  },
  name: {
    ...Typography.heading.h2,
    color: Colors.text.white,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body.regular,
    color: Colors.text.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: Spacing.padding.screen,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
});