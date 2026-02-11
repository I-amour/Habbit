import { Badge, BadgeCategory } from '../models/types';

export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  // Streak badges
  { id: 'streak_3', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 7 },
  { id: 'streak_14', name: 'Two Week Titan', description: 'Maintain a 14-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 14 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 30 },
  { id: 'streak_60', name: 'Habit Hero', description: 'Maintain a 60-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 60 },
  { id: 'streak_100', name: 'Century Club', description: 'Maintain a 100-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 100 },
  { id: 'streak_365', name: 'Legendary', description: 'Maintain a 365-day streak', icon: 'fire', category: BadgeCategory.STREAK, threshold: 365 },

  // Completion badges
  { id: 'completions_10', name: 'First Steps', description: 'Complete 10 habits total', icon: 'check-circle', category: BadgeCategory.COMPLETIONS, threshold: 10 },
  { id: 'completions_50', name: 'Consistent', description: 'Complete 50 habits total', icon: 'check-circle', category: BadgeCategory.COMPLETIONS, threshold: 50 },
  { id: 'completions_100', name: 'Dedicated', description: 'Complete 100 habits total', icon: 'check-circle', category: BadgeCategory.COMPLETIONS, threshold: 100 },
  { id: 'completions_500', name: 'Powerhouse', description: 'Complete 500 habits total', icon: 'check-circle', category: BadgeCategory.COMPLETIONS, threshold: 500 },
  { id: 'completions_1000', name: 'Unstoppable', description: 'Complete 1000 habits total', icon: 'check-circle', category: BadgeCategory.COMPLETIONS, threshold: 1000 },

  // Habit creation badges
  { id: 'habits_1', name: 'The Beginning', description: 'Create your first habit', icon: 'plus-circle', category: BadgeCategory.HABITS, threshold: 1 },
  { id: 'habits_3', name: 'Building Routine', description: 'Create 3 habits', icon: 'plus-circle', category: BadgeCategory.HABITS, threshold: 3 },
  { id: 'habits_5', name: 'Habit Builder', description: 'Create 5 habits', icon: 'plus-circle', category: BadgeCategory.HABITS, threshold: 5 },

  // Consistency badges
  { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all habits for 7 days straight', icon: 'crown', category: BadgeCategory.CONSISTENCY, threshold: 1 },
  { id: 'perfect_month', name: 'Perfect Month', description: 'Complete all habits for 30 days straight', icon: 'crown', category: BadgeCategory.CONSISTENCY, threshold: 1 },
];
