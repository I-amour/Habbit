import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface NoteInputProps {
  habitName: string;
  currentNote?: string | null;
  onSave: (note: string) => void;
}

export function NoteInput({ habitName, currentNote, onSave }: NoteInputProps) {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState(currentNote || '');

  const handleSave = () => {
    if (note.trim()) {
      onSave(note.trim());
    }
    setShowModal(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setNote(currentNote || '');
          setShowModal(true);
        }}
        hitSlop={6}
      >
        {currentNote ? (
          <Animated.View entering={FadeIn.duration(200)} style={[styles.noteBadge, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialCommunityIcons name="note-text" size={10} color={theme.textSecondary} />
            <Text style={[styles.notePreview, { color: theme.textSecondary }]} numberOfLines={1}>
              {currentNote}
            </Text>
          </Animated.View>
        ) : (
          <MaterialCommunityIcons name="note-plus-outline" size={14} color={theme.textTertiary} />
        )}
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Note for {habitName}
            </Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g., Ran 5k in the park"
              placeholderTextColor={theme.textTertiary}
              multiline
              maxLength={200}
              autoFocus
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 100,
  },
  notePreview: {
    fontSize: 9,
    fontWeight: '500',
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modal: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
