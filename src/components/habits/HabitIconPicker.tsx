import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { HABIT_ICONS } from '../../constants/icons';

interface HabitIconPickerProps {
  selected: string;
  color: string;
  onSelect: (icon: string) => void;
}

export function HabitIconPicker({ selected, color, onSelect }: HabitIconPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Icon</Text>
      <ScrollView horizontal={false} style={styles.grid}>
        <View style={styles.gridInner}>
          {HABIT_ICONS.map(icon => {
            const isSelected = icon.key === selected;
            return (
              <Pressable
                key={icon.key}
                onPress={() => onSelect(icon.key)}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isSelected ? color + '20' : theme.surfaceAlt,
                    borderColor: isSelected ? color : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon.key as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={24}
                  color={isSelected ? color : theme.textSecondary}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  grid: {
    maxHeight: 180,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
