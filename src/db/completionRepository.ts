import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import { Completion } from '../models/types';

function rowToCompletion(row: Record<string, unknown>): Completion {
  return {
    id: row.id as string,
    habitId: row.habit_id as string,
    date: row.date as string,
    value: row.value as number,
    note: (row.note as string | null) ?? null,
    completedAt: row.completed_at as string,
  };
}

export async function getCompletionsForDate(date: string): Promise<Completion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM completions WHERE date = ?', [date]);
  return rows.map(r => rowToCompletion(r as Record<string, unknown>));
}

export async function getCompletionsForHabit(habitId: string, startDate?: string, endDate?: string): Promise<Completion[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM completions WHERE habit_id = ?';
  const params: (string | number | null)[] = [habitId];

  if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate); }

  query += ' ORDER BY date DESC';
  const rows = await db.getAllAsync(query, params);
  return rows.map(r => rowToCompletion(r as Record<string, unknown>));
}

export async function getCompletionForHabitOnDate(habitId: string, date: string): Promise<Completion | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT * FROM completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
  return row ? rowToCompletion(row as Record<string, unknown>) : null;
}

export async function recordCompletion(habitId: string, date: string, value: number, note?: string | null): Promise<Completion> {
  const db = await getDatabase();

  // Check if already exists for this habit+date
  const existing = await getCompletionForHabitOnDate(habitId, date);
  if (existing) {
    // Update existing
    await db.runAsync(
      'UPDATE completions SET value = ?, note = ?, completed_at = ? WHERE id = ?',
      [value, note ?? existing.note ?? null, new Date().toISOString(), existing.id]
    );
    return { ...existing, value, note: note ?? existing.note ?? null, completedAt: new Date().toISOString() };
  }

  const id = Crypto.randomUUID();
  const completedAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO completions (id, habit_id, date, value, note, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, habitId, date, value, note ?? null, completedAt]
  );
  return { id, habitId, date, value, note: note ?? null, completedAt };
}

export async function updateCompletionNote(habitId: string, date: string, note: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE completions SET note = ? WHERE habit_id = ? AND date = ?',
    [note, habitId, date]
  );
}

export async function removeCompletion(habitId: string, date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM completions WHERE habit_id = ? AND date = ?', [habitId, date]);
}

export async function getCompletionCountByDate(startDate: string, endDate: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    'SELECT date, COUNT(*) as count FROM completions WHERE date >= ? AND date <= ? GROUP BY date',
    [startDate, endDate]
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.date] = row.count;
  }
  return result;
}

export async function getTotalCompletions(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM completions');
  return result?.count ?? 0;
}

export async function getCompletionDatesForHabit(habitId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM completions WHERE habit_id = ? ORDER BY date DESC',
    [habitId]
  );
  return rows.map(r => r.date);
}

// Skipped dates (rest days)
export async function skipDate(habitId: string, date: string, reason?: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO skipped_dates (habit_id, date, reason) VALUES (?, ?, ?)',
    [habitId, date, reason ?? null]
  );
}

export async function unskipDate(habitId: string, date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM skipped_dates WHERE habit_id = ? AND date = ?', [habitId, date]);
}

export async function getSkippedDates(habitId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM skipped_dates WHERE habit_id = ? ORDER BY date DESC',
    [habitId]
  );
  return rows.map(r => r.date);
}

export async function isDateSkipped(habitId: string, date: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT 1 FROM skipped_dates WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
  return !!row;
}
