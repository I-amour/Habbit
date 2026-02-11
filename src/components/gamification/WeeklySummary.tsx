import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, subDays } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { getCompletionCountByDate } from '../../db/completionRepository';
import { getPastDays } from '../../utils/dates';

export function WeeklySummary() {
  const theme = useTheme();
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const days = getPastDays(7);
      const counts = await getCompletionCountByDate(days[0], days[days.length - 1]);
      setDayCounts(counts);
    }
    load();
  }, []);

  const days = getPastDays(7);
  const maxCount = Math.max(1, ...Object.values(dayCounts));
  const totalWeek = Object.values(dayCounts).reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>This Week</Text>
      <Text style={[styles.total, { color: theme.textSecondary }]}>
        {totalWeek} habit{totalWeek !== 1 ? 's' : ''} completed
      </Text>

      <View style={styles.chartRow}>
        {days.map(day => {
          const count = dayCounts[day] || 0;
          const height = maxCount > 0 ? (count / maxCount) * 80 : 0;
          const dayLabel = format(new Date(day + 'T12:00:00'), 'EEE').charAt(0);
          const isToday = day === days[days.length - 1];

          return (
            <View key={day} style={styles.barColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, height),
                      backgroundColor: isToday ? theme.primary : theme.primaryLight,
                      borderRadius: 4,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.dayLabel,
                { color: isToday ? theme.primary : theme.textTertiary },
              ]}>
                {dayLabel}
              </Text>
              {count > 0 && (
                <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                  {count}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  total: {
    fontSize: 13,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
