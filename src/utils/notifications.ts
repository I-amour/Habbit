import * as Notifications from 'expo-notifications';
import { Habit } from '../models/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<string | null> {
  if (!habit.reminderTime) return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  // Cancel existing reminder for this habit
  await cancelHabitReminder(habit.id);

  const [hourStr, minuteStr] = habit.reminderTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for: ${habit.name}`,
      body: `Don't forget to complete your habit today!`,
      data: { habitId: habit.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: `habit-${habit.id}`,
  });

  return id;
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  // Cancel single daily reminder
  try {
    await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);
  } catch {
    // Notification may not exist
  }
  // Cancel all interval reminders for this habit (up to 48 slots)
  for (let i = 0; i < 48; i++) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}-interval-${i}`);
    } catch {
      // May not exist
    }
  }
}

/**
 * Schedule interval reminders for a habit (e.g. every 30 min from 8 AM to 10 PM).
 * Creates one DAILY trigger for each time slot.
 */
export async function scheduleIntervalReminders(habit: Habit): Promise<void> {
  if (!habit.reminderIntervalMinutes || !habit.reminderStartHour || !habit.reminderEndHour) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelHabitReminder(habit.id);

  const interval = habit.reminderIntervalMinutes;
  const startHour = habit.reminderStartHour;
  const endHour = habit.reminderEndHour;

  let slotIndex = 0;
  let currentMinutes = startHour * 60; // total minutes from midnight
  const endMinutes = endHour * 60;

  while (currentMinutes <= endMinutes && slotIndex < 48) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.name}`,
        body: `Time for your ${habit.name} check-in!`,
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      identifier: `habit-${habit.id}-interval-${slotIndex}`,
    });

    currentMinutes += interval;
    slotIndex++;
  }
}

export async function scheduleGlobalReminder(hour: number, minute: number): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel old global reminder
  try {
    await Notifications.cancelScheduledNotificationAsync('global-reminder');
  } catch {
    // May not exist
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't forget your habits!",
      body: "You've got habits waiting to be checked off today.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: 'global-reminder',
  });
}

export async function cancelGlobalReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('global-reminder');
  } catch {
    // May not exist
  }
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
