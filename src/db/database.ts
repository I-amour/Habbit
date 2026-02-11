import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('habbit.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#FF6B47',
      type TEXT NOT NULL DEFAULT 'boolean',
      frequency TEXT NOT NULL DEFAULT 'daily',
      specific_days TEXT,
      times_per_week INTEGER,
      daily_target INTEGER NOT NULL DEFAULT 1,
      unit TEXT,
      created_at TEXT NOT NULL,
      archived_at TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON completions(habit_id, date);
    CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date);

    CREATE TABLE IF NOT EXISTS streak_records (
      habit_id TEXT PRIMARY KEY,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_date TEXT,
      streak_freeze_used_this_week INTEGER NOT NULL DEFAULT 0,
      streak_freeze_date TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      weekly_completions INTEGER NOT NULL DEFAULT 0,
      total_completions INTEGER NOT NULL DEFAULT 0,
      longest_streak_ever INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO user_profile (id, total_xp, level, weekly_completions, total_completions, longest_streak_ever)
    VALUES (1, 0, 1, 0, 0, 0);
  `);

  // Migration: add reminder_time column if not exists
  try {
    await database.execAsync('ALTER TABLE habits ADD COLUMN reminder_time TEXT;');
  } catch {
    // Column already exists
  }

  // Migration: add interval reminder columns
  try {
    await database.execAsync('ALTER TABLE habits ADD COLUMN reminder_interval_minutes INTEGER;');
  } catch { /* already exists */ }
  try {
    await database.execAsync('ALTER TABLE habits ADD COLUMN reminder_start_hour INTEGER;');
  } catch { /* already exists */ }
  try {
    await database.execAsync('ALTER TABLE habits ADD COLUMN reminder_end_hour INTEGER;');
  } catch { /* already exists */ }

  // Migration: add category column to habits
  try {
    await database.execAsync('ALTER TABLE habits ADD COLUMN category TEXT;');
  } catch { /* already exists */ }

  // Migration: add note column to completions
  try {
    await database.execAsync('ALTER TABLE completions ADD COLUMN note TEXT;');
  } catch { /* already exists */ }

  // Migration: skipped_dates table for rest days
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS skipped_dates (
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      PRIMARY KEY (habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
