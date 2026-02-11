import React, { useMemo } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/hooks/useTheme';
import { useHabitStore } from '../../src/store/habitStore';
import { Habit, Frequency, HabitType } from '../../src/models/types';
import { formatTime } from '../../src/utils/notifications';
import { HABIT_CATEGORIES } from '../../src/constants/categories';

const FREQUENCY_LABELS: Record<string, string> = {
  [Frequency.DAILY]: 'Every day',
  [Frequency.SPECIFIC_DAYS]: 'Specific days',
  [Frequency.X_TIMES_PER_WEEK]: 'Weekly',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_MAP = Object.fromEntries(HABIT_CATEGORIES.map(c => [c.id, c]));

export default function HabitsScreen() {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const archiveHabit = useHabitStore(s => s.archiveHabit);

  const sections = useMemo(() => {
    const active = habits.filter(h => !h.archivedAt);
    const grouped: Record<string, Habit[]> = { __uncategorized: [] };
    for (const cat of HABIT_CATEGORIES) grouped[cat.id] = [];
    for (const h of active) {
      const key = h.category && grouped[h.category] ? h.category : '__uncategorized';
      grouped[key].push(h);
    }
    return Object.entries(grouped)
      .filter(([, items]) => items.length > 0)
      .map(([key, data]) => ({
        key,
        title: key === '__uncategorized' ? 'Uncategorized' : CATEGORY_MAP[key].label,
        icon: key === '__uncategorized' ? 'tag-outline' : CATEGORY_MAP[key].icon,
        color: key === '__uncategorized' ? theme.textTertiary : CATEGORY_MAP[key].color,
        data,
      }));
  }, [habits, theme.textTertiary]);

  const handleArchive = (habit: Habit) => {
    Alert.alert('Archive Habit', `Archive "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: () => archiveHabit(habit.id) },
    ]);
  };

  const renderHabit = ({ item, index }: { item: Habit; index: number }) => {
    const hasReminder = !!item.reminderTime;
    const hasInterval = !!item.reminderIntervalMinutes;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
        <Pressable
          onPress={() => router.push(`/habit/${item.id}`)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.surface },
            pressed && { opacity: 0.85 },
          ]}
        >
          {/* Icon + info */}
          <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
            <MaterialCommunityIcons
              name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={22}
              color={item.color}
            />
          </View>

          <View style={styles.info}>
            <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>

            <View style={styles.detailRow}>
              <View style={[styles.badge, { backgroundColor: item.color + '15' }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>
                  {FREQUENCY_LABELS[item.frequency]}
                </Text>
              </View>

              {item.frequency === Frequency.SPECIFIC_DAYS && item.specificDays && (
                <Text style={[styles.subDetail, { color: theme.textTertiary }]} numberOfLines={1}>
                  {item.specificDays.map(d => DAY_NAMES[d]).join(', ')}
                </Text>
              )}

              {item.frequency === Frequency.X_TIMES_PER_WEEK && item.timesPerWeek && (
                <Text style={[styles.subDetail, { color: theme.textTertiary }]}>
                  {item.timesPerWeek}x/week
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              {item.type === HabitType.QUANTITY && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons name="counter" size={12} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {item.dailyTarget} {item.unit || 'times'}
                  </Text>
                </View>
              )}

              {hasReminder && !hasInterval && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons name="bell-outline" size={12} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.primary }]}>
                    {formatTime(...item.reminderTime!.split(':').map(Number) as [number, number])}
                  </Text>
                </View>
              )}

              {hasInterval && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={12} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.primary }]}>
                    Every {item.reminderIntervalMinutes}min
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push({ pathname: '/habit/edit', params: { id: item.id } })}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => handleArchive(item)}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="archive-outline" size={18} color={theme.textTertiary} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Habits</Text>
        <Pressable
          onPress={() => router.push('/habit/create')}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addText}>New</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderHabit}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name={section.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color={section.color}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textTertiary }]}>
              {section.data.length}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="format-list-checks" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No habits yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
              Create your first habit to get started!
            </Text>
          </View>
        }
      />
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subDetail: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
