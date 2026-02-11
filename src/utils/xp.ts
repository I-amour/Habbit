import { XP_VALUES } from '../constants/xp';
import { getLevelForXP } from '../constants/xp';

export function calculateCompletionXP(streakCount: number): number {
  let xp = XP_VALUES.COMPLETE_HABIT;

  // Streak milestones
  if (streakCount === 7) xp += XP_VALUES.STREAK_MILESTONE_7;
  if (streakCount === 14) xp += XP_VALUES.STREAK_MILESTONE_14;
  if (streakCount === 30) xp += XP_VALUES.STREAK_MILESTONE_30;
  if (streakCount === 60) xp += XP_VALUES.STREAK_MILESTONE_60;
  if (streakCount === 100) xp += XP_VALUES.STREAK_MILESTONE_100;
  if (streakCount === 365) xp += XP_VALUES.STREAK_MILESTONE_365;

  return xp;
}

export function didLevelUp(oldXP: number, newXP: number): boolean {
  return getLevelForXP(newXP) > getLevelForXP(oldXP);
}
