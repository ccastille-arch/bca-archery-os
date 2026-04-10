import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { saveLiveRound } from '../lib/storage';
import EquipmentPicker from '../components/EquipmentPicker';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { LiveRound, Shooter, RoundMode, ScorerFormat } from '../lib/types';
import { ASA_CLASSES, IBO_CLASSES } from '../lib/types';

export default function ScoreRoundScreen() {
  useScreenTracking('score-round');
  const router = useRouter();

  // Step 1: Mode & format
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<RoundMode>('competition');
  const [format, setFormat] = useState<ScorerFormat>('asa');
  const [name, setName] = useState('');
  const [rangeAssignment, setRangeAssignment] = useState('');
  const [totalTargets, setTotalTargets] = useState(20);
  const [startingTarget, setStartingTarget] = useState(1);
  const [bowConfigId, setBowConfigId] = useState<string | undefined>();
  const [arrowConfigId, setArrowConfigId] = useState<string | undefined>();

  // Step 2: Shooters
  const [shooters, setShooters] = useState<Shooter[]>([{
    id: uuid.v4() as string, name: '', shooterNumber: '', bowClass: '',
  }]);

  const classes = format === 'asa' ? ASA_CLASSES : format === 'ibo' ? IBO_CLASSES : ASA_CLASSES;

  const addShooter = () => {
    setShooters([...shooters, {
      id: uuid.v4() as string, name: '', shooterNumber: '', bowClass: '',
    }]);
  };

  const updateShooter = (idx: number, partial: Partial<Shooter>) => {
    const updated = [...shooters];
    updated[idx] = { ...updated[idx], ...partial };
    setShooters(updated);
  };

  const removeShooter = (idx: number) => {
    if (shooters.length <= 1) return;
    setShooters(shooters.filter((_, i) => i !== idx));
  };

  const startRound = async () => {
    try {
      const validShooters = shooters.filter((s) => s.name.trim());
      if (validShooters.length === 0) {
        Alert.alert('Add shooters', 'Add at least one shooter with a name.');
        return;
      }

      const roundId = uuid.v4() as string;
      const round: LiveRound = {
        id: roundId,
        date: new Date().toISOString(),
        mode, format,
        name: name.trim() || (mode === 'competition' ? 'Competition' : mode === 'practice' ? 'Practice' : 'Fun Round'),
        rangeAssignment: rangeAssignment.trim(),
        totalTargets, startingTarget,
        shooters: validShooters.map((s) => ({ ...s, name: s.name.trim() })),
        targets: [],
        completed: false,
        bowConfigId, arrowConfigId,
      };

      await saveLiveRound(round);
      trackEvent('round_started', { format: format, mode: mode });

      // Use direct window.location on web since router.push fails for hidden tab screens
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = `/score-live?id=${roundId}`;
      } else {
        router.push(`/score-live?id=${roundId}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to start round. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'NEW ROUND', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {step === 1 && (
          <>
            {/* Mode */}
            <AnimatedEntry>
              <Text style={styles.question}>Is this a competition, practice, or just for fun?</Text>
              <View style={styles.bigChipRow}>
                {([['competition', 'Competition', colors.danger], ['practice', 'Practice', colors.secondary], ['fun', 'Fun', colors.primary]] as const).map(([key, label, color]) => (
                  <TouchableOpacity key={key} style={[styles.bigChip, mode === key && { backgroundColor: color + '20', borderColor: color }]}
                    onPress={() => setMode(key as RoundMode)}>
                    <Text style={[styles.bigChipText, mode === key && { color }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedEntry>

            {/* Format */}
            <AnimatedEntry delay={60}>
              <Text style={styles.question}>What format are you shooting?</Text>
              <View style={styles.bigChipRow}>
                {([['asa', 'ASA', '#00AA00'], ['ibo', 'IBO', '#0066CC'], ['other', 'Something Else', colors.textSecondary]] as const).map(([key, label, color]) => (
                  <TouchableOpacity key={key} style={[styles.bigChip, format === key && { backgroundColor: color + '20', borderColor: color }]}
                    onPress={() => setFormat(key as ScorerFormat)}>
                    <Text style={[styles.bigChipText, format === key && { color }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedEntry>

            {/* Event name */}
            {mode === 'competition' && (
              <AnimatedEntry delay={100}>
                <Text style={styles.question}>Event name:</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName}
                  placeholder="e.g., Bayou Bowmen ASA Qualifier" placeholderTextColor={colors.textMuted} />
              </AnimatedEntry>
            )}

            {/* Range Assignment */}
            <AnimatedEntry delay={140}>
              <Text style={styles.question}>Enter your range assignment if you have one:</Text>
              <TextInput style={styles.input} value={rangeAssignment} onChangeText={setRangeAssignment}
                placeholder="Range Assignment" placeholderTextColor={colors.textMuted} />
            </AnimatedEntry>

            {/* Target count */}
            <AnimatedEntry delay={180}>
              <Text style={styles.question}>How many targets are you shooting?</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTotalTargets(Math.max(1, totalTargets - 1))}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{totalTargets}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTotalTargets(totalTargets + 1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </AnimatedEntry>

            {/* Starting target */}
            <AnimatedEntry delay={220}>
              <Text style={styles.question}>What target number are you starting on?</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setStartingTarget(Math.max(1, startingTarget - 1))}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{startingTarget}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setStartingTarget(startingTarget + 1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </AnimatedEntry>

            {/* Equipment */}
            <AnimatedEntry delay={260}>
              <Text style={styles.question}>Equipment:</Text>
              <EquipmentPicker selectedBowId={bowConfigId} selectedArrowId={arrowConfigId}
                onBowSelect={setBowConfigId} onArrowSelect={setArrowConfigId} />
            </AnimatedEntry>

            <AnimatedEntry delay={300}>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
                <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnInner}>
                  <Text style={styles.nextBtnText}>NEXT</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.background} />
                </LinearGradient>
              </TouchableOpacity>
            </AnimatedEntry>
          </>
        )}

        {step === 2 && (
          <>
            <AnimatedEntry>
              <Text style={styles.stepTitle}>ADD SHOOTERS</Text>
              <Text style={styles.stepSub}>If there are no other shooters, just enter your name and continue.</Text>
            </AnimatedEntry>

            {shooters.map((shooter, i) => (
              <AnimatedEntry key={shooter.id} delay={i * 60}>
                <View style={styles.shooterCard}>
                  <View style={styles.shooterHeader}>
                    <Text style={styles.shooterNum}>Shooter {i + 1}</Text>
                    {shooters.length > 1 && (
                      <TouchableOpacity onPress={() => removeShooter(i)}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.shooterRow}>
                    <TextInput style={[styles.shooterInput, { flex: 2 }]} value={shooter.name}
                      onChangeText={(t) => updateShooter(i, { name: t })}
                      placeholder="Name" placeholderTextColor={colors.textMuted} />
                    <TextInput style={[styles.shooterInput, { flex: 1 }]} value={shooter.shooterNumber}
                      onChangeText={(t) => updateShooter(i, { shooterNumber: t })}
                      placeholder="#" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                  </View>
                  <Text style={styles.classLabel}>Class:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.classRow}>
                      {classes.map((cls) => (
                        <TouchableOpacity key={cls} style={[styles.classChip, shooter.bowClass === cls && styles.classChipActive]}
                          onPress={() => updateShooter(i, { bowClass: cls })}>
                          <Text style={[styles.classChipText, shooter.bowClass === cls && styles.classChipTextActive]}>{cls}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </AnimatedEntry>
            ))}

            <TouchableOpacity style={styles.addShooterBtn} onPress={addShooter}>
              <Ionicons name="person-add" size={18} color={colors.secondary} />
              <Text style={styles.addShooterText}>Add a shooter</Text>
            </TouchableOpacity>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startRoundBtn} onPress={startRound}>
                <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startRoundBtnInner}>
                  <Text style={styles.startRoundBtnText}>START ROUND</Text>
                  <Ionicons name="play" size={20} color={colors.background} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  question: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  bigChipRow: { flexDirection: 'row', gap: spacing.sm },
  bigChip: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  bigChipText: { fontSize: fontSize.md, fontWeight: '800', color: colors.textSecondary },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.lg, borderWidth: 1, borderColor: colors.border },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  counterBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  counterValue: { fontSize: fontSize.hero, fontWeight: '900', color: colors.primary, minWidth: 60, textAlign: 'center' },
  nextBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  nextBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  nextBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  stepTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  stepSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  shooterCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  shooterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  shooterNum: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  shooterRow: { flexDirection: 'row', gap: spacing.sm },
  shooterInput: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  classLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  classRow: { flexDirection: 'row', gap: spacing.xs },
  classChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  classChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  classChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  classChipTextActive: { color: colors.primary },
  addShooterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.secondary, borderStyle: 'dashed', marginTop: spacing.sm },
  addShooterText: { fontSize: fontSize.md, fontWeight: '600', color: colors.secondary },
  stepButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  backBtnText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
  startRoundBtn: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  startRoundBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  startRoundBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
