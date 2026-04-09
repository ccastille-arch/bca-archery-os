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
import { getArrowConfigs, saveArrowConfig, deleteArrowConfig } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { ArrowConfig } from '../lib/types';

const FIELDS: { key: keyof ArrowConfig; label: string; placeholder: string; icon: string; section: string }[] = [
  { key: 'name', label: 'SETUP NAME', placeholder: 'e.g., Outdoor Arrows', icon: 'bookmark', section: 'basic' },
  { key: 'shaftModel', label: 'SHAFT MODEL', placeholder: 'e.g., Easton X10', icon: 'arrow-forward', section: 'basic' },
  { key: 'spine', label: 'SPINE', placeholder: 'e.g., 400', icon: 'analytics', section: 'basic' },
  { key: 'length', label: 'ARROW LENGTH', placeholder: 'e.g., 28.5 inches', icon: 'resize', section: 'basic' },
  { key: 'fletchType', label: 'FLETCHING TYPE', placeholder: 'e.g., Spin Wings 50mm', icon: 'leaf', section: 'fletch' },
  { key: 'fletchOffset', label: 'FLETCH OFFSET / HELICAL', placeholder: 'e.g., 2° right helical', icon: 'sync', section: 'fletch' },
  { key: 'wrapType', label: 'WRAP TYPE', placeholder: 'e.g., Bohning 4" white', icon: 'color-palette', section: 'fletch' },
  { key: 'nockType', label: 'NOCK TYPE', placeholder: 'e.g., Pin Nock / G Nock', icon: 'ellipse', section: 'point' },
  { key: 'pointWeight', label: 'POINT WEIGHT', placeholder: 'e.g., 120 grain', icon: 'diamond', section: 'point' },
  { key: 'insertType', label: 'INSERT TYPE', placeholder: 'e.g., Gold Tip Accu-Lite', icon: 'enter', section: 'point' },
  { key: 'insertWeight', label: 'INSERT WEIGHT', placeholder: 'e.g., 50 grain', icon: 'scale', section: 'point' },
  { key: 'totalArrowWeight', label: 'TOTAL ARROW WEIGHT', placeholder: 'e.g., 385 grains', icon: 'barbell', section: 'weight' },
  { key: 'foc', label: 'FRONT OF CENTER (FOC)', placeholder: 'e.g., 11.5%', icon: 'locate', section: 'weight' },
];

export default function ArrowDetailScreen() {
  useScreenTracking('arrow-detail');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<Record<string, string>>({
    name: '', shaftModel: '', spine: '', length: '',
    fletchType: '', fletchOffset: '', nockType: '', pointWeight: '',
    insertType: '', insertWeight: '', totalArrowWeight: '', foc: '',
    wrapType: '', notes: '',
  });
  const [arrowCount, setArrowCount] = useState(12);

  useEffect(() => {
    if (id) {
      getArrowConfigs().then((configs) => {
        const cfg = configs.find((c) => c.id === id);
        if (cfg) {
          setForm({
            name: cfg.name, shaftModel: cfg.shaftModel, spine: cfg.spine,
            length: cfg.length, fletchType: cfg.fletchType,
            fletchOffset: cfg.fletchOffset || '', nockType: cfg.nockType,
            pointWeight: cfg.pointWeight, insertType: cfg.insertType || '',
            insertWeight: cfg.insertWeight || '', totalArrowWeight: cfg.totalArrowWeight || '',
            foc: cfg.foc || '', wrapType: cfg.wrapType || '', notes: cfg.notes,
          });
          setArrowCount(cfg.arrowCount || 12);
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Give this setup a name.'); return; }
    const config: ArrowConfig = {
      id: id || (uuid.v4() as string),
      name: form.name.trim(), shaftModel: form.shaftModel.trim(), spine: form.spine.trim(),
      length: form.length.trim(), fletchType: form.fletchType.trim(),
      fletchOffset: form.fletchOffset.trim(), nockType: form.nockType.trim(),
      pointWeight: form.pointWeight.trim(), insertType: form.insertType.trim(),
      insertWeight: form.insertWeight.trim(), totalArrowWeight: form.totalArrowWeight.trim(),
      foc: form.foc.trim(), wrapType: form.wrapType.trim(),
      arrowCount, notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveArrowConfig(config);
    trackEvent('arrow_saved');
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Arrow Config', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteArrowConfig(id); router.back(); } },
    ]);
  };

  const sectionNames = [
    { key: 'basic', label: 'SHAFT' },
    { key: 'fletch', label: 'FLETCHING' },
    { key: 'point', label: 'POINT/NOCK' },
    { key: 'weight', label: 'WEIGHT/FOC' },
  ];

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT ARROWS' : 'NEW ARROWS',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        headerRight: () => isEditing ? (
          <TouchableOpacity onPress={handleDelete}><Ionicons name="trash" size={22} color={colors.danger} /></TouchableOpacity>
        ) : null,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {sectionNames.map((sec) => (
          <View key={sec.key}>
            <Text style={styles.sectionTitle}>{sec.label}</Text>
            {FIELDS.filter((f) => f.section === sec.key).map((field, i) => (
              <AnimatedEntry key={field.key} delay={i * 40}>
                <Text style={styles.label}>
                  <Ionicons name={field.icon as any} size={12} color={colors.secondary} /> {field.label}
                </Text>
                <TextInput
                  style={styles.input} value={form[field.key]}
                  onChangeText={(text) => setForm({ ...form, [field.key]: text })}
                  placeholder={field.placeholder} placeholderTextColor={colors.textMuted}
                />
              </AnimatedEntry>
            ))}
          </View>
        ))}

        {/* Arrow Count */}
        <AnimatedEntry delay={200}>
          <Text style={styles.sectionTitle}>INVENTORY</Text>
          <Text style={styles.label}><Ionicons name="layers" size={12} color={colors.secondary} /> ARROWS IN SET</Text>
          <View style={styles.countRow}>
            <TouchableOpacity style={styles.countBtn} onPress={() => setArrowCount(Math.max(1, arrowCount - 1))}>
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.countValue}>{arrowCount}</Text>
            <TouchableOpacity style={styles.countBtn} onPress={() => setArrowCount(arrowCount + 1)}>
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </AnimatedEntry>

        {/* Notes */}
        <AnimatedEntry delay={240}>
          <Text style={styles.label}><Ionicons name="document-text" size={12} color={colors.secondary} /> NOTES</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={form.notes} onChangeText={(text) => setForm({ ...form, notes: text })}
            placeholder="Any additional notes..." placeholderTextColor={colors.textMuted} multiline />
        </AnimatedEntry>

        {/* Save */}
        <AnimatedEntry delay={280}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={['#00A3FF', '#00FF88'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE ARROWS' : 'SAVE ARROWS'}</Text>
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
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '800', color: colors.primary,
    letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
  },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, justifyContent: 'center' },
  countBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  countValue: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.secondary, minWidth: 50, textAlign: 'center' },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
