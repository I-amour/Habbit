import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getXPProgress } from '../../constants/xp';

interface XPBarProps {
  totalXP: number;
}

export function XPBar({ totalXP }: XPBarProps) {
  const theme = useTheme();
  const { current, needed, level } = getXPProgress(totalXP);
  const progress = needed > 0 ? Math.min(current / needed, 1) : 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.levelRow}>
        <View style={[styles.levelBadge, { backgroundColor: theme.xp + '25' }]}>
          <MaterialCommunityIcons name="star-four-points" size={18} color={theme.xp} />
          <Text style={[styles.levelText, { color: theme.xp }]}>Level {level}</Text>
        </View>
        <Text style={[styles.xpText, { color: theme.textSecondary }]}>
          {totalXP.toLocaleString()} XP
        </Text>
      </View>

      <View style={[styles.barBackground, { backgroundColor: theme.surfaceAlt }]}>
        <View
          style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: theme.xp }]}
        />
      </View>

      {needed > 0 && (
        <Text style={[styles.progressText, { color: theme.textTertiary }]}>
          {current} / {needed} XP to Level {level + 1}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 15,
    fontWeight: '800',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
