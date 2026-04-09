import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getBowConfigs, getStabilizerTests, saveStabilizerTest, deleteStabilizerTest } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { BowConfig, StabilizerBar, StabilizerTest } from '../lib/types';

const DISTANCES = [20, 30, 40, 50, 60, 70];
const HOLD_FEELINGS = ['dead', 'slight-float', 'active-float', 'jumpy'] as const;
const BALANCE_POINTS = ['nose-heavy', 'balanced', 'back-heavy'] as const;
const RECOIL_DIRECTIONS = ['forward', 'back', 'left', 'right', 'neutral'] as const;

const emptyBar = (): StabilizerBar => ({ brand: '', model: '', length: '', weight: '', angle: '' });

const emptyForm = () => ({
  bowConfigId: undefined as string | undefined,
  frontBar: emptyBar(),
  backBars: [emptyBar()] as StabilizerBar[],
  sideRods: [] as StabilizerBar[],
  vBarBrand: '',
  quickDisconnect: '',
  totalWeight: '',
  distance: 20,
  groupSize: '',
  holdFeeling: 'dead' as StabilizerTest['holdFeeling'],
  balancePoint: 'balanced' as StabilizerTest['balancePoint'],
  shotFeel: 3,
  recoilDirection: 'neutral' as StabilizerTest['recoilDirection'],
  isFavorite: false,
  notes: '',
});

function StabBarInput({ bar, onChange, onRemove, label, showAngle }: {
  bar: StabilizerBar; onChange: (b: StabilizerBar) => void;
  onRemove?: () => void; label: string; showAngle?: boolean;
}) {
  return (
    <View style={styles.stabCard}>
      <View style={styles.stabHeader}>
        <Text style={styles.stabLabel}>{label}</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.stabRow}>
        <TextInput style={[styles.stabInput, { flex: 2 }]} value={bar.brand} onChangeText={(t) => onChange({ ...bar, brand: t })} placeholder="Brand" placeholderTextColor={colors.textMuted} />
        <TextInput style={[styles.stabInput, { flex: 2 }]} value={bar.model} onChangeText={(t) => onChange({ ...bar, model: t })} placeholder="Model" placeholderTextColor={colors.textMuted} />
      </View>
      <View style={styles.stabRow}>
        <TextInput style={[styles.stabInput, { flex: 1 }]} value={bar.length} onChangeText={(t) => onChange({ ...bar, length: t })} placeholder="Length" placeholderTextColor={colors.textMuted} />
        <TextInput style={[styles.stabInput, { flex: 1 }]} value={bar.weight} onChangeText={(t) => onChange({ ...bar, weight: t })} placeholder="Weight (oz)" placeholderTextColor={colors.textMuted} />
        {showAngle && (
          <TextInput style={[styles.stabInput, { flex: 1 }]} value={bar.angle} onChangeText={(t) => onChange({ ...bar, angle: t })} placeholder="Angle" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
        )}
      </View>
    </View>
  );
}

