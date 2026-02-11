import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../src/hooks/useTheme';
import { useHabitStore } from '../../src/store/habitStore';
import { HabitIconPicker } from '../../src/components/habits/HabitIconPicker';
import { HabitColorPicker } from '../../src/components/habits/HabitColorPicker';
import { HabitCategoryPicker } from '../../src/components/habits/HabitCategoryPicker';
import { Frequency, HabitType } from '../../src/models/types';
import { scheduleHabitReminder, scheduleIntervalReminders, cancelHabitReminder, formatTime } from '../../src/utils/notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EditHabitScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habits = useHabitStore(s => s.habits);
  const updateHabit = useHabitStore(s => s.updateHabit);

  const habit = habits.find(h => h.id === id);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [color, setColor] = useState('#FF6B47');
  const [type, setType] = useState<HabitType>(HabitType.BOOLEAN);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.DAILY);
  const [specificDays, setSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [dailyTarget, setDailyTarget] = useState(1);
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMode, setReminderMode] = useState<'once' | 'interval'>('once');
  const [reminderDate, setReminderDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [intervalStartHour, setIntervalStartHour] = useState(8);
  const [intervalEndHour, setIntervalEndHour] = useState(22);

  // Pre-populate from existing habit
  useEffect(() => {
    if (!habit) return;
    setName(habit.name);
    setIcon(habit.icon);
    setColor(habit.color);
    setType(habit.type);
    setFrequency(habit.frequency);
    if (habit.specificDays) setSpecificDays(habit.specificDays);
    if (habit.timesPerWeek) setTimesPerWeek(habit.timesPerWeek);
    setDailyTarget(habit.dailyTarget);
    if (habit.unit) setUnit(habit.unit);
    if (habit.category) setCategory(habit.category);
    if (habit.reminderIntervalMinutes) {
      setReminderEnabled(true);
      setReminderMode('interval');
      setIntervalMinutes(habit.reminderIntervalMinutes);
      if (habit.reminderStartHour != null) setIntervalStartHour(habit.reminderStartHour);
      if (habit.reminderEndHour != null) setIntervalEndHour(habit.reminderEndHour);
    } else if (habit.reminderTime) {
      setReminderEnabled(true);
      setReminderMode('once');
      const [h, m] = habit.reminderTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setReminderDate(d);
    }
  }, [habit]);

  const canSave = name.trim().length > 0;

  const reminderTimeString = reminderEnabled
    ? `${reminderDate.getHours().toString().padStart(2, '0')}:${reminderDate.getMinutes().toString().padStart(2, '0')}`
    : null;

  const handleSave = async () => {
    if (!canSave || !id) return;
    const isInterval = reminderEnabled && reminderMode === 'interval';
    const updates = {
      name: name.trim(),
      icon,
      color,
      type,
      frequency,
      specificDays: frequency === Frequency.SPECIFIC_DAYS ? specificDays : undefined,
      timesPerWeek: frequency === Frequency.X_TIMES_PER_WEEK ? timesPerWeek : undefined,
      dailyTarget: type === HabitType.QUANTITY ? dailyTarget : 1,
      unit: type === HabitType.QUANTITY ? unit || undefined : undefined,
      reminderTime: reminderEnabled && reminderMode === 'once' ? reminderTimeString : null,
      category,
      reminderIntervalMinutes: isInterval ? intervalMinutes : null,
      reminderStartHour: isInterval ? intervalStartHour : null,
      reminderEndHour: isInterval ? intervalEndHour : null,
    };
    await updateHabit(id, updates);

    // Update notifications
    if (isInterval) {
      const updatedHabit = { ...habit!, ...updates };
      await scheduleIntervalReminders(updatedHabit);
    } else if (reminderTimeString && reminderMode === 'once') {
      const updatedHabit = { ...habit!, ...updates, reminderTime: reminderTimeString };
      await scheduleHabitReminder(updatedHabit);
    } else {
      await cancelHabitReminder(id);
    }

    router.back();
  };

  const toggleDay = (day: number) => {
    setSpecificDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setReminderDate(date);
    }
  };

  if (!habit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Edit Habit</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveButton, { backgroundColor: canSave ? color : theme.border }]}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Drink water, Read 20 min"
              placeholderTextColor={theme.textTertiary}
              maxLength={40}
            />
          </View>

          {/* Icon picker */}
          <HabitIconPicker selected={icon} color={color} onSelect={setIcon} />

          {/* Color picker */}
          <HabitColorPicker selected={color} onSelect={setColor} />

          {/* Category */}
          <HabitCategoryPicker selected={category} onSelect={setCategory} />

          {/* Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setType(HabitType.BOOLEAN)}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: type === HabitType.BOOLEAN ? color + '20' : theme.surfaceAlt,
                    borderColor: type === HabitType.BOOLEAN ? color : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name="check" size={18} color={type === HabitType.BOOLEAN ? color : theme.textSecondary} />
                <Text style={[styles.toggleText, { color: type === HabitType.BOOLEAN ? color : theme.textSecondary }]}>
                  Yes / No
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType(HabitType.QUANTITY)}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: type === HabitType.QUANTITY ? color + '20' : theme.surfaceAlt,
                    borderColor: type === HabitType.QUANTITY ? color : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name="counter" size={18} color={type === HabitType.QUANTITY ? color : theme.textSecondary} />
                <Text style={[styles.toggleText, { color: type === HabitType.QUANTITY ? color : theme.textSecondary }]}>
                  Quantity
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quantity fields */}
          {type === HabitType.QUANTITY && (
            <View style={styles.quantityRow}>
              <View style={styles.quantityField}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Target</Text>
                <TextInput
                  style={[styles.input, styles.smallInput, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  value={dailyTarget.toString()}
                  onChangeText={t => setDailyTarget(Math.max(1, parseInt(t) || 1))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.quantityField, styles.flex]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Unit</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="glasses, minutes, pages"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>
          )}

          {/* Frequency */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
            {[
              { value: Frequency.DAILY, label: 'Every day', icon: 'calendar-today' as const },
              { value: Frequency.SPECIFIC_DAYS, label: 'Specific days', icon: 'calendar-week' as const },
              { value: Frequency.X_TIMES_PER_WEEK, label: 'X times per week', icon: 'calendar-refresh' as const },
            ].map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => setFrequency(opt.value)}
                style={[
                  styles.frequencyOption,
                  {
                    backgroundColor: frequency === opt.value ? color + '15' : theme.surfaceAlt,
                    borderColor: frequency === opt.value ? color : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={20}
                  color={frequency === opt.value ? color : theme.textSecondary}
                />
                <Text style={[
                  styles.frequencyText,
                  { color: frequency === opt.value ? color : theme.text },
                ]}>
                  {opt.label}
                </Text>
                {frequency === opt.value && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={color} style={styles.checkIcon} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Specific days selector */}
          {frequency === Frequency.SPECIFIC_DAYS && (
            <View style={styles.daysRow}>
              {DAYS.map((label, i) => (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: specificDays.includes(i) ? color : theme.surfaceAlt,
                      borderColor: specificDays.includes(i) ? color : theme.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: specificDays.includes(i) ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* X times per week */}
          {frequency === Frequency.X_TIMES_PER_WEEK && (
            <View style={styles.timesRow}>
              <Pressable
                onPress={() => setTimesPerWeek(Math.max(1, timesPerWeek - 1))}
                style={[styles.timesButton, { borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="minus" size={20} color={theme.textSecondary} />
              </Pressable>
              <Text style={[styles.timesText, { color: theme.text }]}>
                {timesPerWeek}x per week
              </Text>
              <Pressable
                onPress={() => setTimesPerWeek(Math.min(7, timesPerWeek + 1))}
                style={[styles.timesButton, { borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="plus" size={20} color={color} />
              </Pressable>
            </View>
          )}

          {/* Reminder */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Reminder</Text>

            {/* Enable / mode toggle */}
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => {
                  if (reminderEnabled && reminderMode === 'once') {
                    setReminderEnabled(false);
                    setShowTimePicker(false);
                  } else {
                    setReminderEnabled(true);
                    setReminderMode('once');
                    setShowTimePicker(true);
                  }
                }}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: reminderEnabled && reminderMode === 'once' ? color + '20' : theme.surfaceAlt,
                    borderColor: reminderEnabled && reminderMode === 'once' ? color : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={16}
                  color={reminderEnabled && reminderMode === 'once' ? color : theme.textSecondary}
                />
                <Text style={[styles.toggleText, { color: reminderEnabled && reminderMode === 'once' ? color : theme.textSecondary }]}>
                  Once daily
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (reminderEnabled && reminderMode === 'interval') {
                    setReminderEnabled(false);
                    setShowTimePicker(false);
                  } else {
                    setReminderEnabled(true);
                    setReminderMode('interval');
                    setShowTimePicker(false);
                  }
                }}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: reminderEnabled && reminderMode === 'interval' ? color + '20' : theme.surfaceAlt,
                    borderColor: reminderEnabled && reminderMode === 'interval' ? color : theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={16}
                  color={reminderEnabled && reminderMode === 'interval' ? color : theme.textSecondary}
                />
                <Text style={[styles.toggleText, { color: reminderEnabled && reminderMode === 'interval' ? color : theme.textSecondary }]}>
                  Recurring
                </Text>
              </Pressable>
            </View>

            {/* Once daily: time picker */}
            {reminderEnabled && reminderMode === 'once' && (
              <>
                <Pressable
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  style={[
                    styles.reminderRow,
                    {
                      backgroundColor: color + '15',
                      borderColor: color,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color={color} />
                  <Text style={[styles.reminderText, { color }]}>
                    {formatTime(reminderDate.getHours(), reminderDate.getMinutes())}
                  </Text>
                  <Pressable
                    onPress={() => { setReminderEnabled(false); setShowTimePicker(false); }}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color={theme.textTertiary} />
                  </Pressable>
                </Pressable>

                {showTimePicker && (
                  <DateTimePicker
                    value={reminderDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    minuteInterval={5}
                    accentColor={color}
                  />
                )}
              </>
            )}

            {/* Interval: frequency + hours */}
            {reminderEnabled && reminderMode === 'interval' && (
              <View style={[styles.intervalCard, { backgroundColor: color + '08', borderColor: color }]}>
                <Text style={[styles.intervalLabel, { color: theme.textSecondary }]}>Remind every</Text>
                <View style={styles.timesRow}>
                  <Pressable
                    onPress={() => setIntervalMinutes(Math.max(10, intervalMinutes - 5))}
                    style={[styles.timesButton, { borderColor: theme.border }]}
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={theme.textSecondary} />
                  </Pressable>
                  <Text style={[styles.timesText, { color: theme.text }]}>
                    {intervalMinutes} min
                  </Text>
                  <Pressable
                    onPress={() => setIntervalMinutes(Math.min(180, intervalMinutes + 5))}
                    style={[styles.timesButton, { borderColor: theme.border }]}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={color} />
                  </Pressable>
                </View>

                <Text style={[styles.intervalLabel, { color: theme.textSecondary, marginTop: 10 }]}>Active hours</Text>
                <View style={styles.hoursRow}>
                  <View style={styles.hourField}>
                    <Pressable
                      onPress={() => setIntervalStartHour(Math.max(0, intervalStartHour - 1))}
                      style={[styles.hourBtn, { borderColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name="minus" size={16} color={theme.textSecondary} />
                    </Pressable>
                    <Text style={[styles.hourText, { color: theme.text }]}>
                      {formatTime(intervalStartHour, 0)}
                    </Text>
                    <Pressable
                      onPress={() => setIntervalStartHour(Math.min(intervalEndHour - 1, intervalStartHour + 1))}
                      style={[styles.hourBtn, { borderColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color={color} />
                    </Pressable>
                  </View>

                  <Text style={[styles.toText, { color: theme.textTertiary }]}>to</Text>

                  <View style={styles.hourField}>
                    <Pressable
                      onPress={() => setIntervalEndHour(Math.max(intervalStartHour + 1, intervalEndHour - 1))}
                      style={[styles.hourBtn, { borderColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name="minus" size={16} color={theme.textSecondary} />
                    </Pressable>
                    <Text style={[styles.hourText, { color: theme.text }]}>
                      {formatTime(intervalEndHour, 0)}
                    </Text>
                    <Pressable
                      onPress={() => setIntervalEndHour(Math.min(23, intervalEndHour + 1))}
                      style={[styles.hourBtn, { borderColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color={color} />
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.intervalSummary, { color: theme.textTertiary }]}>
                  {Math.floor(((intervalEndHour - intervalStartHour) * 60) / intervalMinutes) + 1} reminders per day
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallInput: {
    width: 80,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 6,
    gap: 10,
  },
  frequencyText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timesText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityField: {
    gap: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  reminderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  intervalCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  intervalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  hourField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'center',
  },
  toText: {
    fontSize: 13,
    fontWeight: '500',
  },
  intervalSummary: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
});
