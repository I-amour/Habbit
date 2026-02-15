import { create } from 'zustand';
import { Badge, UserProfile } from '../models/types';
import * as badgeRepo from '../db/badgeRepository';
import * as completionRepo from '../db/completionRepository';
import * as habitRepo from '../db/habitRepository';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { getLevelForXP } from '../constants/xp';
import { checkNewBadges, AchievementContext } from '../utils/achievements';
import { XP_VALUES } from '../constants/xp';

interface GamificationState {
  profile: UserProfile;
  badges: Badge[];
  newlyUnlockedBadge: Badge | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  loadBadges: () => Promise<void>;
  awardXP: (amount: number) => Promise<void>;
  deductCompletion: (amount: number) => Promise<void>;
  checkAndUnlockBadges: () => Promise<void>;
  setLongestStreak: (streak: number) => void;
  dismissBadgeModal: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  totalXP: 0,
  level: 1,
  weeklyCompletions: 0,
  totalCompletions: 0,
  longestStreakEver: 0,
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  badges: [],
  newlyUnlockedBadge: null,
  isLoading: true,

  loadProfile: async () => {
    const dbProfile = await badgeRepo.getUserProfile();
    if (dbProfile) {
      set({
        profile: {
          totalXP: dbProfile.total_xp,
          level: getLevelForXP(dbProfile.total_xp),
          weeklyCompletions: dbProfile.weekly_completions,
          totalCompletions: dbProfile.total_completions,
          longestStreakEver: dbProfile.longest_streak_ever,
        },
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  loadBadges: async () => {
    const unlockedIds = await badgeRepo.getUnlockedBadgeIds();
    const badges: Badge[] = BADGE_DEFINITIONS.map(def => ({
      ...def,
      unlockedAt: unlockedIds.has(def.id) ? 'unlocked' : null,
    }));
    set({ badges });
  },

  awardXP: async (amount: number) => {
    const { profile } = get();
    const newXP = profile.totalXP + amount;
    const newLevel = getLevelForXP(newXP);
    const totalCompletions = profile.totalCompletions + 1;

    await badgeRepo.updateUserProfile({
      totalXP: newXP,
      level: newLevel,
      totalCompletions,
      weeklyCompletions: profile.weeklyCompletions + 1,
    });

    set({
      profile: {
        ...profile,
        totalXP: newXP,
        level: newLevel,
        totalCompletions,
        weeklyCompletions: profile.weeklyCompletions + 1,
      },
    });
  },

  deductCompletion: async (amount: number) => {
    const { profile } = get();
    const newXP = Math.max(0, profile.totalXP - amount);
    const newLevel = getLevelForXP(newXP);
    const totalCompletions = Math.max(0, profile.totalCompletions - 1);
    const weeklyCompletions = Math.max(0, profile.weeklyCompletions - 1);

    await badgeRepo.updateUserProfile({
      totalXP: newXP,
      level: newLevel,
      totalCompletions,
      weeklyCompletions,
    });

    set({
      profile: {
        ...profile,
        totalXP: newXP,
        level: newLevel,
        totalCompletions,
        weeklyCompletions,
      },
    });
  },

  checkAndUnlockBadges: async () => {
    const { profile, badges } = get();
    const unlockedIds = new Set(badges.filter(b => b.unlockedAt).map(b => b.id));
    const habitCount = await habitRepo.getHabitCount();

    const context: AchievementContext = {
      longestStreak: profile.longestStreakEver,
      totalCompletions: profile.totalCompletions,
      habitCount,
      perfectWeeks: 0, // TODO: calculate from data
      perfectMonths: 0,
      unlockedBadgeIds: unlockedIds,
    };

    const newBadgeIds = checkNewBadges(context);

    for (const badgeId of newBadgeIds) {
      await badgeRepo.unlockBadge(badgeId);

      // Award bonus XP for badge unlock
      const { profile: currentProfile } = get();
      const newXP = currentProfile.totalXP + XP_VALUES.UNLOCK_BADGE;
      await badgeRepo.updateUserProfile({ totalXP: newXP, level: getLevelForXP(newXP) });

      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (badgeDef) {
        set({
          newlyUnlockedBadge: { ...badgeDef, unlockedAt: new Date().toISOString() },
          profile: { ...get().profile, totalXP: newXP, level: getLevelForXP(newXP) },
        });
      }
    }

    // Refresh badges list
    await get().loadBadges();
  },

  setLongestStreak: (streak: number) => {
    set(state => ({
      profile: { ...state.profile, longestStreakEver: streak },
    }));
  },

  dismissBadgeModal: () => {
    set({ newlyUnlockedBadge: null });
  },
}));
