import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface QuantityInputProps {
  value: number;
  target: number;
  unit?: string;
  color: string;
  onChange: (value: number) => void;
}

export function QuantityInput({ value, target, unit, color, onChange }: QuantityInputProps) {
  const theme = useTheme();
  const isComplete = value >= target;

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleDecrement} style={[styles.button, { borderColor: theme.border }]}>
        <MaterialCommunityIcons name="minus" size={18} color={theme.textSecondary} />
      </Pressable>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: isComplete ? color : theme.text }]}>
          {value}
        </Text>
        <Text style={[styles.target, { color: theme.textTertiary }]}>
          /{target}{unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <Pressable onPress={handleIncrement} style={[styles.button, { borderColor: theme.border }]}>
        <MaterialCommunityIcons name="plus" size={18} color={color} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 40,
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  target: {
    fontSize: 12,
    fontWeight: '500',
  },
});
