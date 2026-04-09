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
import { getBowConfigs, getArrowConfigs, getTournaments, saveTournament, deleteTournament } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { BowConfig, ArrowConfig, Tournament, RoundFormat, ScoringMode } from '../lib/types';
import { ROUND_FORMAT_LABELS, SCORING_MODE_LABELS } from '../lib/types';

const ORGANIZATIONS = ['asa', 'ibo', 'nfaa', 'usa-archery', 'wa', 'local', 'other'] as const;

const emptyForm = () => ({
  name: '',
  date: '',
  location: '',
  organization: 'local' as Tournament['organization'],
  roundFormat: 'practice' as RoundFormat,
  scoringMode: 'standard' as ScoringMode,
  bowClass: '',
  totalScore: '',
  maxPossible: '',
  placement: '',
  bowConfigId: undefined as string | undefined,
  arrowConfigId: undefined as string | undefined,
  notes: '',
});

export default function TournamentDetailScreen() {
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
      getTournaments().then((list) => {
        const t = list.find((x) => x.id === id);
        if (t) {
          setForm({
            name: t.name,
            date: t.date,
            location: t.location,
            organization: t.organization,
            roundFormat: t.roundFormat,
            scoringMode: t.scoringMode,
            bowClass: t.bowClass,
            totalScore: t.totalScore > 0 ? String(t.totalScore) : '',
            maxPossible: t.maxPossible > 0 ? String(t.maxPossible) : '',
            placement: t.placement,
            bowConfigId: t.bowConfigId,
            arrowConfigId: t.arrowConfigId,
            notes: t.notes,
          });
        }
      });
    }
  }, [id]);

  const update = (partial: Partial<ReturnType<typeof emptyForm>>) => setForm({ ...form, ...partial });

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Give this tournament a name.'); return; }
    const tournament: Tournament = {
      id: id || (uuid.v4() as string),
      name: form.name.trim(),
      date: form.date || new Date().toISOString().slice(0, 10),
      location: form.location,
      organization: form.organization,
      roundFormat: form.roundFormat,
      scoringMode: form.scoringMode,
      bowClass: form.bowClass,
      totalScore: parseInt(form.totalScore, 10) || 0,
      maxPossible: parseInt(form.maxPossible, 10) || 0,
      placement: form.placement,
      endIds: [],
      bowConfigId: form.bowConfigId,
      arrowConfigId: form.arrowConfigId,
      notes: form.notes,
    };
    await saveTournament(tournament);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Tournament', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTournament(id); router.back(); } },
    ]);
  };

  const roundFormatKeys = Object.keys(ROUND_FORMAT_LABELS) as RoundFormat[];
  const scoringModeKeys = Object.keys(SCORING_MODE_LABELS) as ScoringMode[];

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT TOURNAMENT' : 'NEW TOURNAMENT',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        headerRight: () => isEditing ? (
          <TouchableOpacity onPress={handleDelete}><Ionicons name="trash" size={22} color={colors.danger} /></TouchableOpacity>
        ) : null,
      }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Name */}
          <AnimatedEntry>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>TOURNAMENT NAME</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(t) => update({ name: t })}
                placeholder="e.g., ASA Classic" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Date */}
          <AnimatedEntry delay={50}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>DATE</Text>
              <TextInput style={styles.input} value={form.date} onChangeText={(t) => update({ date: t })}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Location */}
          <AnimatedEntry delay={100}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <TextInput style={styles.input} value={form.location} onChangeText={(t) => update({ location: t })}
                placeholder="e.g., Foley, AL" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Organization */}
          <AnimatedEntry delay={150}>
            <Text style={styles.sectionLabel}>ORGANIZATION</Text>
            <View style={styles.chipRow}>
              {ORGANIZATIONS.map((o) => (
                <TouchableOpacity key={o} style={[styles.chip, form.organization === o && styles.chipActive]}
                  onPress={() => update({ organization: o })}>
                  <Text style={[styles.chipText, form.organization === o && styles.chipTextActive]}>{o.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Round Format */}
          <AnimatedEntry delay={200}>
            <Text style={styles.sectionLabel}>ROUND FORMAT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {roundFormatKeys.map((rf) => (
                  <TouchableOpacity key={rf} style={[styles.chip, form.roundFormat === rf && styles.chipActive]}
                    onPress={() => update({ roundFormat: rf })}>
                    <Text style={[styles.chipText, form.roundFormat === rf && styles.chipTextActive]}>{ROUND_FORMAT_LABELS[rf]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AnimatedEntry>

          {/* Scoring Mode */}
          <AnimatedEntry delay={250}>
            <Text style={styles.sectionLabel}>SCORING MODE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {scoringModeKeys.map((sm) => (
                  <TouchableOpacity key={sm} style={[styles.chip, form.scoringMode === sm && styles.chipActive]}
                    onPress={() => update({ scoringMode: sm })}>
                    <Text style={[styles.chipText, form.scoringMode === sm && styles.chipTextActive]}>{SCORING_MODE_LABELS[sm]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AnimatedEntry>

          {/* Bow Class */}
          <AnimatedEntry delay={300}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>BOW CLASS</Text>
              <TextInput style={styles.input} value={form.bowClass} onChangeText={(t) => update({ bowClass: t })}
                placeholder="e.g., Open Pro, Known 45" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Score Fields */}
          <AnimatedEntry delay={350}>
            <View style={styles.rowFields}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>TOTAL SCORE</Text>
                <TextInput style={styles.input} value={form.totalScore} onChangeText={(t) => update({ totalScore: t })}
                  placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>MAX POSSIBLE</Text>
                <TextInput style={styles.input} value={form.maxPossible} onChangeText={(t) => update({ maxPossible: t })}
                  placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
            </View>
          </AnimatedEntry>

          {/* Placement */}
          <AnimatedEntry delay={400}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>PLACEMENT</Text>
              <TextInput style={styles.input} value={form.placement} onChangeText={(t) => update({ placement: t })}
                placeholder="e.g., 1st, 3rd, Top 10" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Bow Selector */}
          {bows.length > 0 && (
            <AnimatedEntry delay={450}>
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
            <AnimatedEntry delay={500}>
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

          {/* Notes */}
          <AnimatedEntry delay={550}>
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
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE TOURNAMENT' : 'SAVE TOURNAMENT'}</Text>
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
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  rowFields: { flexDirection: 'row', gap: spacing.md },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
