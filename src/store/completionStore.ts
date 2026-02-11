import { create } from 'zustand';
import { Completion, Habit } from '../models/types';
import * as completionRepo from '../db/completionRepository';
import * as badgeRepo from '../db/badgeRepository';
import { getTodayString } from '../utils/dates';
import { calculateStreak } from '../utils/streaks';
import { calculateCompletionXP } from '../utils/xp';
import { useGamificationStore } from './gamificationStore';

interface CompletionState {
  todayCompletions: Map<string, Completion>;
  isLoading: boolean;
  loadTodayCompletions: () => Promise<void>;
  toggleCompletion: (habit: Habit) => Promise<void>;
  updateQuantity: (habit: Habit, value: number) => Promise<void>;
  addNote: (habitId: string, note: string) => Promise<void>;
  getCompletionForHabit: (habitId: string) => Completion | undefined;
  isHabitCompletedToday: (habitId: string) => boolean;
  getCompletedCount: () => number;
}

export const useCompletionStore = create<CompletionState>((set, get) => ({
  todayCompletions: new Map(),
  isLoading: true,

  loadTodayCompletions: async () => {
    set({ isLoading: true });
    const today = getTodayString();
    const completions = await completionRepo.getCompletionsForDate(today);
    const map = new Map<string, Completion>();
    for (const c of completions) {
      map.set(c.habitId, c);
    }
    set({ todayCompletions: map, isLoading: false });
  },

  toggleCompletion: async (habit: Habit) => {
    const today = getTodayString();
    const existing = get().todayCompletions.get(habit.id);

    try {
      if (existing) {
        await completionRepo.removeCompletion(habit.id, today);
        set(state => {
          const newMap = new Map(state.todayCompletions);
          newMap.delete(habit.id);
          return { todayCompletions: newMap };
        });
      } else {
        const completion = await completionRepo.recordCompletion(habit.id, today, 1);
        set(state => {
          const newMap = new Map(state.todayCompletions);
          newMap.set(habit.id, completion);
          return { todayCompletions: newMap };
        });

        // Update streaks and XP in background (don't block UI)
        updateStreakAndXP(habit).catch(console.warn);
      }
    } catch (error) {
      console.warn('Failed to toggle completion:', error);
    }
  },

  updateQuantity: async (habit: Habit, value: number) => {
    const today = getTodayString();

    try {
      if (value <= 0) {
        await completionRepo.removeCompletion(habit.id, today);
        set(state => {
          const newMap = new Map(state.todayCompletions);
          newMap.delete(habit.id);
          return { todayCompletions: newMap };
        });
        return;
      }

      const completion = await completionRepo.recordCompletion(habit.id, today, value);
      set(state => {
        const newMap = new Map(state.todayCompletions);
        newMap.set(habit.id, completion);
        return { todayCompletions: newMap };
      });

      if (value >= habit.dailyTarget) {
        updateStreakAndXP(habit).catch(console.warn);
      }
    } catch (error) {
      console.warn('Failed to update quantity:', error);
    }
  },

  addNote: async (habitId: string, note: string) => {
    const today = getTodayString();
    await completionRepo.updateCompletionNote(habitId, today, note);
    set(state => {
      const newMap = new Map(state.todayCompletions);
      const existing = newMap.get(habitId);
      if (existing) {
        newMap.set(habitId, { ...existing, note });
      }
      return { todayCompletions: newMap };
    });
  },

  getCompletionForHabit: (habitId: string) => {
    return get().todayCompletions.get(habitId);
  },

  isHabitCompletedToday: (habitId: string) => {
    return get().todayCompletions.has(habitId);
  },

  getCompletedCount: () => {
    return get().todayCompletions.size;
  },
}));

async function updateStreakAndXP(habit: Habit) {
  try {
    const today = getTodayString();
    const completionDates = await completionRepo.getCompletionDatesForHabit(habit.id);
    const skippedDates = await completionRepo.getSkippedDates(habit.id);
    const { current, longest } = calculateStreak(habit, completionDates, today, skippedDates);

    await badgeRepo.updateStreakRecord(habit.id, {
      currentStreak: current,
      longestStreak: longest,
      lastCompletedDate: today,
    });

    const xp = calculateCompletionXP(current);
    await useGamificationStore.getState().awardXP(xp);

    const profile = await badgeRepo.getUserProfile();
    if (profile && longest > profile.longest_streak_ever) {
      await badgeRepo.updateUserProfile({ longestStreakEver: longest });
      useGamificationStore.getState().setLongestStreak(longest);
    }

    await useGamificationStore.getState().checkAndUnlockBadges();
  } catch (error) {
    console.warn('Failed to update streak/XP:', error);
  }
}
