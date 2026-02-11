export const XP_VALUES = {
  COMPLETE_HABIT: 10,
  COMPLETE_ALL_DAILY: 25,
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_14: 100,
  STREAK_MILESTONE_30: 200,
  STREAK_MILESTONE_60: 350,
  STREAK_MILESTONE_100: 500,
  STREAK_MILESTONE_365: 1000,
  UNLOCK_BADGE: 100,
  PERFECT_WEEK: 150,
} as const;

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3800,   // Level 9
  5200,   // Level 10
  7000,   // Level 11
  9500,   // Level 12
  12500,  // Level 13
  16500,  // Level 14
  21500,  // Level 15
];

export function getLevelForXP(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return Infinity;
  return LEVEL_THRESHOLDS[currentLevel];
}

export function getXPProgress(totalXP: number): { current: number; needed: number; level: number } {
  const level = getLevelForXP(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = getXPForNextLevel(level);
  return {
    current: totalXP - currentLevelXP,
    needed: nextLevelXP === Infinity ? 0 : nextLevelXP - currentLevelXP,
    level,
  };
}
