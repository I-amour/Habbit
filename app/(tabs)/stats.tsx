import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { XPBar } from '../../src/components/gamification/XPBar';
import { WeeklySummary } from '../../src/components/gamification/WeeklySummary';
import { BadgeCard } from '../../src/components/gamification/BadgeCard';

const BADGE_COLUMNS = 4;
const BADGE_GAP = 8;
const SCREEN_PADDING = 20;

export default function StatsScreen() {
  const theme = useTheme();
  const profile = useGamificationStore(s => s.profile);
  const badges = useGamificationStore(s => s.badges);

  const screenWidth = Dimensions.get('window').width;
  const badgeWidth = (screenWidth - SCREEN_PADDING * 2 - BADGE_GAP * (BADGE_COLUMNS - 1)) / BADGE_COLUMNS;

  const statCards = [
    { label: 'Total Completed', value: profile.totalCompletions, icon: 'check-all', color: theme.success },
    { label: 'Longest Streak', value: profile.longestStreakEver, icon: 'fire', color: theme.streak },
    { label: 'Level', value: profile.level, icon: 'star-four-points', color: theme.xp },
    { label: 'This Week', value: profile.weeklyCompletions, icon: 'calendar-week', color: theme.primary },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Stats</Text>

        {/* Quick stats grid */}
        <View style={styles.statsGrid}>
          {statCards.map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons
                name={stat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={22}
                color={stat.color}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* XP bar */}
        <XPBar totalXP={profile.totalXP} />

        {/* Weekly summary */}
        <WeeklySummary />

        {/* Badges */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Badges ({badges.filter(b => b.unlockedAt !== null && b.unlockedAt !== undefined).length}/{badges.length})
        </Text>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} width={badgeWidth} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    paddingTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BADGE_GAP,
  },
});
