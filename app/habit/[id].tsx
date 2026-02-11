import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, subDays, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { useTheme } from '../../src/hooks/useTheme';
import { useHabitStore } from '../../src/store/habitStore';
import { getStreakRecord } from '../../src/db/badgeRepository';
import { getCompletionDatesForHabit } from '../../src/db/completionRepository';
import { Frequency } from '../../src/models/types';
import { formatTime } from '../../src/utils/notifications';

const FREQUENCY_LABELS: Record<string, string> = {
  [Frequency.DAILY]: 'Every day',
  [Frequency.SPECIFIC_DAYS]: 'Specific days',
  [Frequency.X_TIMES_PER_WEEK]: 'Times per week',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const MINI_CELL = Math.floor((SCREEN_WIDTH - 40 - 6 * 6) / 7);

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const archiveHabit = useHabitStore(s => s.archiveHabit);
  const deleteHabit = useHabitStore(s => s.deleteHabit);

  const habit = habits.find(h => h.id === id);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [freezeAvailable, setFreezeAvailable] = useState(true);
  const [completionDates, setCompletionDates] = useState<Set<string>>(new Set());
  const [streakHistory, setStreakHistory] = useState<{ date: string; completed: boolean }[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const record = await getStreakRecord(id!);
      if (record) {
        setStreak({ current: record.current_streak, longest: record.longest_streak });
        setFreezeAvailable(!record.streak_freeze_used_this_week);
      }
      const dates = await getCompletionDatesForHabit(id!);
      setCompletionDates(new Set(dates));
      setTotalCompletions(dates.length);

      // Build last 30 days streak history
      const today = new Date();
      const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today });
      const dateSet = new Set(dates);
      setStreakHistory(
        last30.map(d => ({
          date: format(d, 'yyyy-MM-dd'),
          completed: dateSet.has(format(d, 'yyyy-MM-dd')),
        }))
      );
    }
    load();
  }, [id, habits]);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  const handleArchive = () => {
    Alert.alert('Archive Habit', `Are you sure you want to archive "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: async () => { await archiveHabit(habit.id); router.back(); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Habit', `Permanently delete "${habit.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteHabit(habit.id); router.back(); },
      },
    ]);
  };

  // Current month calendar data
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Completion rate
  const rate = streakHistory.length > 0
    ? Math.round((streakHistory.filter(d => d.completed).length / streakHistory.length) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{habit.name}</Text>
        <Pressable onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })} hitSlop={12}>
          <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: habit.color + '20' }]}>
            <MaterialCommunityIcons
              name={habit.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={40}
              color={habit.color}
            />
          </View>
          <Text style={[styles.heroName, { color: theme.text }]}>{habit.name}</Text>
          <Text style={[styles.frequency, { color: theme.textSecondary }]}>
            {FREQUENCY_LABELS[habit.frequency]}
            {habit.frequency === Frequency.SPECIFIC_DAYS && habit.specificDays
              ? ` (${habit.specificDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`
              : ''}
            {habit.frequency === Frequency.X_TIMES_PER_WEEK ? ` (${habit.timesPerWeek}x)` : ''}
          </Text>
          {habit.reminderTime && (
            <View style={styles.reminderBadge}>
              <MaterialCommunityIcons name="bell-outline" size={14} color={theme.primary} />
              <Text style={[styles.reminderBadgeText, { color: theme.primary }]}>
                {formatTime(...habit.reminderTime.split(':').map(Number) as [number, number])}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="fire" size={24} color={theme.streak} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{streak.current}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="trophy" size={24} color={theme.xp} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{streak.longest}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="check-all" size={24} color={theme.success} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{totalCompletions}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="percent" size={24} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{rate}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rate</Text>
          </View>
        </Animated.View>

        {/* Streak freeze */}
        <View style={[styles.freezeCard, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons
            name={freezeAvailable ? 'shield-check' : 'shield-off'}
            size={20}
            color={freezeAvailable ? theme.success : theme.textTertiary}
          />
          <Text style={[styles.freezeText, { color: theme.text }]}>
            {freezeAvailable ? 'Streak freeze available' : 'Streak freeze used this week'}
          </Text>
        </View>

        {/* 30-day streak history */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last 30 Days</Text>
          <View style={[styles.streakHistoryCard, { backgroundColor: theme.surface }]}>
            <View style={styles.streakGrid}>
              {streakHistory.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.streakDot,
                    {
                      backgroundColor: day.completed ? habit.color : theme.surfaceAlt,
                      borderColor: isToday(new Date(day.date + 'T12:00:00')) ? theme.primary : 'transparent',
                      borderWidth: isToday(new Date(day.date + 'T12:00:00')) ? 2 : 0,
                    },
                  ]}
                >
                  {day.completed && (
                    <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.streakLegend}>
              <Text style={[styles.streakLegendText, { color: theme.textTertiary }]}>
                {format(subDays(new Date(), 29), 'MMM d')}
              </Text>
              <Text style={[styles.streakLegendText, { color: theme.textTertiary }]}>
                Today
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Mini completion calendar */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {format(now, 'MMMM yyyy')}
          </Text>
          <View style={[styles.miniCalCard, { backgroundColor: theme.surface }]}>
            {/* Day headers */}
            <View style={styles.miniCalDayNames}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <View key={i} style={[styles.miniCalCell, { width: MINI_CELL, height: 20 }]}>
                  <Text style={[styles.miniCalDayLabel, { color: theme.textTertiary }]}>{d}</Text>
                </View>
              ))}
            </View>
            {/* Calendar grid */}
            <View style={styles.miniCalGrid}>
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <View key={`e-${i}`} style={[styles.miniCalCell, { width: MINI_CELL, height: MINI_CELL }]} />
              ))}
              {daysInMonth.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const completed = completionDates.has(dateStr);
                const today = isToday(date);
                const future = date > now;
                return (
                  <View
                    key={dateStr}
                    style={[
                      styles.miniCalCell,
                      { width: MINI_CELL, height: MINI_CELL },
                      completed && { backgroundColor: habit.color, borderRadius: MINI_CELL / 2 },
                      today && !completed && { borderWidth: 1.5, borderColor: theme.primary, borderRadius: MINI_CELL / 2 },
                      future && { opacity: 0.3 },
                    ]}
                  >
                    <Text style={[
                      styles.miniCalDayNum,
                      { color: completed ? '#FFFFFF' : theme.text },
                      today && { fontWeight: '800' },
                    ]}>
                      {format(date, 'd')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.actions}>
          <Pressable
            onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}
            style={[styles.actionButton, { backgroundColor: theme.primary + '15' }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleArchive} style={[styles.actionButton, { backgroundColor: theme.warningLight }]}>
            <MaterialCommunityIcons name="archive-outline" size={18} color={theme.warning} />
            <Text style={[styles.actionText, { color: theme.warning }]}>Archive</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={[styles.actionButton, { backgroundColor: theme.danger + '15' }]}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
  },
  frequency: {
    fontSize: 14,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reminderBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  freezeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  freezeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  streakHistoryCard: {
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  streakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'flex-start',
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  streakLegendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  miniCalCard: {
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  miniCalDayNames: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  miniCalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniCalCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCalDayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniCalDayNum: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
