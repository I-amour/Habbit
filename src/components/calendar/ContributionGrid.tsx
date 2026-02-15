import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { getCompletionCountByDate } from '../../db/completionRepository';
import { useHabitStore } from '../../store/habitStore';

interface ContributionGridProps {
  onDayPress: (date: string) => void;
  weeks?: number;
}

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

export function ContributionGrid({ onDayPress, weeks = 16 }: ContributionGridProps) {
  const theme = useTheme();
  const habits = useHabitStore(s => s.habits);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const totalHabits = habits.length || 1;

  const screenWidth = Dimensions.get('window').width - 48; // minus padding + safety buffer
  const labelWidth = 20;
  const availableWidth = screenWidth - labelWidth;
  const cellGap = 3;
  const cellSize = Math.floor((availableWidth - cellGap * (weeks - 1)) / weeks);
  const totalDays = weeks * 7;

  useEffect(() => {
    async function load() {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), totalDays), 'yyyy-MM-dd');
      const counts = await getCompletionCountByDate(startDate, endDate);
      setDayCounts(counts);
    }
    load();
  }, [habits]);

  const today = new Date();
  const gridStart = startOfWeek(subDays(today, (weeks - 1) * 7), { weekStartsOn: 0 });

  const getColorForRatio = (ratio: number): string => {
    if (ratio <= 0) return theme.grid0;
    if (ratio <= 0.25) return theme.grid1;
    if (ratio <= 0.5) return theme.grid2;
    if (ratio <= 0.75) return theme.grid3;
    return theme.grid4;
  };

  const gridWidth = weeks * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);

  // Month labels - prevent overlap by requiring minimum gap
  const monthLabels: { text: string; x: number }[] = [];
  let lastMonth = -1;
  let lastLabelX = -50;
  const minLabelGap = 36;
  for (let w = 0; w < weeks; w++) {
    const weekDate = addDays(gridStart, w * 7);
    const month = weekDate.getMonth();
    const x = w * (cellSize + cellGap);
    if (month !== lastMonth && x - lastLabelX >= minLabelGap) {
      monthLabels.push({ text: format(weekDate, 'MMM'), x });
      lastMonth = month;
      lastLabelX = x;
    } else if (month !== lastMonth) {
      lastMonth = month;
    }
  }

  return (
    <View style={styles.container}>
      {/* Month labels row */}
      <View style={[styles.monthRow, { marginLeft: labelWidth }]}>
        {monthLabels.map((label, i) => (
          <Text
            key={i}
            style={[styles.monthLabel, { color: theme.textTertiary, left: label.x }]}
          >
            {label.text}
          </Text>
        ))}
      </View>

      {/* Grid with day labels */}
      <View style={styles.gridRow}>
        {/* Day-of-week labels */}
        <View style={[styles.dayLabels, { height: gridHeight }]}>
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={[styles.dayLabelCell, { height: cellSize + cellGap }]}>
              <Text style={[styles.dayLabelText, { color: theme.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* SVG Grid */}
        <Pressable>
          <Svg width={gridWidth} height={gridHeight}>
            {Array.from({ length: weeks }).map((_, w) =>
              Array.from({ length: 7 }).map((_, d) => {
                const date = addDays(gridStart, w * 7 + d);
                const dateStr = format(date, 'yyyy-MM-dd');
                const count = dayCounts[dateStr] || 0;
                const ratio = count / totalHabits;
                const isFuture = date > today;

                if (isFuture) return null;

                return (
                  <Rect
                    key={dateStr}
                    x={w * (cellSize + cellGap)}
                    y={d * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={3}
                    fill={getColorForRatio(ratio)}
                    onPress={() => onDayPress(dateStr)}
                  />
                );
              })
            )}
          </Svg>
        </Pressable>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>Less</Text>
        {[theme.grid0, theme.grid1, theme.grid2, theme.grid3, theme.grid4].map((color, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  monthRow: {
    height: 18,
    position: 'relative',
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dayLabels: {
    width: 20,
    justifyContent: 'space-around',
  },
  dayLabelCell: {
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
