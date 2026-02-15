import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ completed, total, size = 80, strokeWidth = 8 }: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const isPerfect = progress >= 1;

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isPerfect) {
      // Single gentle pop then settle — not infinite pulsing
      pulseScale.value = withDelay(200, withSequence(
        withSpring(1.06, { damping: 8, stiffness: 150 }),
        withSpring(1, { damping: 12, stiffness: 120 }),
      ));
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isPerfect]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withSpring(circumference * (1 - progress), {
      damping: 15,
      stiffness: 100,
    }),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress >= 1 ? theme.success : theme.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        {isPerfect ? (
          <Text style={[styles.perfectIcon]}>✓</Text>
        ) : (
          <Text style={[styles.count, { color: theme.text }]}>
            {completed}/{total}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
  },
  perfectIcon: {
    fontSize: 24,
    color: '#2ECC71',
  },
});
