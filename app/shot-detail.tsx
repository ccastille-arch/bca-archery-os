import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots, saveShot, deleteShot } from '../lib/storage';
import ScoreRing from '../components/ScoreRing';
import EquipmentPicker from '../components/EquipmentPicker';
import AnimatedEntry from '../components/AnimatedEntry';
import type { ShotEnd } from '../lib/types';

const DISTANCES = [10, 18, 20, 30, 40, 50, 60, 70, 90];
const WIND_OPTIONS = ['none', 'light', 'moderate', 'heavy'] as const;
const WEATHER_OPTIONS = ['clear', 'cloudy', 'rain', 'snow'] as const;

export default function ShotDetailScreen() {
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams<{ id?: string; sessionId?: string }>();
  const isEditing = !!id;

  const [distance, setDistance] = useState(20);
  const [arrowCount, setArrowCount] = useState(3);
  const [scores, setScores] = useState<number[]>([]);
  const [currentArrow, setCurrentArrow] = useState(0);
  const [wind, setWind] = useState<ShotEnd['conditions']['wind']>('none');
  const [weather, setWeather] = useState<ShotEnd['conditions']['weather']>('clear');
  const [indoor, setIndoor] = useState(false);
  const [notes, setNotes] = useState('');
  const [bowConfigId, setBowConfigId] = useState<string | undefined>();
  const [arrowConfigId, setArrowConfigId] = useState<string | undefined>();

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      getShots().then((shots) => {
        const shot = shots.find((s) => s.id === id);
        if (shot) {
          setDistance(shot.distance);
          setArrowCount(shot.arrowCount);
          setScores(shot.scores);
          setWind(shot.conditions.wind);
          setWeather(shot.conditions.weather);
          setIndoor(shot.conditions.indoor);
          setNotes(shot.notes);
          setBowConfigId(shot.bowConfigId);
          setArrowConfigId(shot.arrowConfigId);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && scores.length === 0) {
      setScores(new Array(arrowCount).fill(-1));
      setCurrentArrow(0);
    }
  }, [arrowCount, isEditing]);

  // Animate progress bar
  useEffect(() => {
    const filled = scores.filter((s) => s >= 0).length;
    Animated.spring(progressAnim, {
      toValue: arrowCount > 0 ? filled / arrowCount : 0,
      useNativeDriver: false,
      speed: 20,
    }).start();
  }, [scores, arrowCount]);

  const handleScoreTap = (value: number) => {
    const next = [...scores];
    next[currentArrow] = value;
    setScores(next);
    if (currentArrow < arrowCount - 1) {
      setCurrentArrow(currentArrow + 1);
    }
  };

  const runningTotal = scores.filter((s) => s >= 0).reduce((a, b) => a + b, 0);
  const filledCount = scores.filter((s) => s >= 0).length;

  const handleSave = async () => {
    const validScores = scores.filter((s) => s >= 0);
    if (validScores.length === 0) {
      Alert.alert('No scores', 'Please enter at least one arrow score.');
      return;
    }
    const shot: ShotEnd = {
      id: id || (uuid.v4() as string),
      date: new Date().toISOString(),
      distance, arrowCount,
      scores: validScores,
      conditions: { wind, weather, indoor },
      notes, sessionId: sessionId || undefined,
      bowConfigId, arrowConfigId,
    };
    await saveShot(shot);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete End', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteShot(id); router.back(); } },
    ]);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT END' : 'LOG END',
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
        {/* Equipment Picker */}
        <AnimatedEntry>
          <EquipmentPicker
            selectedBowId={bowConfigId}
            selectedArrowId={arrowConfigId}
            onBowSelect={setBowConfigId}
            onArrowSelect={setArrowConfigId}
          />
        </AnimatedEntry>

        {/* Distance */}
        <AnimatedEntry delay={60}>
          <Text style={styles.label}>DISTANCE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {DISTANCES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, distance === d && styles.chipActive]}
                  onPress={() => setDistance(d)}
                >
                  <Text style={[styles.chipText, distance === d && styles.chipTextActive]}>{d}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </AnimatedEntry>

        {/* Arrow Count */}
        <AnimatedEntry delay={120}>
          <Text style={styles.label}>ARROWS PER END</Text>
          <View style={styles.chipRow}>
            {[3, 6].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, arrowCount === n && styles.chipActive]}
                onPress={() => { setArrowCount(n); setScores(new Array(n).fill(-1)); setCurrentArrow(0); }}
              >
                <Text style={[styles.chipText, arrowCount === n && styles.chipTextActive]}>{n} arrows</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Progress Bar + Running Total */}
        <AnimatedEntry delay={180}>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Arrow {currentArrow + 1} of {arrowCount}</Text>
              <Text style={styles.runningTotal}>
                Total: <Text style={{ color: colors.primary, fontWeight: '900' }}>{runningTotal}</Text>
              </Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                <LinearGradient
                  colors={[...gradients.primaryToSecondary] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressCount}>{filledCount}/{arrowCount} scored</Text>
          </View>
        </AnimatedEntry>

        {/* Score Slots */}
        <View style={styles.scoresDisplay}>
          {scores.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrentArrow(i)}
              style={[styles.scoreSlot, i === currentArrow && styles.scoreSlotActive]}
            >
              <Text style={[
                styles.scoreSlotText,
                s >= 0 && { color: s >= 9 ? colors.primary : s >= 7 ? colors.secondary : colors.text },
              ]}>
                {s >= 0 ? (s === 10 ? 'X' : s) : '—'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Score Rings */}
        <View style={styles.ringGrid}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((v) => (
            <ScoreRing
              key={v} value={v}
              selected={scores[currentArrow] === v}
              onPress={() => handleScoreTap(v)}
            />
          ))}
        </View>

        {/* Conditions */}
        <AnimatedEntry delay={240}>
          <Text style={styles.label}>CONDITIONS</Text>
          <TouchableOpacity
            style={[styles.chip, indoor && styles.chipActive, { alignSelf: 'flex-start', marginBottom: spacing.sm }]}
            onPress={() => setIndoor(!indoor)}
          >
            <Text style={[styles.chipText, indoor && styles.chipTextActive]}>
              {indoor ? 'Indoor' : 'Outdoor'}
            </Text>
          </TouchableOpacity>
          {!indoor && (
            <>
              <Text style={styles.sublabel}>Wind</Text>
              <View style={styles.chipRow}>
                {WIND_OPTIONS.map((w) => (
                  <TouchableOpacity key={w} style={[styles.chip, wind === w && styles.chipActive]} onPress={() => setWind(w)}>
                    <Text style={[styles.chipText, wind === w && styles.chipTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sublabel}>Weather</Text>
              <View style={styles.chipRow}>
                {WEATHER_OPTIONS.map((w) => (
                  <TouchableOpacity key={w} style={[styles.chip, weather === w && styles.chipActive]} onPress={() => setWeather(w)}>
                    <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </AnimatedEntry>

        {/* Notes */}
        <AnimatedEntry delay={300}>
          <Text style={styles.label}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes} onChangeText={setNotes}
            placeholder="How did this end feel?"
            placeholderTextColor={colors.textMuted}
            multiline numberOfLines={3}
          />
        </AnimatedEntry>

        {/* Save */}
        <AnimatedEntry delay={360}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE END' : 'SAVE END'}</Text>
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
  sublabel: {
    fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted,
    marginBottom: spacing.xs, marginTop: spacing.sm,
  },
  chipScroll: { marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  progressSection: { marginTop: spacing.md, marginBottom: spacing.sm },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs,
  },
  progressLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  runningTotal: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
  progressBar: {
    height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  progressGradient: { flex: 1 },
  progressCount: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right' },
  scoresDisplay: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, justifyContent: 'center',
  },
  scoreSlot: {
    width: 44, height: 44, borderRadius: borderRadius.sm, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  scoreSlotActive: { borderColor: colors.primary, borderWidth: 2 },
  scoreSlotText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textMuted },
  ringGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
    minHeight: 80, textAlignVertical: 'top',
  },
  saveBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
