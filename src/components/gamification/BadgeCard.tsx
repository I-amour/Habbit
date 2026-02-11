import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge } from '../../models/types';
import { useTheme } from '../../hooks/useTheme';

interface BadgeCardProps {
  badge: Badge;
  width: number;
}

export function BadgeCard({ badge, width }: BadgeCardProps) {
  const theme = useTheme();
  const isUnlocked = badge.unlockedAt !== null && badge.unlockedAt !== undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, width, opacity: isUnlocked ? 1 : 0.45 }]}>
      <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? theme.xp + '25' : theme.surfaceAlt }]}>
        <MaterialCommunityIcons
          name={isUnlocked ? badge.icon as keyof typeof MaterialCommunityIcons.glyphMap : 'lock'}
          size={20}
          color={isUnlocked ? theme.xp : theme.textTertiary}
        />
      </View>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {isUnlocked ? badge.name : '???'}
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});
