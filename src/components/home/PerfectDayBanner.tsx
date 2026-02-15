import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { ConfettiCannon } from '../ui/ConfettiCannon';

interface PerfectDayModalProps {
  visible: boolean;
  onDismiss: () => void;
  completedCount: number;
  bestStreak: number;
}

export function PerfectDayModal({ visible, onDismiss, completedCount, bestStreak }: PerfectDayModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <ConfettiCannon active={true} />
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          style={[styles.modal, { backgroundColor: theme.surface }]}
        >
          <Animated.View entering={FadeIn.delay(200)} style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.success + '20' }]}>
              <MaterialCommunityIcons name="check-decagram" size={48} color={theme.success} />
            </View>
          </Animated.View>

          <Text style={[styles.congrats, { color: theme.success }]}>Perfect Day!</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            All {completedCount} habits completed
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {bestStreak >= 7
              ? `You're on a ${bestStreak}-day streak. Keep it going!`
              : 'Great job staying consistent today!'}
          </Text>

          <Pressable
            onPress={onDismiss}
            style={[styles.button, { backgroundColor: theme.success }]}
          >
            <Text style={styles.buttonText}>Nice!</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modal: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congrats: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
