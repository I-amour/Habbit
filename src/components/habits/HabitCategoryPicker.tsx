import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { HABIT_CATEGORIES } from '../../constants/categories';

interface HabitCategoryPickerProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function HabitCategoryPicker({ selected, onSelect }: HabitCategoryPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {/* None option */}
        <Pressable
          onPress={() => onSelect(null)}
          style={[
            styles.chip,
            {
              backgroundColor: selected === null ? theme.primary + '20' : theme.surfaceAlt,
              borderColor: selected === null ? theme.primary : theme.border,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: selected === null ? theme.primary : theme.textSecondary }]}>
            None
          </Text>
        </Pressable>

        {HABIT_CATEGORIES.map(cat => {
          const isSelected = selected === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? cat.color + '20' : theme.surfaceAlt,
                  borderColor: isSelected ? cat.color : theme.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={14}
                color={isSelected ? cat.color : theme.textSecondary}
              />
              <Text style={[styles.chipText, { color: isSelected ? cat.color : theme.textSecondary }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
