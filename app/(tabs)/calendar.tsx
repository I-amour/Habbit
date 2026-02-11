import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Modal, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../src/hooks/useTheme';
import { MonthCalendar } from '../../src/components/calendar/MonthCalendar';
import { CompletionChart } from '../../src/components/calendar/CompletionChart';
import { ContributionGrid } from '../../src/components/calendar/ContributionGrid';
import { getCompletionsForDate, getTotalCompletions } from '../../src/db/completionRepository';
import { useHabitStore } from '../../src/store/habitStore';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { useCompletionStore } from '../../src/store/completionStore';
import { Completion, Habit } from '../../src/models/types';
import { getStreakRecord } from '../../src/db/badgeRepository';

export default function CalendarScreen() {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const profile = useGamificationStore(s => s.profile);
  const todayCompletions = useCompletionStore(s => s.todayCompletions);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayCompletions, setDayCompletions] = useState<Completion[]>([]);
  const [habitStreaks, setHabitStreaks] = useState<{ habit: Habit; streak: number }[]>([]);
  const [totalCheckins, setTotalCheckins] = useState(0);

  useEffect(() => {
    async function loadStreaks() {
      const streaks: { habit: Habit; streak: number }[] = [];
      for (const habit of habits) {
        const record = await getStreakRecord(habit.id);
        if (record && record.current_streak > 0) {
          streaks.push({ habit, streak: record.current_streak });
        }
      }
      streaks.sort((a, b) => b.streak - a.streak);
      setHabitStreaks(streaks);

      const total = await getTotalCompletions();
      setTotalCheckins(total);
    }
    loadStreaks();
  }, [habits, todayCompletions]);

  const handleDayPress = useCallback(async (date: string) => {
    const completions = await getCompletionsForDate(date);
    setDayCompletions(completions);
    setSelectedDate(date);
  }, []);

  const getHabitForCompletion = (habitId: string) =>
    habits.find(h => h.id === habitId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
        </View>

        {/* Month calendar with visible dates */}
        <View style={styles.section}>
          <MonthCalendar onDayPress={handleDayPress} />
        </View>

        {/* Overview stats */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="check-all" size={20} color={theme.success} />
            <Text style={[styles.overviewValue, { color: theme.text }]}>{totalCheckins}</Text>
            <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="fire" size={20} color={theme.streak} />
            <Text style={[styles.overviewValue, { color: theme.text }]}>{profile.longestStreakEver}</Text>
            <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Best Streak</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={theme.primary} />
            <Text style={[styles.overviewValue, { color: theme.text }]}>{habits.length}</Text>
            <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Habits</Text>
          </View>
        </View>

        {/* Weekly completion chart */}
        <View style={styles.section}>
          <CompletionChart />
        </View>

        {/* Active streaks */}
        {habitStreaks.length > 0 && (
          <View style={styles.streakSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Streaks</Text>
            {habitStreaks.map(({ habit, streak }) => (
              <View key={habit.id} style={[styles.streakRow, { backgroundColor: theme.surface }]}>
                <View style={[styles.streakIcon, { backgroundColor: habit.color + '18' }]}>
                  <MaterialCommunityIcons
                    name={habit.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={18}
                    color={habit.color}
                  />
                </View>
                <Text style={[styles.streakName, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color={theme.streak} />
                  <Text style={[styles.streakCount, { color: theme.streak }]}>
                    {streak}d
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Contribution grid at the bottom */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
          <View style={[styles.gridCard, { backgroundColor: theme.surface }]}>
            <ContributionGrid onDayPress={handleDayPress} weeks={16} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDate(null)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : ''}
            </Text>

            {dayCompletions.length === 0 ? (
              <Text style={[styles.emptyDay, { color: theme.textTertiary }]}>
                No habits completed this day
              </Text>
            ) : (
              <FlatList
                data={dayCompletions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const habit = getHabitForCompletion(item.habitId);
                  if (!habit) return null;
                  return (
                    <View style={[styles.completionRow, { borderBottomColor: theme.border }]}>
                      <MaterialCommunityIcons
                        name={habit.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={habit.color}
                      />
                      <Text style={[styles.completionName, { color: theme.text }]}>
                        {habit.name}
                      </Text>
                      <MaterialCommunityIcons name="check-circle" size={18} color={theme.success} />
                    </View>
                  );
                }}
              />
            )}

            <Pressable
              onPress={() => setSelectedDate(null)}
              style={[styles.closeButton, { backgroundColor: theme.surfaceAlt }]}
            >
              <Text style={[styles.closeText, { color: theme.text }]}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingBottom: 20,
    gap: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  streakSection: {
    paddingHorizontal: 20,
    gap: 8,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  streakIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridCard: {
    borderRadius: 16,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyDay: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  completionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
