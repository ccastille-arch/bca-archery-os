import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { getSightProfiles, saveSightProfile, deleteSightProfile } from '../lib/storage';
import type { SightProfile, SightMark } from '../lib/types';

export default function SightDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [bowName, setBowName] = useState('');
  const [arrowSetup, setArrowSetup] = useState('');
  const [sightModel, setSightModel] = useState('');
  const [marks, setMarks] = useState<SightMark[]>([]);
  const [newDistance, setNewDistance] = useState('');
  const [newMark, setNewMark] = useState('');

  useEffect(() => {
    if (id) {
      getSightProfiles().then((profiles) => {
        const profile = profiles.find((p) => p.id === id);
        if (profile) {
          setName(profile.name);
          setBowName(profile.bowName);
          setArrowSetup(profile.arrowSetup);
          setSightModel(profile.sightModel);
          setMarks(profile.marks);
        }
      });
    }
  }, [id]);

  const addMark = () => {
    const dist = parseFloat(newDistance);
    const mark = parseFloat(newMark);
    if (isNaN(dist) || isNaN(mark)) {
      Alert.alert('Invalid', 'Enter valid distance and sight mark numbers.');
      return;
    }
    const updated = [...marks, { distance: dist, mark }].sort((a, b) => a.distance - b.distance);
    setMarks(updated);
    setNewDistance('');
    setNewMark('');
  };

  const removeMark = (idx: number) => {
    setMarks(marks.filter((_, i) => i !== idx));
  };

  const interpolateMark = (targetDist: number): number | null => {
    if (marks.length < 2) return null;
    const sorted = [...marks].sort((a, b) => a.distance - b.distance);

    // Find surrounding marks
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].distance <= targetDist && sorted[i + 1].distance >= targetDist) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    if (lower.distance === upper.distance) return lower.mark;

    const ratio = (targetDist - lower.distance) / (upper.distance - lower.distance);
    return lower.mark + ratio * (upper.mark - lower.mark);
  };

  // Generate interpolated marks for every 5m
  const allDistances: { distance: number; mark: number; isKnown: boolean }[] = [];
  if (marks.length >= 2) {
    const minDist = Math.min(...marks.map((m) => m.distance));
    const maxDist = Math.max(...marks.map((m) => m.distance));
    for (let d = minDist; d <= maxDist; d += 5) {
      const known = marks.find((m) => m.distance === d);
      if (known) {
        allDistances.push({ distance: d, mark: known.mark, isKnown: true });
      } else {
        const interpolated = interpolateMark(d);
        if (interpolated !== null) {
          allDistances.push({ distance: d, mark: interpolated, isKnown: false });
        }
      }
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this setup a name.');
      return;
    }

    const profile: SightProfile = {
      id: id || (uuid.v4() as string),
      name: name.trim(),
      bowName: bowName.trim(),
      arrowSetup: arrowSetup.trim(),
      sightModel: sightModel.trim(),
      marks,
      createdAt: new Date().toISOString(),
    };

    await saveSightProfile(profile);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Profile', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSightProfile(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT SETUP' : 'NEW SETUP',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () =>
            isEditing ? (
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash" size={22} color={colors.danger} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Equipment Info */}
        <Text style={styles.label}>PROFILE NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Competition Setup"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>BOW NAME</Text>
        <TextInput
          style={styles.input}
          value={bowName}
          onChangeText={setBowName}
          placeholder="e.g., Hoyt RX8"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>ARROW SETUP</Text>
        <TextInput
          style={styles.input}
          value={arrowSetup}
          onChangeText={setArrowSetup}
          placeholder="e.g., Easton X10 / 400 spine"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>SIGHT MODEL</Text>
        <TextInput
          style={styles.input}
          value={sightModel}
          onChangeText={setSightModel}
          placeholder="e.g., Axcel Achieve"
          placeholderTextColor={colors.textMuted}
        />

        {/* Sight Marks */}
        <Text style={styles.label}>SIGHT MARKS</Text>
        <View style={styles.addMarkRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newDistance}
            onChangeText={setNewDistance}
            placeholder="Dist (m)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newMark}
            onChangeText={setNewMark}
            placeholder="Sight mark"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.addMarkBtn} onPress={addMark}>
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Known Marks */}
        {marks.map((m, i) => (
          <View key={i} style={styles.markRow}>
            <Text style={styles.markDistance}>{m.distance}m</Text>
            <Text style={styles.markValue}>{m.mark.toFixed(1)}</Text>
            <TouchableOpacity onPress={() => removeMark(i)}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Interpolated Sight Tape */}
        {allDistances.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>SIGHT TAPE (Interpolated)</Text>
            <View style={styles.tapeWrap}>
              {allDistances.map((d, i) => (
                <View
                  key={i}
                  style={[styles.tapeRow, !d.isKnown && styles.tapeRowInterpolated]}
                >
                  <Text style={[styles.tapeDistance, d.isKnown && { color: colors.primary }]}>
                    {d.distance}m
                  </Text>
                  <View style={styles.tapeLine} />
                  <Text style={[styles.tapeMark, d.isKnown && { color: colors.primary }]}>
                    {d.mark.toFixed(1)}
                  </Text>
                  {d.isKnown && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {isEditing ? 'UPDATE PROFILE' : 'SAVE PROFILE'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addMarkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addMarkBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  markDistance: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    width: 60,
  },
  markValue: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.secondary,
  },
  tapeWrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tapeRowInterpolated: {
    opacity: 0.6,
  },
  tapeDistance: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 50,
    textAlign: 'right',
  },
  tapeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  tapeMark: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 50,
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
});
