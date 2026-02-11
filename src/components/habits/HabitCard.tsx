import React, { useEffect } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Habit, HabitType, Frequency } from '../../models/types';
import { Completion } from '../../models/types';
import { HabitCheckbox } from './HabitCheckbox';
import { QuantityInput } from './QuantityInput';
import { NoteInput } from './NoteInput';

interface HabitCardProps {
  habit: Habit;
  completion?: Completion;
  streak: number;
  onToggle: () => void;
  onQuantityChange: (value: number) => void;
  onAddNote?: (note: string) => void;
  onSkipDay?: () => void;
  isSkipped?: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onDrag?: () => void;
  isDragging?: boolean;
}

const FREQUENCY_SHORT: Record<string, string> = {
  [Frequency.DAILY]: 'Daily',
  [Frequency.SPECIFIC_DAYS]: 'Specific days',
  [Frequency.X_TIMES_PER_WEEK]: 'Weekly',
};

export function HabitCard({ habit, completion, streak, onToggle, onQuantityChange, onAddNote, onSkipDay, isSkipped, onArchive, onDelete, onDrag, isDragging }: HabitCardProps) {
  const theme = useTheme();
  const isCompleted = habit.type === HabitType.BOOLEAN
    ? !!completion
    : (completion?.value ?? 0) >= habit.dailyTarget;

  const isAtRisk = streak >= 3 && !isCompleted;

  // Animated pulse for at-risk indicator
  const pulseOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isAtRisk) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isAtRisk]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const handleLongPress = () => {
    if (onDrag) {
      onDrag();
      return;
    }
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      {
        text: 'View Details',
        onPress: () => router.push(`/habit/${habit.id}`),
      },
    ];
    if (onSkipDay && !isCompleted) {
      options.push({
        text: isSkipped ? 'Undo Rest Day' : 'Rest Day (keep streak)',
        onPress: onSkipDay,
      });
    }
    options.push(
      { text: 'Archive', onPress: onArchive },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    );
    Alert.alert(habit.name, undefined, options);
  };

  return (
    <View>
      <Pressable
        onPress={() => router.push(`/habit/${habit.id}`)}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: isCompleted
              ? theme.successLight
              : theme.surface,
            borderColor: isAtRisk
              ? theme.warning + '80'
              : isCompleted
                ? theme.success + '30'
                : theme.border + '80',
          },
          pressed && !isDragging && styles.pressed,
          isDragging && { opacity: 0.9, transform: [{ scale: 1.03 }] },
        ]}
      >
        {/* Left: Icon */}
        <View style={[
          styles.iconWrap,
          { backgroundColor: habit.color + (isCompleted ? '10' : '12') },
        ]}>
          <MaterialCommunityIcons
            name={
              isCompleted
                ? 'check' as keyof typeof MaterialCommunityIcons.glyphMap
                : habit.icon as keyof typeof MaterialCommunityIcons.glyphMap
            }
            size={20}
            color={isCompleted ? theme.success : habit.color}
          />
        </View>

        {/* Center: Name + meta */}
        <View style={styles.content}>
          <Text
            style={[
              styles.name,
              { color: theme.text },
              isCompleted && styles.completedName,
            ]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>

          <View style={styles.metaRow}>
            {/* Category badge */}
            {habit.category && (
              <>
                <Text style={[styles.metaText, { color: theme.textTertiary }]}>
                  {habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}
                </Text>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
              </>
            )}

            {/* Colored dot */}
            <View style={[styles.colorDot, { backgroundColor: habit.color }]} />

            <Text style={[styles.metaText, { color: theme.textTertiary }]}>
              {FREQUENCY_SHORT[habit.frequency]}
            </Text>

            {streak > 0 && (
              <>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                {isAtRisk ? (
                  <Animated.View style={[styles.streakRow, pulseStyle]}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={12}
                      color={theme.warning}
                    />
                    <Text style={[styles.streakText, { color: theme.warning }]}>
                      {streak}
                    </Text>
                  </Animated.View>
                ) : (
                  <View style={styles.streakRow}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={12}
                      color={theme.streak}
                    />
                    <Text style={[styles.streakText, { color: theme.streak }]}>
                      {streak}
                    </Text>
                  </View>
                )}
              </>
            )}

            {isAtRisk && (
              <>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                <View style={[styles.riskBadge, { backgroundColor: theme.warning + '20' }]}>
                  <MaterialCommunityIcons name="alert" size={10} color={theme.warning} />
                  <Text style={[styles.atRiskText, { color: theme.warning }]}>at risk</Text>
                </View>
              </>
            )}

            {isSkipped && !isCompleted && (
              <>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                <View style={[styles.riskBadge, { backgroundColor: theme.surfaceAlt }]}>
                  <MaterialCommunityIcons name="sleep" size={10} color={theme.textTertiary} />
                  <Text style={[styles.atRiskText, { color: theme.textTertiary }]}>rest day</Text>
                </View>
              </>
            )}

            {isCompleted && onAddNote && (
              <>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                <NoteInput
                  habitName={habit.name}
                  currentNote={completion?.note}
                  onSave={onAddNote}
                />
              </>
            )}
          </View>
        </View>

        {/* Right: Action */}
        <Pressable onPress={() => {}} style={styles.actionArea}>
          {habit.type === HabitType.BOOLEAN ? (
            <HabitCheckbox
              checked={!!completion}
              color={habit.color}
              onToggle={onToggle}
              streak={streak}
            />
          ) : (
            <QuantityInput
              value={completion?.value ?? 0}
              target={habit.dailyTarget}
              unit={habit.unit}
              color={habit.color}
              onChange={onQuantityChange}
            />
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  completedName: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 10,
    marginHorizontal: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  atRiskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionArea: {
    marginLeft: 2,
  },
});
