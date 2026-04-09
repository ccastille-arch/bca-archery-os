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
import { getBowConfigs, saveBowConfig, deleteBowConfig } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { BowConfig, StabilizerBar } from '../lib/types';

const BOW_TYPES = ['compound', 'recurve', 'traditional', 'crossbow'] as const;

const emptyStabBar = (): StabilizerBar => ({ brand: '', model: '', length: '', weight: '', angle: '' });

const emptyBow = (): Omit<BowConfig, 'id' | 'createdAt'> => ({
  name: '', bowType: 'compound', bowModel: '', drawWeight: '', drawLength: '',
  axleToAxle: '', braceHeight: '', letOff: '', camType: '',
  restType: '', releaseType: '', peepSize: '', scopeLens: '', dLoop: '',
  stringBrand: '', stringMaterial: '',
  frontStabilizer: emptyStabBar(),
  backBars: [emptyStabBar()],
  sideRods: [],
  vBarSetup: '', notes: '',
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
          <TextInput style={[styles.stabInput, { flex: 1 }]} value={bar.angle} onChangeText={(t) => onChange({ ...bar, angle: t })} placeholder="Angle (°)" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
        )}
      </View>
    </View>
  );
}

export default function BowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyBow());
  const [section, setSection] = useState<'basic' | 'specs' | 'accessories' | 'stabilizers' | 'string'>('basic');

  useEffect(() => {
    if (id) {
      getBowConfigs().then((configs) => {
        const cfg = configs.find((c) => c.id === id);
        if (cfg) {
          setForm({
            name: cfg.name, bowType: cfg.bowType || 'compound', bowModel: cfg.bowModel,
            drawWeight: cfg.drawWeight, drawLength: cfg.drawLength,
            axleToAxle: cfg.axleToAxle || '', braceHeight: cfg.braceHeight || '',
            letOff: cfg.letOff || '', camType: cfg.camType || '',
            restType: cfg.restType || '', releaseType: cfg.releaseType || '',
            peepSize: cfg.peepSize || '', scopeLens: cfg.scopeLens || '', dLoop: cfg.dLoop || '',
            stringBrand: cfg.stringBrand || '', stringMaterial: cfg.stringMaterial || '',
            frontStabilizer: cfg.frontStabilizer || emptyStabBar(),
            backBars: cfg.backBars?.length ? cfg.backBars : [emptyStabBar()],
            sideRods: cfg.sideRods || [],
            vBarSetup: cfg.vBarSetup || '', notes: cfg.notes,
          });
        }
      });
    }
  }, [id]);

  const update = (partial: Partial<typeof form>) => setForm({ ...form, ...partial });

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Give this setup a name.'); return; }
    const config: BowConfig = {
      id: id || (uuid.v4() as string),
      ...form,
      name: form.name.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveBowConfig(config);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Bow Config', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBowConfig(id); router.back(); } },
    ]);
  };

  const sections = [
    { key: 'basic' as const, label: 'BASIC', icon: 'fitness' },
    { key: 'specs' as const, label: 'SPECS', icon: 'speedometer' },
    { key: 'accessories' as const, label: 'ACCESSORIES', icon: 'construct' },
    { key: 'stabilizers' as const, label: 'STABILIZERS', icon: 'git-branch' },
    { key: 'string' as const, label: 'STRING', icon: 'remove' },
  ];

  const Field = ({ label, value, onChange, placeholder, kbType }: {
    label: string; value: string; onChange: (t: string) => void; placeholder: string; kbType?: string;
  }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} keyboardType={kbType as any || 'default'} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT BOW' : 'NEW BOW',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        headerRight: () => isEditing ? (
          <TouchableOpacity onPress={handleDelete}><Ionicons name="trash" size={22} color={colors.danger} /></TouchableOpacity>
        ) : null,
      }} />
      <View style={styles.container}>
        {/* Section tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabRow}>
            {sections.map((s) => (
              <TouchableOpacity key={s.key} style={[styles.tab, section === s.key && styles.tabActive]} onPress={() => setSection(s.key)}>
                <Ionicons name={s.icon as any} size={14} color={section === s.key ? colors.primary : colors.textSecondary} />
                <Text style={[styles.tabText, section === s.key && styles.tabTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView contentContainerStyle={styles.content}>
          {section === 'basic' && (
            <AnimatedEntry>
              <Field label="SETUP NAME" value={form.name} onChange={(t) => update({ name: t })} placeholder="e.g., Competition Rig" />
              <Text style={styles.sectionLabel}>BOW TYPE</Text>
              <View style={styles.chipRow}>
                {BOW_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, form.bowType === t && styles.chipActive]}
                    onPress={() => update({ bowType: t })}>
                    <Text style={[styles.chipText, form.bowType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="BOW MODEL" value={form.bowModel} onChange={(t) => update({ bowModel: t })} placeholder="e.g., Hoyt RX8 Ultra" />
              <Field label="DRAW WEIGHT" value={form.drawWeight} onChange={(t) => update({ drawWeight: t })} placeholder="e.g., 50 lbs" />
              <Field label="DRAW LENGTH" value={form.drawLength} onChange={(t) => update({ drawLength: t })} placeholder="e.g., 29 inches" />
            </AnimatedEntry>
          )}

          {section === 'specs' && (
            <AnimatedEntry>
              <Field label="AXLE TO AXLE" value={form.axleToAxle} onChange={(t) => update({ axleToAxle: t })} placeholder="e.g., 33 inches" />
              <Field label="BRACE HEIGHT" value={form.braceHeight} onChange={(t) => update({ braceHeight: t })} placeholder="e.g., 6.75 inches" />
              <Field label="LET-OFF" value={form.letOff} onChange={(t) => update({ letOff: t })} placeholder="e.g., 80%" />
              <Field label="CAM TYPE" value={form.camType} onChange={(t) => update({ camType: t })} placeholder="e.g., Binary, Hybrid, Single" />
            </AnimatedEntry>
          )}

          {section === 'accessories' && (
            <AnimatedEntry>
              <Field label="REST" value={form.restType} onChange={(t) => update({ restType: t })} placeholder="e.g., QAD Ultrarest" />
              <Field label="RELEASE" value={form.releaseType} onChange={(t) => update({ releaseType: t })} placeholder="e.g., Carter Wise Choice" />
              <Field label="PEEP SIZE" value={form.peepSize} onChange={(t) => update({ peepSize: t })} placeholder="e.g., 3/16 inch" />
              <Field label="SCOPE / LENS" value={form.scopeLens} onChange={(t) => update({ scopeLens: t })} placeholder="e.g., Axcel Accutouch 41mm 4x" />
              <Field label="D-LOOP" value={form.dLoop} onChange={(t) => update({ dLoop: t })} placeholder="e.g., BCY .060 / tied" />
            </AnimatedEntry>
          )}

          {section === 'stabilizers' && (
            <AnimatedEntry>
              <Text style={styles.sectionLabel}>FRONT STABILIZER</Text>
              <StabBarInput bar={form.frontStabilizer} onChange={(b) => update({ frontStabilizer: b })} label="Front Bar" />

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>BACK BARS</Text>
                <TouchableOpacity onPress={() => update({ backBars: [...form.backBars, emptyStabBar()] })} style={styles.addSmallBtn}>
                  <Ionicons name="add" size={14} color={colors.secondary} />
                  <Text style={styles.addSmallText}>Add</Text>
                </TouchableOpacity>
              </View>
              {form.backBars.map((bar, i) => (
                <StabBarInput key={i} bar={bar} label={`Back Bar ${i + 1}`} showAngle
                  onChange={(b) => { const arr = [...form.backBars]; arr[i] = b; update({ backBars: arr }); }}
                  onRemove={form.backBars.length > 1 ? () => update({ backBars: form.backBars.filter((_, j) => j !== i) }) : undefined} />
              ))}

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>SIDE RODS</Text>
                <TouchableOpacity onPress={() => update({ sideRods: [...form.sideRods, emptyStabBar()] })} style={styles.addSmallBtn}>
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

              <Field label="V-BAR SETUP" value={form.vBarSetup} onChange={(t) => update({ vBarSetup: t })} placeholder="e.g., B-Stinger V-Bar, 10° offset" />
            </AnimatedEntry>
          )}

          {section === 'string' && (
            <AnimatedEntry>
              <Field label="STRING BRAND" value={form.stringBrand} onChange={(t) => update({ stringBrand: t })} placeholder="e.g., Winner's Choice" />
              <Field label="STRING MATERIAL" value={form.stringMaterial} onChange={(t) => update({ stringMaterial: t })} placeholder="e.g., BCY X / 452X" />
              <Field label="NOTES" value={form.notes} onChange={(t) => update({ notes: t })} placeholder="Any additional notes..." />
            </AnimatedEntry>
          )}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE BOW' : 'SAVE BOW'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabScroll: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
  tabText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
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
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
