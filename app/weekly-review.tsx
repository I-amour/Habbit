import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/hooks/useTheme';
import { useHabitStore } from '../src/store/habitStore';
import { useGamificationStore } from '../src/store/gamificationStore';
import { getCompletionCountByDate, getCompletionsForDate } from '../src/db/completionRepository';
import { getStreakRecord } from '../src/db/badgeRepository';
import { getWeekDays, getWeekStart, getWeekEnd } from '../src/utils/dates';
import { HabitType } from '../src/models/types';

interface HabitWeekData {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDays: number;
  totalDays: number;
  streak: number;
}

export default function WeeklyReviewScreen() {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const profile = useGamificationStore(s => s.profile);

  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [habitData, setHabitData] = useState<HabitWeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekDays = getWeekDays();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  useEffect(() => {
    async function loadWeekData() {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');

      // Load daily counts
      const counts = await getCompletionCountByDate(startStr, endStr);
      setDayCounts(counts);

      // Load per-habit completion data for the week
      const activeHabits = habits.filter(h => !h.archivedAt);
      const weekData: HabitWeekData[] = [];

      for (const habit of activeHabits) {
        let completedDays = 0;
        for (const day of weekDays) {
          const completions = await getCompletionsForDate(day);
          const habitCompletion = completions.find(c => c.habitId === habit.id);
          if (habitCompletion) {
            if (habit.type === HabitType.BOOLEAN || habitCompletion.value >= habit.dailyTarget) {
              completedDays++;
            }
          }
        }
        const streakRecord = await getStreakRecord(habit.id);
        weekData.push({
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          completedDays,
          totalDays: weekDays.length,
          streak: streakRecord?.current_streak ?? 0,
        });
      }

      // Sort by completion rate descending
      weekData.sort((a, b) => (b.completedDays / b.totalDays) - (a.completedDays / a.totalDays));
      setHabitData(weekData);
      setIsLoading(false);
    }
    loadWeekData();
  }, []);

  const totalCompletions = Object.values(dayCounts).reduce((a, b) => a + b, 0);
  const maxDaily = Math.max(1, ...Object.values(dayCounts));
  const activeDays = Object.values(dayCounts).filter(c => c > 0).length;
  const perfectHabits = habitData.filter(h => h.completedDays === h.totalDays);
  const overallRate = habitData.length > 0
    ? Math.round((habitData.reduce((sum, h) => sum + h.completedDays, 0) / habitData.reduce((sum, h) => sum + h.totalDays, 0)) * 100)
    : 0;

  if (isLoading) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.text }]}>Weekly Review</Text>
            <Text style={[styles.dateRange, { color: theme.textSecondary }]}>
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Summary cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="check-all" size={24} color={theme.success} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalCompletions}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Completions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="percent-outline" size={24} color={theme.primary} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{overallRate}%</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Success Rate</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={theme.streak} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{activeDays}/7</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Active Days</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="star" size={24} color={theme.xp} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{profile.weeklyCompletions * 10}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>XP Earned</Text>
          </View>
        </Animated.View>

        {/* Daily bar chart */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Activity</Text>
          <View style={styles.chartRow}>
            {weekDays.map((day, i) => {
              const count = dayCounts[day] || 0;
              const height = maxDaily > 0 ? (count / maxDaily) * 80 : 0;
              const dayLabel = format(new Date(day + 'T12:00:00'), 'EEE');
              const isToday = day === weekDays[weekDays.length - 1] || day === format(new Date(), 'yyyy-MM-dd');

              return (
                <View key={day} style={styles.barColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, height),
                          backgroundColor: count > 0 ? (isToday ? theme.primary : theme.primaryLight) : theme.border,
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, { color: isToday ? theme.primary : theme.textTertiary }]}>
                    {dayLabel}
                  </Text>
                  <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Per-habit breakdown */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[styles.sectionHeaderText, { color: theme.text }]}>Habit Breakdown</Text>
          {habitData.map((habit, index) => {
            const rate = Math.round((habit.completedDays / habit.totalDays) * 100);
            return (
              <Animated.View
                key={habit.id}
                entering={FadeInUp.delay(350 + index * 50).duration(250)}
                style={[styles.habitRow, { backgroundColor: theme.surface }]}
              >
                <View style={[styles.habitIcon, { backgroundColor: habit.color + '15' }]}>
                  <MaterialCommunityIcons
                    name={habit.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={18}
                    color={habit.color}
                  />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${rate}%`,
                          backgroundColor: rate === 100 ? theme.success : habit.color,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.habitStats}>
                  <Text style={[styles.habitRate, { color: rate === 100 ? theme.success : theme.text }]}>
                    {rate}%
                  </Text>
                  <Text style={[styles.habitDays, { color: theme.textTertiary }]}>
                    {habit.completedDays}/{habit.totalDays}d
                  </Text>
                </View>
                {habit.streak > 0 && (
                  <View style={styles.streakChip}>
                    <MaterialCommunityIcons name="fire" size={12} color={theme.streak} />
                    <Text style={[styles.streakNum, { color: theme.streak }]}>{habit.streak}</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Perfect habits */}
        {perfectHabits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(300)} style={[styles.section, { backgroundColor: theme.successLight }]}>
            <View style={styles.perfectHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color={theme.success} />
              <Text style={[styles.sectionTitle, { color: theme.success }]}>Perfect This Week</Text>
            </View>
            <View style={styles.perfectList}>
              {perfectHabits.map(h => (
                <View key={h.id} style={[styles.perfectChip, { backgroundColor: h.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={h.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={14}
                    color={h.color}
                  />
                  <Text style={[styles.perfectName, { color: h.color }]}>{h.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Encouragement */}
        <Animated.View entering={FadeInDown.delay(600).duration(300)} style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.encouragement, { color: theme.text }]}>
            {overallRate >= 80
              ? 'Outstanding week! Keep up this amazing momentum!'
              : overallRate >= 50
                ? 'Solid progress this week. Every completion counts!'
                : 'Every step forward matters. Let\'s make next week even better!'}
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  dateRange: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '47%',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  section: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHeaderText: { fontSize: 18, fontWeight: '700' },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barContainer: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: 24 },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  countLabel: { fontSize: 10, fontWeight: '500' },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    gap: 10,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: { flex: 1, gap: 6 },
  habitName: { fontSize: 14, fontWeight: '600' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  habitStats: { alignItems: 'flex-end', gap: 2 },
  habitRate: { fontSize: 15, fontWeight: '800' },
  habitDays: { fontSize: 10, fontWeight: '500' },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakNum: { fontSize: 12, fontWeight: '700' },
  perfectHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perfectList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  perfectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  perfectName: { fontSize: 12, fontWeight: '600' },
  encouragement: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
