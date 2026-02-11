import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { useHabitStore } from '../../src/store/habitStore';
import { useCompletionStore } from '../../src/store/completionStore';
import { HabitCard } from '../../src/components/habits/HabitCard';
import { ProgressRing } from '../../src/components/home/ProgressRing';
import { DailyGreeting } from '../../src/components/home/DailyGreeting';
import { MotivationalNudge } from '../../src/components/home/MotivationalNudge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Habit, HabitType } from '../../src/models/types';
import { getStreakRecord } from '../../src/db/badgeRepository';
import { skipDate, unskipDate, isDateSkipped } from '../../src/db/completionRepository';
import { getTodayString } from '../../src/utils/dates';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { BadgeUnlockModal } from '../../src/components/gamification/BadgeUnlockModal';
import { updateWidgetData } from '../../src/utils/widgetData';

export default function HomeScreen() {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const getTodaysHabits = useHabitStore(s => s.getTodaysHabits);
  const reorderHabits = useHabitStore(s => s.reorderHabits);
  const isHabitsLoading = useHabitStore(s => s.isLoading);
  const todayCompletions = useCompletionStore(s => s.todayCompletions);
  const toggleCompletion = useCompletionStore(s => s.toggleCompletion);
  const updateQuantity = useCompletionStore(s => s.updateQuantity);
  const addNote = useCompletionStore(s => s.addNote);
  const newlyUnlockedBadge = useGamificationStore(s => s.newlyUnlockedBadge);
  const dismissBadgeModal = useGamificationStore(s => s.dismissBadgeModal);

  const archiveHabit = useHabitStore(s => s.archiveHabit);
  const deleteHabit = useHabitStore(s => s.deleteHabit);

  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [skippedHabits, setSkippedHabits] = useState<Set<string>>(new Set());

  const todaysHabits = getTodaysHabits();
  const completedCount = todaysHabits.filter(h =>
    h.type === HabitType.BOOLEAN
      ? todayCompletions.has(h.id)
      : (todayCompletions.get(h.id)?.value ?? 0) >= h.dailyTarget
  ).length;

  useEffect(() => {
    const today = getTodayString();
    async function loadStreaksAndSkips() {
      const newStreaks: Record<string, number> = {};
      const newSkipped = new Set<string>();
      for (const habit of todaysHabits) {
        const record = await getStreakRecord(habit.id);
        if (record) {
          newStreaks[habit.id] = record.current_streak;
        }
        const skipped = await isDateSkipped(habit.id, today);
        if (skipped) newSkipped.add(habit.id);
      }
      setStreaks(newStreaks);
      setSkippedHabits(newSkipped);
    }
    loadStreaksAndSkips();
  }, [habits, todayCompletions]);

  // Sync widget data whenever completions change
  useEffect(() => {
    const completedHabitNames = todaysHabits
      .filter(h => h.type === HabitType.BOOLEAN
        ? todayCompletions.has(h.id)
        : (todayCompletions.get(h.id)?.value ?? 0) >= h.dailyTarget)
      .map(h => h.name);

    updateWidgetData({
      completedCount,
      totalCount: todaysHabits.length,
      bestStreak: Math.max(0, ...Object.values(streaks)),
      habitNames: todaysHabits.map(h => h.name),
      completedHabits: completedHabitNames,
    });
  }, [todayCompletions, todaysHabits.length, streaks]);

  const bestStreak = Math.max(0, ...Object.values(streaks));

  const handleArchive = useCallback((habit: Habit) => {
    Alert.alert('Archive Habit', `Archive "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: () => archiveHabit(habit.id) },
    ]);
  }, [archiveHabit]);

  const handleDelete = useCallback((habit: Habit) => {
    Alert.alert('Delete Habit', `Permanently delete "${habit.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
    ]);
  }, [deleteHabit]);

  const handleSkipDay = useCallback(async (habit: Habit) => {
    const today = getTodayString();
    const wasSkipped = skippedHabits.has(habit.id);
    if (wasSkipped) {
      await unskipDate(habit.id, today);
      setSkippedHabits(prev => { const next = new Set(prev); next.delete(habit.id); return next; });
    } else {
      await skipDate(habit.id, today);
      setSkippedHabits(prev => new Set(prev).add(habit.id));
    }
  }, [skippedHabits]);

  const renderHabit = useCallback(({ item, drag, isActive }: RenderItemParams<Habit>) => (
    <ScaleDecorator>
      <HabitCard
        habit={item}
        completion={todayCompletions.get(item.id)}
        streak={streaks[item.id] || 0}
        onToggle={() => toggleCompletion(item)}
        onQuantityChange={(value) => updateQuantity(item, value)}
        onAddNote={(note) => addNote(item.id, note)}
        onSkipDay={() => handleSkipDay(item)}
        isSkipped={skippedHabits.has(item.id)}
        onArchive={() => handleArchive(item)}
        onDelete={() => handleDelete(item)}
        onDrag={drag}
        isDragging={isActive}
      />
    </ScaleDecorator>
  ), [todayCompletions, streaks, skippedHabits, toggleCompletion, updateQuantity, addNote, handleSkipDay, handleArchive, handleDelete]);

  const handleDragEnd = useCallback(({ data }: { data: Habit[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const orderedIds = data.map(h => h.id);
    reorderHabits(orderedIds);
  }, [reorderHabits]);

  if (isHabitsLoading) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <DraggableFlatList
        data={todaysHabits}
        renderItem={renderHabit}
        keyExtractor={item => item.id}
        onDragEnd={handleDragEnd}
        onDragBegin={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        ListHeaderComponent={
          <View>
            <DailyGreeting />
            {todaysHabits.length > 0 && (
              <View style={styles.progressRow}>
                <ProgressRing completed={completedCount} total={todaysHabits.length} />
                <MotivationalNudge
                  completed={completedCount}
                  total={todaysHabits.length}
                  bestStreak={bestStreak}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="plus-circle-outline"
            title="No habits yet"
            subtitle="Tap the + button to create your first habit and start building your streaks!"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/habit/create')}
        style={[styles.fab, { backgroundColor: theme.primary }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Badge unlock modal */}
      {newlyUnlockedBadge && (
        <BadgeUnlockModal badge={newlyUnlockedBadge} onDismiss={dismissBadgeModal} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  progressRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
