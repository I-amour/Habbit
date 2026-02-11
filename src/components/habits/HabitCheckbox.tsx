import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HabitCheckboxProps {
  checked: boolean;
  color: string;
  onToggle: () => void;
  size?: number;
  streak?: number;
}

function triggerMilestoneHaptic(streak: number, wasChecked: boolean) {
  if (wasChecked) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return;
  }
  const next = streak + 1;
  if (next === 30 || next === 100 || next === 365) {
    // Major milestones: success notification + double heavy
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
  } else if (next === 7 || next === 14 || next === 21) {
    // Weekly milestones: double tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
  } else if (next >= 3) {
    // Active streak: heavy
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function HabitCheckbox({ checked, color, onToggle, size = 32, streak = 0 }: HabitCheckboxProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 300 })
    );
    triggerMilestoneHaptic(streak, checked);
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: checked ? color : 'transparent',
            borderColor: checked ? color : '#D1D5DB',
          },
          animatedStyle,
        ]}
      >
        {checked && (
          <MaterialCommunityIcons name="check" size={size * 0.6} color="#FFFFFF" />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
