import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface PerfectDayBannerProps {
  visible: boolean;
}

export function PerfectDayBanner({ visible }: PerfectDayBannerProps) {
  const theme = useTheme();
  const glow = useSharedValue(0.6);

  React.useEffect(() => {
    if (visible) {
      glow.value = withDelay(300, withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true
      ));
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(14).delay(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: theme.success }]}
    >
      <Animated.View style={[styles.glowBg, glowStyle]} />
      <View style={styles.row}>
        <MaterialCommunityIcons name="star-four-points" size={20} color="#FFFFFF" />
        <Text style={styles.text}>Perfect Day!</Text>
        <MaterialCommunityIcons name="star-four-points" size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.subtext}>All habits completed today</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
