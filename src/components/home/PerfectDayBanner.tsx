import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface PerfectDayBannerProps {
  visible: boolean;
}

export function PerfectDayBanner({ visible }: PerfectDayBannerProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: theme.success + '14', borderColor: theme.success + '30' }]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name="check-circle" size={18} color={theme.success} />
        <Text style={[styles.text, { color: theme.success }]}>All done for today!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
