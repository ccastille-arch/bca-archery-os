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
import type { ArrowConfig } from '../lib/types';

const FIELDS: { key: keyof ArrowConfig; label: string; placeholder: string; icon: string }[] = [
  { key: 'name', label: 'SETUP NAME', placeholder: 'e.g., Outdoor Arrows', icon: 'bookmark' },
  { key: 'shaftModel', label: 'SHAFT MODEL', placeholder: 'e.g., Easton X10', icon: 'arrow-forward' },
  { key: 'spine', label: 'SPINE', placeholder: 'e.g., 400', icon: 'analytics' },
  { key: 'length', label: 'ARROW LENGTH', placeholder: 'e.g., 28.5 inches', icon: 'resize' },
  { key: 'fletchType', label: 'FLETCHING', placeholder: 'e.g., Spin Wings 50mm', icon: 'leaf' },
  { key: 'nockType', label: 'NOCK TYPE', placeholder: 'e.g., Pin Nock', icon: 'ellipse' },
  { key: 'pointWeight', label: 'POINT WEIGHT', placeholder: 'e.g., 120 grain', icon: 'diamond' },
];

export default function ArrowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<Record<string, string>>({
    name: '', shaftModel: '', spine: '', length: '',
    fletchType: '', nockType: '', pointWeight: '', notes: '',
  });

  useEffect(() => {
    if (id) {
      getArrowConfigs().then((configs) => {
        const cfg = configs.find((c) => c.id === id);
        if (cfg) {
          setForm({
            name: cfg.name, shaftModel: cfg.shaftModel, spine: cfg.spine,
            length: cfg.length, fletchType: cfg.fletchType, nockType: cfg.nockType,
            pointWeight: cfg.pointWeight, notes: cfg.notes,
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
    const config: ArrowConfig = {
      id: id || (uuid.v4() as string),
      name: form.name.trim(),
      shaftModel: form.shaftModel.trim(),
      spine: form.spine.trim(),
      length: form.length.trim(),
      fletchType: form.fletchType.trim(),
      nockType: form.nockType.trim(),
      pointWeight: form.pointWeight.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveArrowConfig(config);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Arrow Config', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteArrowConfig(id); router.back(); },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT ARROWS' : 'NEW ARROWS',
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
              <Ionicons name={field.icon as any} size={12} color={colors.secondary} /> {field.label}
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
            <Ionicons name="document-text" size={12} color={colors.secondary} /> NOTES
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
              colors={['#00A3FF', '#00FF88'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'UPDATE ARROWS' : 'SAVE ARROWS'}
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
