export const DATABASE_NAME = 'productivity_tracker.db';
export const DATABASE_VERSION = 3;

export const TABLES = {
  users: 'users',
  focuses: 'focuses',
  categories: 'categories',
  tasks: 'tasks',
  entries: 'entries',
  task_completions: 'task_completions',
  time_entries: 'time_entries',
  settings: 'settings',
  migrations: 'migrations'
} as const;

export const SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS ${TABLES.users} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      birthday TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  
  focuses: `
    CREATE TABLE IF NOT EXISTS ${TABLES.focuses} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  
  categories: `
    CREATE TABLE IF NOT EXISTS ${TABLES.categories} (
      id TEXT PRIMARY KEY,
      focus_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      time_type TEXT NOT NULL CHECK (time_type IN ('CLOCK', 'DURATION', 'NONE')),
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (focus_id) REFERENCES ${TABLES.focuses}(id) ON DELETE CASCADE
    );
  `,
  
  tasks: `
    CREATE TABLE IF NOT EXISTS ${TABLES.tasks} (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES ${TABLES.categories}(id) ON DELETE CASCADE
    );
  `,
  
  entries: `
    CREATE TABLE IF NOT EXISTS ${TABLES.entries} (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      focus_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (focus_id) REFERENCES ${TABLES.focuses}(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES ${TABLES.categories}(id) ON DELETE CASCADE,
      UNIQUE(date, category_id)
    );
  `,
  
  task_completions: `
    CREATE TABLE IF NOT EXISTS ${TABLES.task_completions} (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      task_id TEXT,
      task_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      duration INTEGER, -- Duration in minutes for DURATION type tasks
      is_other_task INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES ${TABLES.entries}(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES ${TABLES.tasks}(id) ON DELETE CASCADE
    );
  `,
  
  
  time_entries: `
    CREATE TABLE IF NOT EXISTS ${TABLES.time_entries} (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('CLOCK', 'DURATION')),
      start_time TEXT,
      end_time TEXT,
      duration INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES ${TABLES.entries}(id) ON DELETE CASCADE,
      UNIQUE(entry_id)
    );
  `,
  
  settings: `
    CREATE TABLE IF NOT EXISTS ${TABLES.settings} (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  
  migrations: `
    CREATE TABLE IF NOT EXISTS ${TABLES.migrations} (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `
};

// Indexes for better query performance
export const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_focuses_is_active ON ${TABLES.focuses}(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_categories_focus_id ON ${TABLES.categories}(focus_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON ${TABLES.tasks}(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_date ON ${TABLES.entries}(date);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_focus_id ON ${TABLES.entries}(focus_id);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_category_id ON ${TABLES.entries}(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_completions_entry_id ON ${TABLES.task_completions}(entry_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON ${TABLES.task_completions}(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_time_entries_entry_id ON ${TABLES.time_entries}(entry_id);`
];