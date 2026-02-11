import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  globalReminderEnabled: boolean;
  globalReminderHour: number;
  globalReminderMinute: number;
  loadSettings: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setGlobalReminder: (enabled: boolean, hour: number, minute: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hasCompletedOnboarding: false,
  isLoading: true,
  globalReminderEnabled: false,
  globalReminderHour: 20,
  globalReminderMinute: 0,

  loadSettings: async () => {
    try {
      const onboarded = await AsyncStorage.getItem('habbit_onboarded');
      const reminderData = await AsyncStorage.getItem('habbit_global_reminder');
      const reminder = reminderData ? JSON.parse(reminderData) : null;
      set({
        hasCompletedOnboarding: onboarded === 'true',
        globalReminderEnabled: reminder?.enabled ?? false,
        globalReminderHour: reminder?.hour ?? 20,
        globalReminderMinute: reminder?.minute ?? 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('habbit_onboarded', 'true');
    set({ hasCompletedOnboarding: true });
  },

  setGlobalReminder: async (enabled: boolean, hour: number, minute: number) => {
    await AsyncStorage.setItem('habbit_global_reminder', JSON.stringify({ enabled, hour, minute }));
    set({ globalReminderEnabled: enabled, globalReminderHour: hour, globalReminderMinute: minute });
  },
}));
