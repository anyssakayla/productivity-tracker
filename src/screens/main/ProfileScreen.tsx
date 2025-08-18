import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';
import { Card } from '@/components/common';
import { useUserStore, useFocusStore, useCategoryStore, useAppStore } from '@/store';
import { Focus } from '@/types';

type ProfileScreenNavigationProp = StackNavigationProp<any>;

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true 
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>{icon}</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        {showArrow && <Text style={styles.menuArrow}>›</Text>}
      </Card>
    </TouchableOpacity>
  );
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { currentUser } = useUserStore();
  const { focuses, activeFocus } = useFocusStore();
  const { getCategories } = useCategoryStore();
  const { resetOnboarding } = useAppStore();
  
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    loadCategoryCount();
  }, [activeFocus]);

  const loadCategoryCount = async () => {
    if (activeFocus) {
      const categories = await getCategories(activeFocus.id);
      setCategoryCount(categories.length);
    }
  };

  const handleManageCategories = () => {
    // Navigate to CategoryManagementScreen
    navigation.navigate('CategoryManagement' as any);
  };

  const handleChangeFocus = () => {
    Alert.alert(
      'Change Focus',
      'Select a focus area:',
      [
        ...focuses.map(focus => ({
          text: `${focus.emoji} ${focus.name}`,
          onPress: () => {
            // Set active focus logic here
            Alert.alert('Success', `Switched to ${focus.name} focus`);
          }
        })),
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature coming soon!');
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all your data and return to the welcome screen. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            // The app will automatically navigate to onboarding
          }
        }
      ]
    );
  };

  const firstName = currentUser?.name.split(' ')[0] || 'User';
  const initials = currentUser?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{currentUser?.name || 'User Name'}</Text>
        <Text style={styles.email}>{currentUser?.email || 'user@email.com'}</Text>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus & Categories</Text>
          
          <MenuItem
            icon={activeFocus?.emoji || '🎯'}
            title="Current Focus"
            subtitle={activeFocus?.name || 'No focus selected'}
            onPress={handleChangeFocus}
          />
          
          <MenuItem
            icon="📁"
            title="Manage Categories"
            subtitle={`${categoryCount} categories active`}
            onPress={handleManageCategories}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Export</Text>
          
          <MenuItem
            icon="📊"
            title="Export Data"
            subtitle="Download your tracking data"
            onPress={handleExportData}
          />
          
          <MenuItem
            icon="📅"
            title="Data Range"
            subtitle="All time"
            onPress={() => Alert.alert('Data Range', 'Date range selection coming soon')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuItem
            icon="🔔"
            title="Notifications"
            subtitle="Reminders and alerts"
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
          />
          
          <MenuItem
            icon="🎨"
            title="Appearance"
            subtitle="Theme and display"
            onPress={() => Alert.alert('Appearance', 'Theme settings coming soon')}
          />
          
          <MenuItem
            icon="🔐"
            title="Privacy & Security"
            subtitle="Data protection"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon')}
          />
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="🔄"
            title="Reset App"
            subtitle="Clear all data and start over"
            onPress={handleResetApp}
            showArrow={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>ProductiTrack v1.0.0</Text>
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
  header: {
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
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 28,
    color: Colors.ui.white,
    fontWeight: '600',
  },
  name: {
    ...Typography.heading.h2,
    color: Colors.ui.white,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body.regular,
    color: Colors.ui.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.padding.screen,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.base,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ui.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body.large,
    color: Colors.text.dark,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  menuArrow: {
    fontSize: 24,
    color: Colors.text.light,
  },
  footer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  version: {
    ...Typography.body.small,
    color: Colors.text.light,
  },
});