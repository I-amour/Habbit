import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import { Habit, Frequency, HabitType } from '../models/types';

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    type: row.type as HabitType,
    frequency: row.frequency as Frequency,
    specificDays: row.specific_days ? JSON.parse(row.specific_days as string) : undefined,
    timesPerWeek: row.times_per_week as number | undefined,
    dailyTarget: row.daily_target as number,
    unit: row.unit as string | undefined,
    reminderTime: (row.reminder_time as string | null) ?? null,
    reminderIntervalMinutes: (row.reminder_interval_minutes as number | null) ?? null,
    reminderStartHour: (row.reminder_start_hour as number | null) ?? null,
    reminderEndHour: (row.reminder_end_hour as number | null) ?? null,
    category: (row.category as string | null) ?? null,
    createdAt: row.created_at as string,
    archivedAt: row.archived_at as string | null | undefined,
    sortOrder: row.sort_order as number,
  };
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC'
  );
  return rows.map(r => rowToHabit(r as Record<string, unknown>));
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM habits WHERE id = ?', [id]);
  return row ? rowToHabit(row as Record<string, unknown>) : null;
}

export async function createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'archivedAt'>): Promise<Habit> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM habits WHERE archived_at IS NULL'
  );
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO habits (id, name, icon, color, type, frequency, specific_days, times_per_week, daily_target, unit, reminder_time, reminder_interval_minutes, reminder_start_hour, reminder_end_hour, category, created_at, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, habit.name, habit.icon, habit.color, habit.type, habit.frequency,
      habit.specificDays ? JSON.stringify(habit.specificDays) : null,
      habit.timesPerWeek ?? null,
      habit.dailyTarget, habit.unit ?? null, habit.reminderTime ?? null,
      habit.reminderIntervalMinutes ?? null, habit.reminderStartHour ?? null, habit.reminderEndHour ?? null,
      habit.category ?? null,
      createdAt, sortOrder,
    ]
  );

  // Initialize streak record
  await db.runAsync(
    'INSERT INTO streak_records (habit_id, current_streak, longest_streak) VALUES (?, 0, 0)',
    [id]
  );

  return {
    id, ...habit, createdAt, sortOrder, archivedAt: null,
  };
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
  if (updates.specificDays !== undefined) { fields.push('specific_days = ?'); values.push(JSON.stringify(updates.specificDays)); }
  if (updates.timesPerWeek !== undefined) { fields.push('times_per_week = ?'); values.push(updates.timesPerWeek); }
  if (updates.dailyTarget !== undefined) { fields.push('daily_target = ?'); values.push(updates.dailyTarget); }
  if (updates.unit !== undefined) { fields.push('unit = ?'); values.push(updates.unit ?? null); }
  if (updates.reminderTime !== undefined) { fields.push('reminder_time = ?'); values.push(updates.reminderTime ?? null); }
  if (updates.reminderIntervalMinutes !== undefined) { fields.push('reminder_interval_minutes = ?'); values.push(updates.reminderIntervalMinutes ?? null); }
  if (updates.reminderStartHour !== undefined) { fields.push('reminder_start_hour = ?'); values.push(updates.reminderStartHour ?? null); }
  if (updates.reminderEndHour !== undefined) { fields.push('reminder_end_hour = ?'); values.push(updates.reminderEndHour ?? null); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category ?? null); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE habits SET archived_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function getHabitCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits WHERE archived_at IS NULL');
  return result?.count ?? 0;
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync('UPDATE habits SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
  }
}
