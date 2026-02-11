import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, subDays, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { getCompletionCountByDate } from '../../db/completionRepository';
import { useHabitStore } from '../../store/habitStore';
import { useCompletionStore } from '../../store/completionStore';

export function CompletionChart() {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const todayCompletions = useCompletionStore(s => s.todayCompletions);
  const [weeklyData, setWeeklyData] = useState<{ label: string; count: number }[]>([]);
  const [bestDay, setBestDay] = useState('');
  const [dailyAvg, setDailyAvg] = useState(0);

  useEffect(() => {
    async function load() {
      const today = new Date();
      const fourWeeksAgo = subWeeks(today, 4);
      const startDate = format(fourWeeksAgo, 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');
      const counts = await getCompletionCountByDate(startDate, endDate);

      // Weekly totals for the bar chart (last 4 weeks)
      const weeks: { label: string; count: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        let total = 0;
        for (const day of days) {
          const dateStr = format(day, 'yyyy-MM-dd');
          total += counts[dateStr] || 0;
        }
        weeks.push({
          label: i === 0 ? 'This wk' : `${i}w ago`,
          count: total,
        });
      }
      setWeeklyData(weeks);

      // Best day of the week
      const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      const last30Start = format(subDays(today, 30), 'yyyy-MM-dd');
      const last30 = await getCompletionCountByDate(last30Start, endDate);
      for (const [dateStr, count] of Object.entries(last30)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dayOfWeek = new Date(y, m - 1, d).getDay();
        dayTotals[dayOfWeek] += count;
        dayCounts[dayOfWeek]++;
      }

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let maxAvg = 0;
      let bestDayIdx = 0;
      for (let i = 0; i < 7; i++) {
        const avg = dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestDayIdx = i;
        }
      }
      setBestDay(dayNames[bestDayIdx]);

      // Daily average (last 30 days)
      const totalCompletions = Object.values(last30).reduce((a, b) => a + b, 0);
      setDailyAvg(Math.round((totalCompletions / 30) * 10) / 10);
    }
    load();
  }, [habits, todayCompletions]);

  const maxCount = Math.max(1, ...weeklyData.map(w => w.count));

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Weekly Trend</Text>

      {/* Bar chart */}
      <View style={styles.chartArea}>
        {weeklyData.map((week, i) => (
          <View key={i} style={styles.barColumn}>
            <Text style={[styles.barValue, { color: theme.textSecondary }]}>
              {week.count}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max(5, (week.count / maxCount) * 100)}%`,
                    backgroundColor: i === weeklyData.length - 1 ? theme.primary : theme.primaryLight,
                    borderRadius: 6,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: theme.textTertiary }]}>{week.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick insights */}
      <View style={styles.insightsRow}>
        <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
          <Text style={[styles.insightValue, { color: theme.primary }]}>{dailyAvg}</Text>
          <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Daily avg</Text>
        </View>
        <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
          <Text style={[styles.insightValue, { color: theme.primary }]} numberOfLines={1}>{bestDay}</Text>
          <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Best day</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  insightCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 2,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
