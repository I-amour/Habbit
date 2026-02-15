import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.habbittracker.shared';

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
    const payload = {
      completed: data.completedCount,
      total: data.totalCount,
      streak: data.bestStreak,
      habits: data.habitNames,
      done: data.completedHabits,
      updatedAt: new Date().toISOString(),
    };

    await SharedGroupPreferences.setItem('widgetData', payload, APP_GROUP);
  } catch {
    // Silently fail - widget data is optional (e.g. Expo Go)
  }
}
