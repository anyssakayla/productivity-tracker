import { SQLiteDatabase } from 'expo-sqlite';
import { TABLES } from './schema';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  // Initial migration is handled by schema creation
  // Add future migrations here
  // Example:
  // {
  //   version: 2,
  //   name: 'add_notes_to_entries',
  //   up: async (db) => {
  //     await db.execAsync(`ALTER TABLE ${TABLES.entries} ADD COLUMN notes TEXT`);
  //   },
  //   down: async (db) => {
  //     // SQLite doesn't support DROP COLUMN, would need to recreate table
  //   }
  // }
];

export class MigrationRunner {
  constructor(private db: SQLiteDatabase) {}

  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ version: number }>(
        `SELECT MAX(version) as version FROM ${TABLES.migrations}`
      );
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  async run(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      
      await this.db.execAsync('BEGIN TRANSACTION');
      try {
        await migration.up(this.db);
        await this.db.runAsync(
          `INSERT INTO ${TABLES.migrations} (version, applied_at) VALUES (?, ?)`,
          [migration.version, new Date().toISOString()]
        );
        await this.db.execAsync('COMMIT');
        console.log(`Migration ${migration.version} completed`);
      } catch (error) {
        await this.db.execAsync('ROLLBACK');
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  async rollback(targetVersion: number = 0): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const rollbackMigrations = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();

    for (const migration of rollbackMigrations) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
      
      await this.db.execAsync('BEGIN TRANSACTION');
      try {
        await migration.down(this.db);
        await this.db.runAsync(
          `DELETE FROM ${TABLES.migrations} WHERE version = ?`,
          [migration.version]
        );
        await this.db.execAsync('COMMIT');
        console.log(`Rollback of migration ${migration.version} completed`);
      } catch (error) {
        await this.db.execAsync('ROLLBACK');
        console.error(`Rollback of migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
}