import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Badge } from '../../models/types';
import { useTheme } from '../../hooks/useTheme';

interface BadgeUnlockModalProps {
  badge: Badge;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={[styles.modal, { backgroundColor: theme.surface }]}
        >
          <Animated.View entering={FadeIn.delay(200)} style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.xp + '30' }]}>
              <MaterialCommunityIcons
                name={badge.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={48}
                color={theme.xp}
              />
            </View>
          </Animated.View>

          <Text style={[styles.congrats, { color: theme.primary }]}>Badge Unlocked!</Text>
          <Text style={[styles.badgeName, { color: theme.text }]}>{badge.name}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {badge.description}
          </Text>

          <Pressable
            onPress={onDismiss}
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
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
  badgeName: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
