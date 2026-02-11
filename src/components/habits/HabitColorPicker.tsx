import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { HABIT_COLORS } from '../../constants/colors';

interface HabitColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function HabitColorPicker({ selected, onSelect }: HabitColorPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
      <View style={styles.row}>
        {HABIT_COLORS.map(color => {
          const isSelected = color === selected;
          return (
            <Pressable
              key={color}
              onPress={() => onSelect(color)}
              style={[
                styles.colorButton,
                {
                  backgroundColor: color,
                  borderColor: isSelected ? theme.text : 'transparent',
                },
              ]}
            >
              {isSelected && (
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
