import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getBowConfigs, getArrowConfigs, getTuneLogs, saveTuneLog, deleteTuneLog } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { BowConfig, ArrowConfig, TuneLog } from '../lib/types';

const TUNE_TYPES = ['paper', 'walk-back', 'french', 'bare-shaft', 'broadhead', 'group', 'other'] as const;
const RESULTS = ['bullet-hole', 'improving', 'worse', 'no-change'] as const;

const emptyForm = () => ({
  bowConfigId: undefined as string | undefined,
  arrowConfigId: undefined as string | undefined,
  tuneType: 'paper' as TuneLog['tuneType'],
  restPosition: '',
  nockHeight: '',
  camTiming: '',
  tearDirection: '',
  result: 'no-change' as TuneLog['result'],
  notes: '',
});

export default function TuneDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyForm());
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getBowConfigs(), getArrowConfigs()]).then(([b, a]) => {
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  useEffect(() => {
    if (id) {
      getTuneLogs().then((logs) => {
        const log = logs.find((x) => x.id === id);
        if (log) {
          setForm({
            bowConfigId: log.bowConfigId,
            arrowConfigId: log.arrowConfigId,
            tuneType: log.tuneType,
            restPosition: log.restPosition,
            nockHeight: log.nockHeight,
            camTiming: log.camTiming,
            tearDirection: log.tearDirection,
            result: log.result,
            notes: log.notes,
          });
        }
      });
    }
  }, [id]);

  const update = (partial: Partial<ReturnType<typeof emptyForm>>) => setForm({ ...form, ...partial });

  const handleSave = async () => {
    const log: TuneLog = {
      id: id || (uuid.v4() as string),
      date: new Date().toISOString(),
      bowConfigId: form.bowConfigId,
      arrowConfigId: form.arrowConfigId,
      tuneType: form.tuneType,
      restPosition: form.restPosition,
      nockHeight: form.nockHeight,
      camTiming: form.camTiming,
      tearDirection: form.tearDirection,
      result: form.result,
      notes: form.notes,
    };
    await saveTuneLog(log);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Tune Log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTuneLog(id); router.back(); } },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT TUNE LOG' : 'NEW TUNE LOG',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        headerRight: () => isEditing ? (
          <TouchableOpacity onPress={handleDelete}><Ionicons name="trash" size={22} color={colors.danger} /></TouchableOpacity>
        ) : null,
      }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Bow Selector */}
          {bows.length > 0 && (
            <AnimatedEntry>
              <Text style={styles.sectionLabel}>BOW</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {bows.map((b) => (
                    <TouchableOpacity key={b.id} style={[styles.chip, form.bowConfigId === b.id && styles.chipActive]}
                      onPress={() => update({ bowConfigId: form.bowConfigId === b.id ? undefined : b.id })}>
                      <Text style={[styles.chipText, form.bowConfigId === b.id && styles.chipTextActive]}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </AnimatedEntry>
          )}

          {/* Arrow Selector */}
          {arrows.length > 0 && (
            <AnimatedEntry delay={50}>
              <Text style={styles.sectionLabel}>ARROW</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {arrows.map((a) => (
                    <TouchableOpacity key={a.id} style={[styles.chip, form.arrowConfigId === a.id && styles.chipActive]}
                      onPress={() => update({ arrowConfigId: form.arrowConfigId === a.id ? undefined : a.id })}>
                      <Text style={[styles.chipText, form.arrowConfigId === a.id && styles.chipTextActive]}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </AnimatedEntry>
          )}

          {/* Tune Type */}
          <AnimatedEntry delay={100}>
            <Text style={styles.sectionLabel}>TUNE TYPE</Text>
            <View style={styles.chipRow}>
              {TUNE_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, form.tuneType === t && styles.chipActive]}
                  onPress={() => update({ tuneType: t })}>
                  <Text style={[styles.chipText, form.tuneType === t && styles.chipTextActive]}>{t.replace('-', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Text Fields */}
          <AnimatedEntry delay={150}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>REST POSITION</Text>
              <TextInput style={styles.input} value={form.restPosition} onChangeText={(t) => update({ restPosition: t })}
                placeholder="e.g., center shot, 13/16 from riser" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>NOCK HEIGHT</Text>
              <TextInput style={styles.input} value={form.nockHeight} onChangeText={(t) => update({ nockHeight: t })}
                placeholder="e.g., 1/8 high" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>CAM TIMING</Text>
              <TextInput style={styles.input} value={form.camTiming} onChangeText={(t) => update({ camTiming: t })}
                placeholder="e.g., top 1/2 turn ahead" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>TEAR DIRECTION</Text>
              <TextInput style={styles.input} value={form.tearDirection} onChangeText={(t) => update({ tearDirection: t })}
                placeholder="e.g., nock left, nock high" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Result */}
          <AnimatedEntry delay={200}>
            <Text style={styles.sectionLabel}>RESULT</Text>
            <View style={styles.chipRow}>
              {RESULTS.map((r) => (
                <TouchableOpacity key={r} style={[styles.chip, form.result === r && styles.chipActive]}
                  onPress={() => update({ result: r })}>
                  <Text style={[styles.chipText, form.result === r && styles.chipTextActive]}>{r.replace('-', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Notes */}
          <AnimatedEntry delay={250}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>NOTES</Text>
              <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={form.notes} onChangeText={(t) => update({ notes: t })}
                placeholder="Any additional notes..." placeholderTextColor={colors.textMuted}
                multiline />
            </View>
          </AnimatedEntry>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE TUNE LOG' : 'SAVE TUNE LOG'}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  fieldWrap: { marginTop: spacing.md },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
