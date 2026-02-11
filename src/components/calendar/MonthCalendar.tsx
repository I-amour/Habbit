import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isToday, isFuture,
} from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { getCompletionCountByDate } from '../../db/completionRepository';
import { useHabitStore } from '../../store/habitStore';
import { useCompletionStore } from '../../store/completionStore';

interface MonthCalendarProps {
  onDayPress: (date: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 6 * 4) / 7); // 7 cols with gaps

export function MonthCalendar({ onDayPress }: MonthCalendarProps) {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const todayCompletions = useCompletionStore(s => s.todayCompletions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const totalHabits = habits.length || 1;

  useEffect(() => {
    async function load() {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const counts = await getCompletionCountByDate(start, end);
      setDayCounts(counts);
    }
    load();
  }, [currentMonth, habits, todayCompletions]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getColorForRatio = (ratio: number): string => {
    if (ratio <= 0) return 'transparent';
    if (ratio <= 0.25) return theme.grid1;
    if (ratio <= 0.5) return theme.grid2;
    if (ratio <= 0.75) return theme.grid3;
    return theme.grid4;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Month navigation */}
      <View style={styles.header}>
        <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.text }]}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Day name headers */}
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map(name => (
          <View key={name} style={[styles.dayNameCell, { width: CELL_SIZE }]}>
            <Text style={[styles.dayNameText, { color: theme.textTertiary }]}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.dayCell, { width: CELL_SIZE, height: CELL_SIZE }]} />
        ))}

        {/* Actual day cells */}
        {daysInMonth.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const count = dayCounts[dateStr] || 0;
          const ratio = count / totalHabits;
          const color = getColorForRatio(ratio);
          const today = isToday(date);
          const future = isFuture(date);

          return (
            <Pressable
              key={dateStr}
              onPress={() => !future && onDayPress(dateStr)}
              style={[
                styles.dayCell,
                { width: CELL_SIZE, height: CELL_SIZE },
                color !== 'transparent' && { backgroundColor: color },
                today && { borderWidth: 2, borderColor: theme.primary },
                future && { opacity: 0.3 },
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: ratio > 0.5 ? '#FFFFFF' : theme.text },
                  today && { fontWeight: '800' },
                ]}
              >
                {format(date, 'd')}
              </Text>
              {count > 0 && !future && (
                <Text style={[styles.dayCount, { color: ratio > 0.5 ? '#FFFFFF' : theme.textTertiary }]}>
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  dayNameCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayCount: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: -1,
  },
});
