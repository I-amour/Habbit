import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, Alert, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../src/hooks/useTheme';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDatabase } from '../../src/db/database';
import { Habit } from '../../src/models/types';
import { useHabitStore } from '../../src/store/habitStore';
import { scheduleGlobalReminder, cancelGlobalReminder, formatTime } from '../../src/utils/notifications';

export default function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const profile = useGamificationStore(s => s.profile);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const loadHabits = useHabitStore(s => s.loadHabits);

  const globalReminderEnabled = useSettingsStore(s => s.globalReminderEnabled);
  const globalReminderHour = useSettingsStore(s => s.globalReminderHour);
  const globalReminderMinute = useSettingsStore(s => s.globalReminderMinute);
  const setGlobalReminder = useSettingsStore(s => s.setGlobalReminder);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderDate, setReminderDate] = useState(() => {
    const d = new Date();
    d.setHours(globalReminderHour, globalReminderMinute, 0, 0);
    return d;
  });

  // Sync reminderDate when store values load
  useEffect(() => {
    const d = new Date();
    d.setHours(globalReminderHour, globalReminderMinute, 0, 0);
    setReminderDate(d);
  }, [globalReminderHour, globalReminderMinute]);

  useEffect(() => {
    loadArchivedHabits();
  }, []);

  async function loadArchivedHabits() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM habits WHERE archived_at IS NOT NULL ORDER BY archived_at DESC'
    );
    setArchivedHabits(rows as unknown as Habit[]);
  }

  async function toggleReminders(value: boolean) {
    if (value) {
      await scheduleGlobalReminder(globalReminderHour, globalReminderMinute);
      await setGlobalReminder(true, globalReminderHour, globalReminderMinute);
    } else {
      await cancelGlobalReminder();
      await setGlobalReminder(false, globalReminderHour, globalReminderMinute);
      setShowTimePicker(false);
    }
  }

  const handleTimeChange = async (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setReminderDate(date);
      const hour = date.getHours();
      const minute = date.getMinutes();
      await setGlobalReminder(true, hour, minute);
      await scheduleGlobalReminder(hour, minute);
    }
  };

  async function restoreHabit(id: string) {
    const db = await getDatabase();
    await db.runAsync('UPDATE habits SET archived_at = NULL WHERE id = ?', [id]);
    await loadArchivedHabits();
    await loadHabits();
    Alert.alert('Restored', 'Habit has been restored to your active list.');
  }

  async function permanentlyDeleteHabit(id: string, name: string) {
    Alert.alert('Delete Forever', `Permanently delete "${name}"? All data will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
          await loadArchivedHabits();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* General */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>General</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={theme.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Daily Reminder</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>
                  {globalReminderEnabled
                    ? `Every day at ${formatTime(globalReminderHour, globalReminderMinute)}`
                    : 'Off'}
                </Text>
              </View>
              <Switch
                value={globalReminderEnabled}
                onValueChange={toggleReminders}
                trackColor={{ true: theme.primary, false: theme.border }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Time picker row */}
            {globalReminderEnabled && (
              <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Pressable
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  style={styles.row}
                >
                  <MaterialCommunityIcons name="clock-outline" size={22} color={theme.primary} />
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>Reminder Time</Text>
                    <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>
                      Tap to change
                    </Text>
                  </View>
                  <Text style={[styles.timeValue, { color: theme.primary }]}>
                    {formatTime(globalReminderHour, globalReminderMinute)}
                  </Text>
                </Pressable>

                {showTimePicker && (
                  <View style={styles.timePickerWrap}>
                    <DateTimePicker
                      value={reminderDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimeChange}
                      minuteInterval={5}
                      accentColor={theme.primary}
                    />
                  </View>
                )}
              </View>
            )}

            <View style={styles.row}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={theme.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Appearance</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>
                  {colorScheme === 'dark' ? 'Dark mode' : 'Light mode'} (follows system)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <Pressable
              style={styles.row}
              onPress={() => setShowArchived(!showArchived)}
            >
              <MaterialCommunityIcons name="archive-outline" size={22} color={theme.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Archived Habits</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>
                  {archivedHabits.length} archived habit{archivedHabits.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={showArchived ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* Archived habits list */}
        {showArchived && (
          <View style={styles.archivedList}>
            {archivedHabits.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                No archived habits
              </Text>
            ) : (
              archivedHabits.map(habit => (
                <View key={(habit as unknown as Record<string, string>).id} style={[styles.archivedRow, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.archivedName, { color: theme.text }]} numberOfLines={1}>
                    {(habit as unknown as Record<string, string>).name}
                  </Text>
                  <Pressable
                    onPress={() => restoreHabit((habit as unknown as Record<string, string>).id)}
                    style={[styles.restoreButton, { backgroundColor: theme.success + '18' }]}
                  >
                    <Text style={[styles.restoreText, { color: theme.success }]}>Restore</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => permanentlyDeleteHabit(
                      (habit as unknown as Record<string, string>).id,
                      (habit as unknown as Record<string, string>).name
                    )}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* Stats summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Summary</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="star-four-points" size={22} color={theme.xp} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Level {profile.level}</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>{profile.totalXP.toLocaleString()} XP earned</Text>
              </View>
            </View>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="check-all" size={22} color={theme.success} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{profile.totalCompletions} Completions</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>All time</Text>
              </View>
            </View>
            <View style={styles.row}>
              <MaterialCommunityIcons name="fire" size={22} color={theme.streak} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{profile.longestStreakEver} Day Streak</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>Personal best</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="information-outline" size={22} color={theme.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Habbit</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  timePickerWrap: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  archivedList: {
    marginTop: -16,
    marginBottom: 24,
    gap: 6,
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  archivedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
