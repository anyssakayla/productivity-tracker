export const DATABASE_NAME = 'productivity_tracker.db';
export const DATABASE_VERSION = 1;

export const TABLES = {
  users: 'users',
  focuses: 'focuses',
  categories: 'categories',
  subcategories: 'subcategories',
  entries: 'entries',
  task_entries: 'task_entries',
  count_entries: 'count_entries',
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
      type TEXT NOT NULL CHECK (type IN ('TYPE_IN', 'SELECT_COUNT')),
      time_type TEXT NOT NULL CHECK (time_type IN ('CLOCK', 'DURATION', 'NONE')),
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (focus_id) REFERENCES ${TABLES.focuses}(id) ON DELETE CASCADE
    );
  `,
  
  subcategories: `
    CREATE TABLE IF NOT EXISTS ${TABLES.subcategories} (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
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
  
  task_entries: `
    CREATE TABLE IF NOT EXISTS ${TABLES.task_entries} (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES ${TABLES.entries}(id) ON DELETE CASCADE
    );
  `,
  
  count_entries: `
    CREATE TABLE IF NOT EXISTS ${TABLES.count_entries} (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      subcategory_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES ${TABLES.entries}(id) ON DELETE CASCADE,
      FOREIGN KEY (subcategory_id) REFERENCES ${TABLES.subcategories}(id) ON DELETE CASCADE,
      UNIQUE(entry_id, subcategory_id)
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
  `CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON ${TABLES.subcategories}(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_date ON ${TABLES.entries}(date);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_focus_id ON ${TABLES.entries}(focus_id);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_category_id ON ${TABLES.entries}(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_entries_entry_id ON ${TABLES.task_entries}(entry_id);`,
  `CREATE INDEX IF NOT EXISTS idx_count_entries_entry_id ON ${TABLES.count_entries}(entry_id);`,
  `CREATE INDEX IF NOT EXISTS idx_time_entries_entry_id ON ${TABLES.time_entries}(entry_id);`
];