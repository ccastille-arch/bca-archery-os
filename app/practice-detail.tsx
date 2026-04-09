import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getPracticeLogs, savePracticeLog, deletePracticeLog } from '../lib/storage';
import EquipmentPicker from '../components/EquipmentPicker';
import AnimatedEntry from '../components/AnimatedEntry';
import type { PracticeLog } from '../lib/types';
import { PRACTICE_DRILLS } from '../lib/types';

export default function PracticeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [duration, setDuration] = useState('');
  const [totalArrows, setTotalArrows] = useState('');
  const [bowConfigId, setBowConfigId] = useState<string | undefined>();
  const [arrowConfigId, setArrowConfigId] = useState<string | undefined>();
  const [drills, setDrills] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [conditions, setConditions] = useState('');
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (id) loadPractice();
  }, [id]);

  const loadPractice = async () => {
    const all = await getPracticeLogs();
    const practice = all.find((p) => p.id === id);
    if (practice) {
      setDuration(String(practice.duration));
      setTotalArrows(String(practice.totalArrows));
      setBowConfigId(practice.bowConfigId);
      setArrowConfigId(practice.arrowConfigId);
      setDrills(practice.drills);
      setGoals(practice.goals);
      setConditions(practice.conditions);
      setRating(practice.rating);
      setNotes(practice.notes);
    }
  };

  const toggleDrill = (drill: string) => {
    setDrills((prev) =>
      prev.includes(drill) ? prev.filter((d) => d !== drill) : [...prev, drill]
    );
  };

  const handleSave = async () => {
    const durationNum = parseInt(duration, 10);
    if (!durationNum || durationNum <= 0) {
      Alert.alert('Required', 'Please enter a valid duration.');
      return;
    }

    const practice: PracticeLog = {
      id: id || (uuid.v4() as string),
      date: new Date().toISOString(),
      duration: durationNum,
      totalArrows: parseInt(totalArrows, 10) || 0,
      bowConfigId,
      arrowConfigId,
      drills,
      goals: goals.trim(),
      conditions: conditions.trim(),
      rating,
      notes: notes.trim(),
    };

    // If editing, preserve the original date
    if (id) {
      const all = await getPracticeLogs();
      const existing = all.find((p) => p.id === id);
      if (existing) practice.date = existing.date;
    }

    await savePracticeLog(practice);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Practice', 'Are you sure you want to delete this practice log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePracticeLog(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT PRACTICE' : 'LOG PRACTICE',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: isEditing
            ? () => (
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash" size={22} color={colors.danger} />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Duration */}
        <AnimatedEntry>
          <Text style={styles.label}>DURATION (MINUTES)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g., 60"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </AnimatedEntry>

        {/* Total Arrows */}
        <AnimatedEntry delay={40}>
          <Text style={styles.label}>TOTAL ARROWS SHOT</Text>
          <TextInput
            style={styles.input}
            value={totalArrows}
            onChangeText={setTotalArrows}
            placeholder="e.g., 120"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </AnimatedEntry>

        {/* Equipment */}
        <AnimatedEntry delay={80}>
          <Text style={styles.label}>EQUIPMENT</Text>
          <EquipmentPicker
            selectedBowId={bowConfigId}
            selectedArrowId={arrowConfigId}
            onBowSelect={setBowConfigId}
            onArrowSelect={setArrowConfigId}
          />
        </AnimatedEntry>

        {/* Drills */}
        <AnimatedEntry delay={120}>
          <Text style={styles.label}>DRILLS</Text>
          <View style={styles.drillsGrid}>
            {PRACTICE_DRILLS.map((drill) => {
              const selected = drills.includes(drill);
              return (
                <TouchableOpacity
                  key={drill}
                  style={[styles.drillChip, selected && styles.drillChipSelected]}
                  onPress={() => toggleDrill(drill)}
                  activeOpacity={0.7}
                >
                  {selected && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.drillChipText, selected && styles.drillChipTextSelected]}>
                    {drill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedEntry>

        {/* Goal */}
        <AnimatedEntry delay={160}>
          <Text style={styles.label}>GOAL</Text>
          <TextInput
            style={styles.input}
            value={goals}
            onChangeText={setGoals}
            placeholder='e.g., "Focus on back tension release"'
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Conditions */}
        <AnimatedEntry delay={200}>
          <Text style={styles.label}>CONDITIONS</Text>
          <TextInput
            style={styles.input}
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g., indoor, outdoor 15mph wind"
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Rating */}
        <AnimatedEntry delay={240}>
          <Text style={styles.label}>RATING</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? colors.warning : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
            <Text style={styles.ratingLabel}>{rating}/5</Text>
          </View>
        </AnimatedEntry>

        {/* Notes */}
        <AnimatedEntry delay={280}>
          <Text style={styles.label}>NOTES</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go? What to work on next..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </AnimatedEntry>

        {/* Save */}
        <AnimatedEntry delay={320}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.background} />
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE PRACTICE' : 'SAVE PRACTICE'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  label: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
  },
  drillsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  drillChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drillChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  drillChipText: {
    fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600',
  },
  drillChipTextSelected: {
    color: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  ratingLabel: {
    fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, marginLeft: spacing.sm,
  },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
