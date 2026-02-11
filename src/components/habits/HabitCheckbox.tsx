import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedIcon = Animated.createAnimatedComponent(
  MaterialCommunityIcons as React.ComponentType<any>
);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
  } else if (next === 7 || next === 14 || next === 21) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
  } else if (next >= 3) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function HabitCheckbox({ checked, color, onToggle, size = 32, streak = 0 }: HabitCheckboxProps) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(checked ? 1 : 0);
  const checkScale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked) {
      fill.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      checkScale.value = withDelay(
        120,
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
      fill.value = withDelay(
        80,
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
      );
    }
  }, [checked]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.85, { duration: 120, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    triggerMilestoneHaptic(streak, checked);
    onToggle();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      fill.value,
      [0, 1],
      ['transparent', color]
    ),
    borderColor: interpolateColor(
      fill.value,
      [0, 1],
      ['#D1D5DB', color]
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
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
          },
          containerStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <MaterialCommunityIcons name="check" size={size * 0.6} color="#FFFFFF" />
        </Animated.View>
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
