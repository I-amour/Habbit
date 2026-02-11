export enum Frequency {
  DAILY = 'daily',
  SPECIFIC_DAYS = 'specific_days',
  X_TIMES_PER_WEEK = 'x_times_per_week',
}

export enum HabitType {
  BOOLEAN = 'boolean',
  QUANTITY = 'quantity',
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  frequency: Frequency;
  specificDays?: number[];
  timesPerWeek?: number;
  dailyTarget: number;
  unit?: string;
  reminderTime?: string | null; // HH:mm format, e.g. "09:00"
  reminderIntervalMinutes?: number | null; // e.g. 30 for every 30 min
  reminderStartHour?: number | null; // e.g. 8 for 8 AM
  reminderEndHour?: number | null; // e.g. 22 for 10 PM
  createdAt: string;
  category?: string | null;
  archivedAt?: string | null;
  sortOrder: number;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string;
  value: number;
  note?: string | null;
  completedAt: string;
}

export interface StreakRecord {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  streakFreezeUsedThisWeek: boolean;
  streakFreezeDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  threshold: number;
  unlockedAt?: string | null;
}

export enum BadgeCategory {
  STREAK = 'streak',
  COMPLETIONS = 'completions',
  HABITS = 'habits',
  CONSISTENCY = 'consistency',
}

export interface UserProfile {
  totalXP: number;
  level: number;
  weeklyCompletions: number;
  totalCompletions: number;
  longestStreakEver: number;
}
