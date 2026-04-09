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
import type { BowConfig } from '../lib/types';

const FIELDS: { key: keyof BowConfig; label: string; placeholder: string; icon: string }[] = [
  { key: 'name', label: 'SETUP NAME', placeholder: 'e.g., Competition Rig', icon: 'bookmark' },
  { key: 'bowModel', label: 'BOW MODEL', placeholder: 'e.g., Hoyt RX8 Ultra', icon: 'fitness' },
  { key: 'drawWeight', label: 'DRAW WEIGHT', placeholder: 'e.g., 50 lbs', icon: 'speedometer' },
  { key: 'drawLength', label: 'DRAW LENGTH', placeholder: 'e.g., 29 inches', icon: 'resize' },
  { key: 'restType', label: 'REST', placeholder: 'e.g., QAD Ultrarest', icon: 'git-branch' },
  { key: 'stabilizer', label: 'STABILIZER', placeholder: 'e.g., Bee Stinger Sport Hunter', icon: 'remove' },
  { key: 'releaseType', label: 'RELEASE', placeholder: 'e.g., Carter Wise Choice', icon: 'hand-left' },
];

export default function BowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<Record<string, string>>({
    name: '', bowModel: '', drawWeight: '', drawLength: '',
    restType: '', stabilizer: '', releaseType: '', notes: '',
  });

  useEffect(() => {
    if (id) {
      getBowConfigs().then((configs) => {
        const cfg = configs.find((c) => c.id === id);
        if (cfg) {
          setForm({
            name: cfg.name, bowModel: cfg.bowModel, drawWeight: cfg.drawWeight,
            drawLength: cfg.drawLength, restType: cfg.restType, stabilizer: cfg.stabilizer,
            releaseType: cfg.releaseType, notes: cfg.notes,
          });
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Give this setup a name.');
      return;
    }
    const config: BowConfig = {
      id: id || (uuid.v4() as string),
      name: form.name.trim(),
      bowModel: form.bowModel.trim(),
      drawWeight: form.drawWeight.trim(),
      drawLength: form.drawLength.trim(),
      restType: form.restType.trim(),
      stabilizer: form.stabilizer.trim(),
      releaseType: form.releaseType.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveBowConfig(config);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Bow Config', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteBowConfig(id); router.back(); },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT BOW' : 'NEW BOW',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => isEditing ? (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash" size={22} color={colors.danger} />
            </TouchableOpacity>
          ) : null,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {FIELDS.map((field, i) => (
          <AnimatedEntry key={field.key} delay={i * 60}>
            <Text style={styles.label}>
              <Ionicons name={field.icon as any} size={12} color={colors.primary} /> {field.label}
            </Text>
            <TextInput
              style={styles.input}
              value={form[field.key]}
              onChangeText={(text) => setForm({ ...form, [field.key]: text })}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
            />
          </AnimatedEntry>
        ))}

        <AnimatedEntry delay={FIELDS.length * 60}>
          <Text style={styles.label}>
            <Ionicons name="document-text" size={12} color={colors.primary} /> NOTES
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
            placeholder="Any additional notes..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </AnimatedEntry>

        <AnimatedEntry delay={(FIELDS.length + 1) * 60}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'UPDATE BOW' : 'SAVE BOW'}
              </Text>
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
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, color: colors.text, fontSize: fontSize.md,
    borderWidth: 1, borderColor: colors.border,
  },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: {
    fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2,
  },
});
