import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface MotivationalNudgeProps {
  completed: number;
  total: number;
  bestStreak: number;
}

export function MotivationalNudge({ completed, total, bestStreak }: MotivationalNudgeProps) {
  const theme = useTheme();

  const getMessage = (): { text: string; icon: string } => {
    if (total === 0) return { text: 'Create your first habit to get started!', icon: 'plus-circle' };
    if (completed === total) return { text: 'All done! Amazing day!', icon: 'party-popper' };
    if (completed === 0) return { text: "Let's make today count!", icon: 'rocket-launch' };

    const remaining = total - completed;
    if (remaining === 1) return { text: 'Just 1 more to go!', icon: 'fire' };
    if (completed >= total / 2) return { text: `Almost there! ${remaining} left`, icon: 'lightning-bolt' };
    return { text: `${remaining} habits waiting for you`, icon: 'hand-wave' };
  };

  const { text, icon } = getMessage();

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceAlt }]}>
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={20}
        color={theme.primary}
      />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{text}</Text>
      {bestStreak > 0 && (
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={14} color={theme.streak} />
          <Text style={[styles.streakText, { color: theme.streak }]}>{bestStreak}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
