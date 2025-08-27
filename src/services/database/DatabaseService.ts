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
      // Create tables
      for (const [_, sql] of Object.entries(SCHEMA)) {
        await this.db.execAsync(sql);
      }

      // Create indexes
      for (const indexSql of INDEXES) {
        await this.db.execAsync(indexSql);
      }

      // Run migrations
      await this.runMigrations();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    
    if (currentVersion < DATABASE_VERSION) {
      // Add migration logic here when needed
      await this.setCurrentVersion(DATABASE_VERSION);
    }
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ version: number }>(
        `SELECT MAX(version) as version FROM ${TABLES.migrations}`
      );
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  private async setCurrentVersion(version: number): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO ${TABLES.migrations} (version, applied_at) VALUES (?, ?)`,
      [version, new Date().toISOString()]
    );
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
       (id, entry_id, task_id, task_name, quantity, is_other_task, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, completion.entryId, completion.taskId || null, completion.taskName, 
       completion.quantity, completion.isOtherTask ? 1 : 0, now]
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