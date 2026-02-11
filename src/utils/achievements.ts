import { BADGE_DEFINITIONS } from '../constants/badges';
import { BadgeCategory } from '../models/types';

export interface AchievementContext {
  longestStreak: number;
  totalCompletions: number;
  habitCount: number;
  perfectWeeks: number;
  perfectMonths: number;
  unlockedBadgeIds: Set<string>;
}

export function checkNewBadges(context: AchievementContext): string[] {
  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (context.unlockedBadgeIds.has(badge.id)) continue;

    let earned = false;

    switch (badge.category) {
      case BadgeCategory.STREAK:
        earned = context.longestStreak >= badge.threshold;
        break;
      case BadgeCategory.COMPLETIONS:
        earned = context.totalCompletions >= badge.threshold;
        break;
      case BadgeCategory.HABITS:
        earned = context.habitCount >= badge.threshold;
        break;
      case BadgeCategory.CONSISTENCY:
        if (badge.id === 'perfect_week') {
          earned = context.perfectWeeks >= badge.threshold;
        } else if (badge.id === 'perfect_month') {
          earned = context.perfectMonths >= badge.threshold;
        }
        break;
    }

    if (earned) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}
