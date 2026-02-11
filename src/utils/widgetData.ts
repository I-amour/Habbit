import { Platform } from 'react-native';

const APP_GROUP = 'group.com.habbit.shared';

/**
 * Writes today's habit progress to shared UserDefaults (App Group)
 * so the iOS widget can display it.
 *
 * NOTE: This requires a development build with App Groups configured.
 * It silently no-ops in Expo Go or Android.
 */
export async function updateWidgetData(data: {
  completedCount: number;
  totalCount: number;
  bestStreak: number;
  habitNames: string[];
  completedHabits: string[];
}) {
  if (Platform.OS !== 'ios') return;

  try {
    // Use expo-modules-core's NativeModulesProxy if available,
    // otherwise fall back to a no-op in Expo Go
    const SharedGroupPreferences = require('react-native').NativeModules.SharedGroupPreferences;
    if (!SharedGroupPreferences) return;

    await SharedGroupPreferences.setItem(
      'widgetData',
      JSON.stringify({
        completed: data.completedCount,
        total: data.totalCount,
        streak: data.bestStreak,
        habits: data.habitNames,
        done: data.completedHabits,
        updatedAt: new Date().toISOString(),
      }),
      APP_GROUP
    );
  } catch {
    // Silently fail - widget data is optional
  }
}
