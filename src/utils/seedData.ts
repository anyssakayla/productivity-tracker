import { DatabaseService } from '@/services/database';
import { Colors } from '@/constants';
import { TimeType } from '@/types';

export const seedDatabase = async () => {
  try {
    // Check if user already exists
    const existingUser = await DatabaseService.getUser();
    if (existingUser) {
      console.log('Database already seeded');
      return;
    }

    // Create user
    const user = await DatabaseService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      birthday: '1990-01-01',
    });

    // Create focuses
    const personalFocus = await DatabaseService.createFocus({
      name: 'Personal',
      emoji: '🏠',
      color: Colors.focusColors[0],
      isActive: true,
    });

    const workFocus = await DatabaseService.createFocus({
      name: 'Work',
      emoji: '💼',
      color: Colors.focusColors[1],
      isActive: false,
    });

    // Create categories for Personal focus
    const journalingCategory = await DatabaseService.createCategory({
      focusId: personalFocus.id,
      name: 'Journaling',
      emoji: '📓',
      color: Colors.categoryColors[0],
      timeType: TimeType.NONE,
    });

    const drawingCategory = await DatabaseService.createCategory({
      focusId: personalFocus.id,
      name: 'Drawing',
      emoji: '🎨',
      color: Colors.categoryColors[1],
      timeType: TimeType.NONE,
    });

    // Create categories for Work focus
    const physicalsCategory = await DatabaseService.createCategory({
      focusId: workFocus.id,
      name: 'Physicals',
      emoji: '🏥',
      color: Colors.categoryColors[2],
      timeType: TimeType.NONE,
    });

    const timeClockCategory = await DatabaseService.createCategory({
      focusId: workFocus.id,
      name: 'Time Clock',
      emoji: '⏰',
      color: Colors.categoryColors[3],
      timeType: TimeType.CLOCK,
    });

    // Create tasks for Journaling
    await DatabaseService.createTask({
      categoryId: journalingCategory.id,
      name: 'Morning pages',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: journalingCategory.id,
      name: 'Gratitude list',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: journalingCategory.id,
      name: 'Daily reflection',
      isRecurring: true,
    });

    // Create tasks for Drawing
    await DatabaseService.createTask({
      categoryId: drawingCategory.id,
      name: 'Sketch practice',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: drawingCategory.id,
      name: 'Digital art',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: drawingCategory.id,
      name: 'Study anatomy',
      isRecurring: true,
    });

    // Create tasks for Physicals
    await DatabaseService.createTask({
      categoryId: physicalsCategory.id,
      name: 'Patient assessment',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: physicalsCategory.id,
      name: 'Range of motion test',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: physicalsCategory.id,
      name: 'Strength evaluation',
      isRecurring: true,
    });

    await DatabaseService.createTask({
      categoryId: physicalsCategory.id,
      name: 'Treatment plan',
      isRecurring: true,
    });

    // Mark onboarding as complete
    await DatabaseService.setSetting('hasCompletedOnboarding', 'true');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};