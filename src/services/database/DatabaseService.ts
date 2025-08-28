import * as SQLite from 'expo-sqlite';
import { 
  DATABASE_NAME, 
  DATABASE_VERSION, 
  SCHEMA, 
  INDEXES, 
  TABLES 
} from './schema';
import { 
  User, 
  Focus, 
  Category, 
  Task,
  Entry, 
  TaskCompletion,
  TimeEntry,
  CategoryWithTasks,
  EntryWithTaskCompletions
} from '@/types';
import { generateId } from '@/utils/helpers';

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync(DATABASE_NAME);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing database...');
      
      // Create tables
      for (const [tableName, sql] of Object.entries(SCHEMA)) {
        console.log(`📋 Creating table if not exists: ${tableName}`);
        await this.db.execAsync(sql);
      }

      // Create indexes
      console.log('🔧 Creating indexes...');
      for (const indexSql of INDEXES) {
        await this.db.execAsync(indexSql);
      }

      // Always run migrations to ensure columns exist
      await this.runMigrations();
      
      console.log('✅ Database initialization complete');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    console.log('🔄 Starting database migrations...');
    
    // Check if duration column exists first (critical fix)
    const hasColumn = await this.checkColumnExists('task_completions', 'duration');
    console.log(`📊 Duration column exists: ${hasColumn}`);
    
    if (!hasColumn) {
      console.log('⚠️ Duration column missing, adding it now...');
      try {
        await this.db.execAsync(
          `ALTER TABLE ${TABLES.task_completions} ADD COLUMN duration INTEGER`
        );
        console.log('✅ Duration column added successfully');
      } catch (error) {
        console.error('❌ Failed to add duration column:', error);
        throw error;
      }
    }
    
    // Continue with version-based migrations
    const currentVersion = await this.getCurrentVersion();
    console.log(`📊 Current DB version: ${currentVersion}, Target version: ${DATABASE_VERSION}`);
    
    if (currentVersion < DATABASE_VERSION) {
      // Additional migrations for future versions would go here
      await this.setCurrentVersion(DATABASE_VERSION);
      console.log(`✅ Database updated to version ${DATABASE_VERSION}`);
    } else {
      console.log('✅ Database already at current version');
    }
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      // First check if migrations table exists
      const tableExists = await this.db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLES.migrations}'`
      );
      
      if (!tableExists) {
        console.log('⚠️ Migrations table does not exist, assuming version 0');
        return 0;
      }
      
      const result = await this.db.getFirstAsync<{ version: number }>(
        `SELECT MAX(version) as version FROM ${TABLES.migrations}`
      );
      const version = result?.version || 0;
      console.log(`📊 Retrieved database version: ${version}`);
      return version;
    } catch (error) {
      console.error('❌ Error getting database version:', error);
      return 0;
    }
  }

  private async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      // Get all columns for the table
      const columns = await this.db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(${tableName})`
      );
      const hasColumn = columns.some(col => col.name === columnName);
      console.log(`📋 Table ${tableName} columns:`, columns.map(c => c.name));
      return hasColumn;
    } catch (error) {
      console.error(`❌ Error checking column ${columnName} in ${tableName}:`, error);
      return false;
    }
  }

  private async setCurrentVersion(version: number): Promise<void> {
    try {
      await this.db.runAsync(
        `INSERT INTO ${TABLES.migrations} (version, applied_at) VALUES (?, ?)`,
        [version, new Date().toISOString()]
      );
      console.log(`📝 Set database version to ${version}`);
    } catch (error) {
      console.error(`❌ Error setting database version to ${version}:`, error);
      throw error;
    }
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.users} (id, name, email, birthday, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user.name, user.email, user.birthday || null, now, now]
    );

    return { ...user, id, createdAt: now, updatedAt: now };
  }

  async getUser(): Promise<User | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT * FROM ${TABLES.users} LIMIT 1`
    );
    
    if (!result) return null;
    
    return this.mapToUser(result);
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${this.toSnakeCase(key)} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), id];
    
    await this.db.runAsync(
      `UPDATE ${TABLES.users} SET ${fields}, updated_at = ? WHERE id = ?`,
      values
    );
  }

  // Focus operations
  async createFocus(focus: Omit<Focus, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Focus> {
    const id = generateId();
    const now = new Date().toISOString();
    const order = await this.getNextOrder(TABLES.focuses);
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.focuses} (id, name, emoji, color, is_active, order_index, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, focus.name, focus.emoji, focus.color, focus.isActive ? 1 : 0, order, now, now]
    );

    return { ...focus, id, order, createdAt: now, updatedAt: now };
  }

  async getFocuses(): Promise<Focus[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM ${TABLES.focuses} ORDER BY order_index`
    );
    
    return results.map(this.mapToFocus);
  }

  async getActiveFocus(): Promise<Focus | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT * FROM ${TABLES.focuses} WHERE is_active = 1 LIMIT 1`
    );
    
    if (!result) return null;
    
    return this.mapToFocus(result);
  }

  async setActiveFocus(id: string): Promise<void> {
    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      await this.db.runAsync(`UPDATE ${TABLES.focuses} SET is_active = 0`);
      await this.db.runAsync(
        `UPDATE ${TABLES.focuses} SET is_active = 1 WHERE id = ?`,
        [id]
      );
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  // Category operations
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Category> {
    const id = generateId();
    const now = new Date().toISOString();
    const order = await this.getNextOrder(TABLES.categories, 'focus_id', category.focusId);
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.categories} 
       (id, focus_id, name, emoji, color, time_type, order_index, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category.focusId, category.name, category.emoji, category.color, 
       category.timeType, order, now, now]
    );

    return { ...category, id, order, createdAt: now, updatedAt: now };
  }

  async getCategoriesByFocus(focusId: string): Promise<CategoryWithTasks[]> {
    const categories = await this.db.getAllAsync<any>(
      `SELECT * FROM ${TABLES.categories} WHERE focus_id = ? ORDER BY order_index`,
      [focusId]
    );
    
    const categoriesWithTasks = await Promise.all(
      categories.map(async (cat) => {
        const mapped = this.mapToCategory(cat);
        const tasks = await this.getTasksByCategory(mapped.id);
        return { ...mapped, tasks };
      })
    );
    
    return categoriesWithTasks;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      // Delete all related data first
      await this.db.runAsync(
        `DELETE FROM ${TABLES.time_entries} WHERE entry_id IN (SELECT id FROM ${TABLES.entries} WHERE category_id = ?)`,
        [id]
      );
      await this.db.runAsync(
        `DELETE FROM ${TABLES.task_completions} WHERE entry_id IN (SELECT id FROM ${TABLES.entries} WHERE category_id = ?)`,
        [id]
      );
      await this.db.runAsync(
        `DELETE FROM ${TABLES.entries} WHERE category_id = ?`,
        [id]
      );
      await this.db.runAsync(
        `DELETE FROM ${TABLES.tasks} WHERE category_id = ?`,
        [id]
      );
      await this.db.runAsync(
        `DELETE FROM ${TABLES.categories} WHERE id = ?`,
        [id]
      );
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  // Task operations
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> {
    const id = generateId();
    const now = new Date().toISOString();
    const order = await this.getNextOrder(TABLES.tasks, 'category_id', task.categoryId);
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.tasks} 
       (id, category_id, name, is_recurring, order_index, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, task.categoryId, task.name, task.isRecurring ? 1 : 0, order, now, now]
    );

    return { ...task, id, order, createdAt: now, updatedAt: now };
  }

  async getTasksByCategory(categoryId: string): Promise<Task[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM ${TABLES.tasks} WHERE category_id = ? ORDER BY order_index`,
      [categoryId]
    );
    
    return results.map(this.mapToTask);
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${this.toSnakeCase(key)} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), id];
    
    await this.db.runAsync(
      `UPDATE ${TABLES.tasks} SET ${fields}, updated_at = ? WHERE id = ?`,
      values
    );
  }

  async deleteTask(id: string): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM ${TABLES.tasks} WHERE id = ?`,
      [id]
    );
  }

  // Entry operations
  async createEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
    const id = generateId();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.entries} (id, date, focus_id, category_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, entry.date, entry.focusId, entry.categoryId, now, now]
    );

    return { ...entry, id, createdAt: now, updatedAt: now };
  }

  async getEntryByDateAndCategory(date: string, categoryId: string): Promise<Entry | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT * FROM ${TABLES.entries} WHERE date = ? AND category_id = ?`,
      [date, categoryId]
    );
    
    if (!result) return null;
    
    return this.mapToEntry(result);
  }

  async getEntriesByDate(date: string, focusId?: string): Promise<EntryWithTaskCompletions[]> {
    const focusClause = focusId ? 'AND e.focus_id = ?' : '';
    const params = focusId ? [date, focusId] : [date];
    
    const entries = await this.db.getAllAsync<any>(
      `SELECT e.*, c.name as category_name, c.emoji as category_emoji, 
              c.time_type as category_time_type
       FROM ${TABLES.entries} e
       JOIN ${TABLES.categories} c ON e.category_id = c.id
       WHERE e.date = ? ${focusClause}
       ORDER BY c.order_index`,
      params
    );
    
    const entriesWithDetails = await Promise.all(
      entries.map(async (entry) => {
        const mapped = this.mapToEntry(entry);
        const details: EntryWithTaskCompletions = {
          ...mapped,
          category: {
            id: entry.category_id,
            focusId: entry.focus_id,
            name: entry.category_name,
            emoji: entry.category_emoji,
            timeType: entry.category_time_type,
            color: '#667eea', // Default, should be loaded from category
            order: 0,
            createdAt: '',
            updatedAt: ''
          }
        };
        
        // Load task completions
        details.taskCompletions = await this.getTaskCompletionsByEntry(mapped.id);
        
        if (entry.category_time_type !== 'NONE') {
          details.timeEntry = await this.getTimeEntryByEntry(mapped.id);
        }
        
        return details;
      })
    );
    
    return entriesWithDetails;
  }

  // Task completion operations
  async createTaskCompletion(completion: Omit<TaskCompletion, 'id' | 'createdAt'>): Promise<TaskCompletion> {
    const id = generateId();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO ${TABLES.task_completions} 
       (id, entry_id, task_id, task_name, quantity, duration, is_other_task, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, completion.entryId, completion.taskId || null, completion.taskName, 
       completion.quantity, completion.duration || null, completion.isOtherTask ? 1 : 0, now]
    );

    return { ...completion, id, createdAt: now };
  }

  async getTaskCompletionsByEntry(entryId: string): Promise<TaskCompletion[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM ${TABLES.task_completions} WHERE entry_id = ?`,
      [entryId]
    );
    
    return results.map(this.mapToTaskCompletion);
  }

  async updateTaskCompletion(id: string, updates: Partial<Omit<TaskCompletion, 'id' | 'createdAt'>>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${this.toSnakeCase(key)} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await this.db.runAsync(
      `UPDATE ${TABLES.task_completions} SET ${fields} WHERE id = ?`,
      values
    );
  }

  async deleteTaskCompletion(id: string): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM ${TABLES.task_completions} WHERE id = ?`,
      [id]
    );
  }

  // Time entry operations
  async createOrUpdateTimeEntry(time: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    const existing = await this.db.getFirstAsync<any>(
      `SELECT * FROM ${TABLES.time_entries} WHERE entry_id = ?`,
      [time.entryId]
    );
    
    const now = new Date().toISOString();
    
    if (existing) {
      await this.db.runAsync(
        `UPDATE ${TABLES.time_entries} 
         SET type = ?, start_time = ?, end_time = ?, duration = ?, updated_at = ? 
         WHERE id = ?`,
        [time.type, time.startTime || null, time.endTime || null, 
         time.duration || null, now, existing.id]
      );
      return this.mapToTimeEntry({ ...existing, ...time, updated_at: now });
    } else {
      const id = generateId();
      
      await this.db.runAsync(
        `INSERT INTO ${TABLES.time_entries} 
         (id, entry_id, type, start_time, end_time, duration, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, time.entryId, time.type, time.startTime || null, 
         time.endTime || null, time.duration || null, now, now]
      );
      
      return { ...time, id, createdAt: now, updatedAt: now };
    }
  }

  async getTimeEntryByEntry(entryId: string): Promise<TimeEntry | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT * FROM ${TABLES.time_entries} WHERE entry_id = ?`,
      [entryId]
    );
    
    if (!result) return null;
    
    return this.mapToTimeEntry(result);
  }

  // Settings operations
  async setSetting(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${TABLES.settings} (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }

  async getSetting(key: string): Promise<string | null> {
    const result = await this.db.getFirstAsync<{ value: string }>(
      `SELECT value FROM ${TABLES.settings} WHERE key = ?`,
      [key]
    );
    
    return result?.value || null;
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      // Clear all tables in correct order to respect foreign key constraints
      await this.db.runAsync(`DELETE FROM ${TABLES.time_entries}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.task_completions}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.entries}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.tasks}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.categories}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.focuses}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.users}`);
      await this.db.runAsync(`DELETE FROM ${TABLES.settings}`);
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  // Trends aggregation methods
  async getEntriesByDateRange(startDate: string, endDate: string, focusId?: string): Promise<EntryWithTaskCompletions[]> {
    const focusClause = focusId ? 'AND e.focus_id = ?' : '';
    const params = focusId ? [startDate, endDate, focusId] : [startDate, endDate];
    
    const entries = await this.db.getAllAsync<any>(
      `SELECT e.*, c.name as category_name, c.emoji as category_emoji, 
              c.color as category_color, c.time_type as category_time_type
       FROM ${TABLES.entries} e
       JOIN ${TABLES.categories} c ON e.category_id = c.id
       WHERE e.date >= ? AND e.date <= ? ${focusClause}
       ORDER BY e.date ASC, c.order_index`,
      params
    );
    
    const entriesWithDetails = await Promise.all(
      entries.map(async (entry) => {
        const mapped = this.mapToEntry(entry);
        const details: EntryWithTaskCompletions = {
          ...mapped,
          category: {
            id: entry.category_id,
            focusId: entry.focus_id,
            name: entry.category_name,
            emoji: entry.category_emoji,
            timeType: entry.category_time_type,
            color: entry.category_color,
            order: 0,
            createdAt: '',
            updatedAt: ''
          }
        };
        
        details.taskCompletions = await this.getTaskCompletionsByEntry(mapped.id);
        
        if (entry.category_time_type !== 'NONE') {
          details.timeEntry = await this.getTimeEntryByEntry(mapped.id);
        }
        
        return details;
      })
    );
    
    return entriesWithDetails;
  }

  async getAggregatedCategoryData(focusId: string, startDate: string, endDate: string): Promise<{
    categoryId: string;
    categoryName: string;
    categoryEmoji: string;
    categoryColor: string;
    totalEntries: number;
    totalTasks: number;
    totalMinutes: number;
    avgTasksPerDay: number;
    avgMinutesPerDay: number;
    daysActive: number;
  }[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT 
         c.id as category_id,
         c.name as category_name,
         c.emoji as category_emoji,
         c.color as category_color,
         COUNT(DISTINCT e.id) as total_entries,
         COUNT(DISTINCT e.date) as days_active,
         COALESCE(SUM(tc.quantity), 0) as total_tasks,
         COALESCE(SUM(
           CASE 
             WHEN te.type = 'DURATION' THEN te.duration
             WHEN te.type = 'CLOCK' AND te.start_time IS NOT NULL AND te.end_time IS NOT NULL 
               THEN (julianday(te.end_time) - julianday(te.start_time)) * 24 * 60
             ELSE 0
           END
         ), 0) as total_minutes
       FROM ${TABLES.categories} c
       LEFT JOIN ${TABLES.entries} e ON c.id = e.category_id 
         AND e.date >= ? AND e.date <= ? AND e.focus_id = ?
       LEFT JOIN ${TABLES.task_completions} tc ON e.id = tc.entry_id
       LEFT JOIN ${TABLES.time_entries} te ON e.id = te.entry_id
       WHERE c.focus_id = ?
       GROUP BY c.id, c.name, c.emoji, c.color
       ORDER BY total_tasks DESC, total_minutes DESC`,
      [startDate, endDate, focusId, focusId]
    );

    const totalDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return results.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryEmoji: row.category_emoji,
      categoryColor: row.category_color,
      totalEntries: row.total_entries || 0,
      totalTasks: row.total_tasks || 0,
      totalMinutes: Math.round(row.total_minutes || 0),
      avgTasksPerDay: Math.round((row.total_tasks || 0) / totalDays * 100) / 100,
      avgMinutesPerDay: Math.round((row.total_minutes || 0) / totalDays * 100) / 100,
      daysActive: row.days_active || 0
    }));
  }

  async getTaskCompletionStats(focusId: string, startDate: string, endDate: string): Promise<{
    date: string;
    categoryId: string;
    categoryName: string;
    taskCompletions: number;
    totalMinutes: number;
  }[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT 
         e.date,
         c.id as category_id,
         c.name as category_name,
         COALESCE(SUM(tc.quantity), 0) as task_completions,
         COALESCE(SUM(
           CASE 
             WHEN te.type = 'DURATION' THEN te.duration
             WHEN te.type = 'CLOCK' AND te.start_time IS NOT NULL AND te.end_time IS NOT NULL 
               THEN (julianday(te.end_time) - julianday(te.start_time)) * 24 * 60
             ELSE 0
           END
         ), 0) as total_minutes
       FROM ${TABLES.entries} e
       JOIN ${TABLES.categories} c ON e.category_id = c.id
       LEFT JOIN ${TABLES.task_completions} tc ON e.id = tc.entry_id
       LEFT JOIN ${TABLES.time_entries} te ON e.id = te.entry_id
       WHERE e.focus_id = ? AND e.date >= ? AND e.date <= ?
       GROUP BY e.date, c.id, c.name
       ORDER BY e.date ASC`,
      [focusId, startDate, endDate]
    );

    return results.map(row => ({
      date: row.date,
      categoryId: row.category_id,
      categoryName: row.category_name,
      taskCompletions: row.task_completions || 0,
      totalMinutes: Math.round(row.total_minutes || 0)
    }));
  }

  async getTimeTrackingStats(focusId: string, startDate: string, endDate: string): Promise<{
    date: string;
    totalMinutes: number;
    categoriesActive: number;
    categories: {
      id: string;
      name: string;
      minutes: number;
      tasks: number;
    }[];
  }[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT 
         e.date,
         c.id as category_id,
         c.name as category_name,
         COALESCE(SUM(tc.quantity), 0) as task_count,
         COALESCE(SUM(
           CASE 
             WHEN te.type = 'DURATION' THEN te.duration
             WHEN te.type = 'CLOCK' AND te.start_time IS NOT NULL AND te.end_time IS NOT NULL 
               THEN (julianday(te.end_time) - julianday(te.start_time)) * 24 * 60
             ELSE 0
           END
         ), 0) as minutes
       FROM ${TABLES.entries} e
       JOIN ${TABLES.categories} c ON e.category_id = c.id
       LEFT JOIN ${TABLES.task_completions} tc ON e.id = tc.entry_id
       LEFT JOIN ${TABLES.time_entries} te ON e.id = te.entry_id
       WHERE e.focus_id = ? AND e.date >= ? AND e.date <= ?
       GROUP BY e.date, c.id, c.name
       ORDER BY e.date ASC`,
      [focusId, startDate, endDate]
    );

    // Group by date
    const dateGroups: Record<string, any[]> = {};
    results.forEach(row => {
      if (!dateGroups[row.date]) {
        dateGroups[row.date] = [];
      }
      dateGroups[row.date].push(row);
    });

    return Object.entries(dateGroups).map(([date, categories]) => ({
      date,
      totalMinutes: Math.round(categories.reduce((sum, cat) => sum + (cat.minutes || 0), 0)),
      categoriesActive: categories.length,
      categories: categories.map(cat => ({
        id: cat.category_id,
        name: cat.category_name,
        minutes: Math.round(cat.minutes || 0),
        tasks: cat.task_count || 0
      }))
    }));
  }

  async getStreakData(focusId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    streakDates: string[];
    lastActiveDate: string | null;
  }> {
    const results = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT e.date 
       FROM ${TABLES.entries} e
       WHERE e.focus_id = ?
       ORDER BY e.date ASC`,
      [focusId]
    );

    if (results.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        streakDates: [],
        lastActiveDate: null
      };
    }

    const activeDates = results.map(r => r.date);
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate current streak (must include today or yesterday to be active)
    let currentStreak = 0;
    let checkDate = new Date();
    
    // Check if today or yesterday has activity
    const todayStr = checkDate.toISOString().split('T')[0];
    const yesterdayStr = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (activeDates.includes(todayStr)) {
      checkDate = new Date(); // Start from today
    } else if (activeDates.includes(yesterdayStr)) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000); // Start from yesterday
    } else {
      currentStreak = 0; // No recent activity
    }
    
    // Count backwards from the starting date
    if (currentStreak === 0 && (activeDates.includes(todayStr) || activeDates.includes(yesterdayStr))) {
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.includes(dateStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate: Date | null = null;

    activeDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      
      if (previousDate) {
        const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      previousDate = currentDate;
    });
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: activeDates.length,
      streakDates: activeDates,
      lastActiveDate: activeDates[activeDates.length - 1] || null
    };
  }

  async getTopTasks(focusId: string, startDate: string, endDate: string, limit: number = 10): Promise<{
    taskId: string | null;
    taskName: string;
    categoryName: string;
    categoryEmoji: string;
    totalCompletions: number;
    avgCompletionsPerDay: number;
    isOtherTask: boolean;
  }[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT 
         tc.task_id,
         tc.task_name,
         c.name as category_name,
         c.emoji as category_emoji,
         tc.is_other_task,
         SUM(tc.quantity) as total_completions,
         COUNT(DISTINCT e.date) as days_active
       FROM ${TABLES.task_completions} tc
       JOIN ${TABLES.entries} e ON tc.entry_id = e.id
       JOIN ${TABLES.categories} c ON e.category_id = c.id
       WHERE e.focus_id = ? AND e.date >= ? AND e.date <= ?
       GROUP BY tc.task_id, tc.task_name, c.name, c.emoji, tc.is_other_task
       ORDER BY total_completions DESC
       LIMIT ?`,
      [focusId, startDate, endDate, limit]
    );

    const totalDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 1000)
    ) + 1;

    return results.map(row => ({
      taskId: row.task_id,
      taskName: row.task_name,
      categoryName: row.category_name,
      categoryEmoji: row.category_emoji,
      totalCompletions: row.total_completions || 0,
      avgCompletionsPerDay: Math.round((row.total_completions || 0) / totalDays * 100) / 100,
      isOtherTask: row.is_other_task === 1
    }));
  }

  // Helper methods
  private async getNextOrder(table: string, whereColumn?: string, whereValue?: string): Promise<number> {
    const whereClause = whereColumn && whereValue ? `WHERE ${whereColumn} = ?` : '';
    const params = whereColumn && whereValue ? [whereValue] : [];
    
    const result = await this.db.getFirstAsync<{ max_order: number }>(
      `SELECT MAX(order_index) as max_order FROM ${table} ${whereClause}`,
      params
    );
    
    return (result?.max_order || 0) + 1;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Mapping functions
  private mapToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      birthday: row.birthday,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToFocus(row: any): Focus {
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      isActive: row.is_active === 1,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToCategory(row: any): Category {
    return {
      id: row.id,
      focusId: row.focus_id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      timeType: row.time_type,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToTask(row: any): Task {
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      isRecurring: row.is_recurring === 1,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToEntry(row: any): Entry {
    return {
      id: row.id,
      date: row.date,
      focusId: row.focus_id,
      categoryId: row.category_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToTaskCompletion(row: any): TaskCompletion {
    return {
      id: row.id,
      entryId: row.entry_id,
      taskId: row.task_id,
      taskName: row.task_name,
      quantity: row.quantity,
      duration: row.duration,
      isOtherTask: row.is_other_task === 1,
      createdAt: row.created_at
    };
  }

  private mapToTimeEntry(row: any): TimeEntry {
    return {
      id: row.id,
      entryId: row.entry_id,
      type: row.type,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new DatabaseService();