export default function StabilizerTestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyForm());
  const [bows, setBows] = useState<BowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBowConfigs().then(setBows);
    }, [])
  );

  useEffect(() => {
    if (id) {
      getStabilizerTests().then((tests) => {
        const t = tests.find((x) => x.id === id);
        if (t) {
          setForm({
            bowConfigId: t.bowConfigId,
            frontBar: t.setup.frontBar || emptyBar(),
            backBars: t.setup.backBars?.length ? t.setup.backBars : [emptyBar()],
            sideRods: t.setup.sideRods || [],
            vBarBrand: t.setup.vBarBrand || '',
            quickDisconnect: t.setup.quickDisconnect || '',
            totalWeight: t.setup.totalWeight || '',
            distance: t.distance,
            groupSize: t.groupSize,
            holdFeeling: t.holdFeeling,
            balancePoint: t.balancePoint,
            shotFeel: t.shotFeel,
            recoilDirection: t.recoilDirection,
            isFavorite: t.isFavorite,
            notes: t.notes,
          });
        }
      });
    }
  }, [id]);

  const update = (partial: Partial<ReturnType<typeof emptyForm>>) => setForm({ ...form, ...partial });

  const handleSave = async () => {
    const test: StabilizerTest = {
      id: id || (uuid.v4() as string),
      date: new Date().toISOString(),
      bowConfigId: form.bowConfigId,
      setup: {
        frontBar: form.frontBar,
        backBars: form.backBars,
        sideRods: form.sideRods,
        vBarBrand: form.vBarBrand,
        quickDisconnect: form.quickDisconnect,
        totalWeight: form.totalWeight,
      },
      distance: form.distance,
      groupSize: form.groupSize,
      holdFeeling: form.holdFeeling,
      balancePoint: form.balancePoint,
      shotFeel: form.shotFeel,
      recoilDirection: form.recoilDirection,
      isFavorite: form.isFavorite,
      notes: form.notes,
    };
    await saveStabilizerTest(test);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Test', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteStabilizerTest(id); router.back(); } },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT STAB TEST' : 'NEW STAB TEST',
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

          {/* Front Bar */}
          <AnimatedEntry delay={50}>
            <Text style={styles.sectionLabel}>FRONT BAR</Text>
            <StabBarInput bar={form.frontBar} onChange={(b) => update({ frontBar: b })} label="Front Bar" />
          </AnimatedEntry>

          {/* Back Bars */}
          <AnimatedEntry delay={100}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>BACK BARS</Text>
              <TouchableOpacity onPress={() => update({ backBars: [...form.backBars, emptyBar()] })} style={styles.addSmallBtn}>
                <Ionicons name="add" size={14} color={colors.secondary} />
                <Text style={styles.addSmallText}>Add</Text>
              </TouchableOpacity>
            </View>
            {form.backBars.map((bar, i) => (
              <StabBarInput key={i} bar={bar} label={`Back Bar ${i + 1}`} showAngle
                onChange={(b) => { const arr = [...form.backBars]; arr[i] = b; update({ backBars: arr }); }}
                onRemove={form.backBars.length > 1 ? () => update({ backBars: form.backBars.filter((_, j) => j !== i) }) : undefined} />
            ))}
          </AnimatedEntry>

          {/* Side Rods */}
          <AnimatedEntry delay={150}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SIDE RODS</Text>
              <TouchableOpacity onPress={() => update({ sideRods: [...form.sideRods, emptyBar()] })} style={styles.addSmallBtn}>
                <Ionicons name="add" size={14} color={colors.secondary} />
                <Text style={styles.addSmallText}>Add</Text>
              </TouchableOpacity>
            </View>
            {form.sideRods.length === 0 && <Text style={styles.noItems}>No side rods added</Text>}
            {form.sideRods.map((bar, i) => (
              <StabBarInput key={i} bar={bar} label={`Side Rod ${i + 1}`} showAngle
                onChange={(b) => { const arr = [...form.sideRods]; arr[i] = b; update({ sideRods: arr }); }}
                onRemove={() => update({ sideRods: form.sideRods.filter((_, j) => j !== i) })} />
            ))}
          </AnimatedEntry>

          {/* V-Bar & Total Weight */}
          <AnimatedEntry delay={200}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>V-BAR BRAND</Text>
              <TextInput style={styles.input} value={form.vBarBrand} onChangeText={(t) => update({ vBarBrand: t })} placeholder="e.g., B-Stinger V-Bar" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>QUICK DISCONNECT</Text>
              <TextInput style={styles.input} value={form.quickDisconnect} onChangeText={(t) => update({ quickDisconnect: t })} placeholder="e.g., Doinker QD" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>TOTAL WEIGHT</Text>
              <TextInput style={styles.input} value={form.totalWeight} onChangeText={(t) => update({ totalWeight: t })} placeholder="e.g., 32 oz" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Distance */}
          <AnimatedEntry delay={250}>
            <Text style={styles.sectionLabel}>DISTANCE TESTED</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {DISTANCES.map((d) => (
                  <TouchableOpacity key={d} style={[styles.chip, form.distance === d && styles.chipActive]}
                    onPress={() => update({ distance: d })}>
                    <Text style={[styles.chipText, form.distance === d && styles.chipTextActive]}>{d}y</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AnimatedEntry>

          {/* Group Size */}
          <AnimatedEntry delay={300}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>GROUP SIZE</Text>
              <TextInput style={styles.input} value={form.groupSize} onChangeText={(t) => update({ groupSize: t })} placeholder="e.g., 2.5 inches" placeholderTextColor={colors.textMuted} />
            </View>
          </AnimatedEntry>

          {/* Hold Feeling */}
          <AnimatedEntry delay={350}>
            <Text style={styles.sectionLabel}>HOLD FEELING</Text>
            <View style={styles.chipRow}>
              {HOLD_FEELINGS.map((h) => (
                <TouchableOpacity key={h} style={[styles.chip, form.holdFeeling === h && styles.chipActive]}
                  onPress={() => update({ holdFeeling: h })}>
                  <Text style={[styles.chipText, form.holdFeeling === h && styles.chipTextActive]}>{h.replace('-', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Balance Point */}
          <AnimatedEntry delay={400}>
            <Text style={styles.sectionLabel}>BALANCE POINT</Text>
            <View style={styles.chipRow}>
              {BALANCE_POINTS.map((b) => (
                <TouchableOpacity key={b} style={[styles.chip, form.balancePoint === b && styles.chipActive]}
                  onPress={() => update({ balancePoint: b })}>
                  <Text style={[styles.chipText, form.balancePoint === b && styles.chipTextActive]}>{b.replace('-', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Shot Feel - Star Rating */}
          <AnimatedEntry delay={450}>
            <Text style={styles.sectionLabel}>SHOT FEEL</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => update({ shotFeel: s })}>
                  <Ionicons name={s <= form.shotFeel ? 'star' : 'star-outline'} size={32} color={s <= form.shotFeel ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Recoil Direction */}
          <AnimatedEntry delay={500}>
            <Text style={styles.sectionLabel}>RECOIL DIRECTION</Text>
            <View style={styles.chipRow}>
              {RECOIL_DIRECTIONS.map((r) => (
                <TouchableOpacity key={r} style={[styles.chip, form.recoilDirection === r && styles.chipActive]}
                  onPress={() => update({ recoilDirection: r })}>
                  <Text style={[styles.chipText, form.recoilDirection === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          {/* Favorite Toggle */}
          <AnimatedEntry delay={550}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>FAVORITE</Text>
              <Switch
                value={form.isFavorite}
                onValueChange={(v) => update({ isFavorite: v })}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={form.isFavorite ? colors.primary : colors.textSecondary}
              />
            </View>
          </AnimatedEntry>

          {/* Notes */}
          <AnimatedEntry delay={600}>
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
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE TEST' : 'SAVE TEST'}</Text>
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
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
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
  stabCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  stabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  stabLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  stabRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  stabInput: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, padding: spacing.sm,
    color: colors.text, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.border,
  },
  addSmallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.secondary,
  },
  addSmallText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.secondary },
  noItems: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, paddingVertical: spacing.sm,
  },
  toggleLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2 },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
