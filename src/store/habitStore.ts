import { create } from 'zustand';
import { Habit, Frequency, HabitType } from '../models/types';
import * as habitRepo from '../db/habitRepository';
import { getDayOfWeek, getTodayString, getWeekDays } from '../utils/dates';

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  loadHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'archivedAt'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  getTodaysHabits: () => Habit[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: true,

  loadHabits: async () => {
    set({ isLoading: true });
    const habits = await habitRepo.getAllHabits();
    set({ habits, isLoading: false });
  },

  createHabit: async (habitData) => {
    const habit = await habitRepo.createHabit(habitData);
    set(state => ({ habits: [...state.habits, habit] }));
    return habit;
  },

  updateHabit: async (id, updates) => {
    await habitRepo.updateHabit(id, updates);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  },

  archiveHabit: async (id) => {
    await habitRepo.archiveHabit(id);
    set(state => ({ habits: state.habits.filter(h => h.id !== id) }));
  },

  deleteHabit: async (id) => {
    await habitRepo.deleteHabit(id);
    set(state => ({ habits: state.habits.filter(h => h.id !== id) }));
  },

  reorderHabits: async (orderedIds) => {
    await habitRepo.reorderHabits(orderedIds);
    set(state => {
      const newHabits = orderedIds
        .map(id => state.habits.find(h => h.id === id))
        .filter(Boolean) as Habit[];
      return { habits: newHabits.map((h, i) => ({ ...h, sortOrder: i })) };
    });
  },

  getTodaysHabits: () => {
    const { habits } = get();
    const dayOfWeek = getDayOfWeek();

    return habits.filter(habit => {
      if (habit.archivedAt) return false;

      switch (habit.frequency) {
        case Frequency.DAILY:
          return true;
        case Frequency.SPECIFIC_DAYS:
          return habit.specificDays?.includes(dayOfWeek) ?? false;
        case Frequency.X_TIMES_PER_WEEK:
          return true; // Always show, track weekly count separately
        default:
          return true;
      }
    });
  },
}));
