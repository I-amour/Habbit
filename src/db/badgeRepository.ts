import { getDatabase } from './database';
import { Badge } from '../models/types';
import { BADGE_DEFINITIONS } from '../constants/badges';

export async function getUnlockedBadgeIds(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM badges WHERE unlocked_at IS NOT NULL');
  return new Set(rows.map(r => r.id));
}

export async function unlockBadge(badgeId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO badges (id, unlocked_at) VALUES (?, ?)',
    [badgeId, new Date().toISOString()]
  );
}

export async function getAllBadgesWithStatus(): Promise<Badge[]> {
  const unlockedIds = await getUnlockedBadgeIds();
  const db = await getDatabase();

  return BADGE_DEFINITIONS.map(def => {
    const isUnlocked = unlockedIds.has(def.id);
    return {
      ...def,
      unlockedAt: isUnlocked ? undefined : null,
    };
  });
}

export async function getBadgeUnlockDate(badgeId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ unlocked_at: string | null }>(
    'SELECT unlocked_at FROM badges WHERE id = ?',
    [badgeId]
  );
  return row?.unlocked_at ?? null;
}

export async function getUserProfile() {
  const db = await getDatabase();
  return db.getFirstAsync<{
    total_xp: number;
    level: number;
    weekly_completions: number;
    total_completions: number;
    longest_streak_ever: number;
  }>('SELECT * FROM user_profile WHERE id = 1');
}

export async function updateUserProfile(updates: {
  totalXP?: number;
  level?: number;
  weeklyCompletions?: number;
  totalCompletions?: number;
  longestStreakEver?: number;
}): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.totalXP !== undefined) { fields.push('total_xp = ?'); values.push(updates.totalXP); }
  if (updates.level !== undefined) { fields.push('level = ?'); values.push(updates.level); }
  if (updates.weeklyCompletions !== undefined) { fields.push('weekly_completions = ?'); values.push(updates.weeklyCompletions); }
  if (updates.totalCompletions !== undefined) { fields.push('total_completions = ?'); values.push(updates.totalCompletions); }
  if (updates.longestStreakEver !== undefined) { fields.push('longest_streak_ever = ?'); values.push(updates.longestStreakEver); }

  if (fields.length === 0) return;
  await db.runAsync(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`, values);
}

export async function getStreakRecord(habitId: string) {
  const db = await getDatabase();
  return db.getFirstAsync<{
    habit_id: string;
    current_streak: number;
    longest_streak: number;
    last_completed_date: string | null;
    streak_freeze_used_this_week: number;
    streak_freeze_date: string | null;
  }>('SELECT * FROM streak_records WHERE habit_id = ?', [habitId]);
}

export async function updateStreakRecord(habitId: string, updates: {
  currentStreak?: number;
  longestStreak?: number;
  lastCompletedDate?: string;
  streakFreezeUsedThisWeek?: boolean;
  streakFreezeDate?: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.currentStreak !== undefined) { fields.push('current_streak = ?'); values.push(updates.currentStreak); }
  if (updates.longestStreak !== undefined) { fields.push('longest_streak = ?'); values.push(updates.longestStreak); }
  if (updates.lastCompletedDate !== undefined) { fields.push('last_completed_date = ?'); values.push(updates.lastCompletedDate); }
  if (updates.streakFreezeUsedThisWeek !== undefined) { fields.push('streak_freeze_used_this_week = ?'); values.push(updates.streakFreezeUsedThisWeek ? 1 : 0); }
  if (updates.streakFreezeDate !== undefined) { fields.push('streak_freeze_date = ?'); values.push(updates.streakFreezeDate ?? null); }

  if (fields.length === 0) return;
  values.push(habitId);
  await db.runAsync(`UPDATE streak_records SET ${fields.join(', ')} WHERE habit_id = ?`, values);
}
