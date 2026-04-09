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
import { getSessions, saveSession, deleteSession, getShots } from '../lib/storage';
import EquipmentPicker from '../components/EquipmentPicker';
import AnimatedEntry from '../components/AnimatedEntry';
import GradientCard from '../components/GradientCard';
import { useScreenTracking } from '../lib/useAnalytics';
import type { Session, ShotEnd } from '../lib/types';

export default function SessionDetailScreen() {
  useScreenTracking('session-detail');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isExisting = !!id;

  const [session, setSession] = useState<Session | null>(null);
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [sessionShots, setSessionShots] = useState<ShotEnd[]>([]);
  const [bowConfigId, setBowConfigId] = useState<string | undefined>();
  const [arrowConfigId, setArrowConfigId] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (id) loadSession();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  // Pulsing dot animation
  useEffect(() => {
    if (session && !session.endTime) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [session?.endTime]);

  const loadSession = async () => {
    const sessions = await getSessions();
    const sess = sessions.find((s) => s.id === id);
    if (sess) {
      setSession(sess);
      setGoal(sess.goal);
      setNotes(sess.notes);
      setBowConfigId(sess.bowConfigId);
      setArrowConfigId(sess.arrowConfigId);
      const allShots = await getShots();
      setSessionShots(allShots.filter((s) => sess.endIds.includes(s.id)));
      if (!sess.endTime) {
        startTimer(new Date(sess.startTime));
      } else {
        const ms = new Date(sess.endTime).getTime() - new Date(sess.startTime).getTime();
        setElapsed(Math.floor(ms / 1000));
      }
    }
  };

  const startTimer = (startTime: Date) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
  };

  const handleStart = async () => {
    const newSession: Session = {
      id: uuid.v4() as string,
      startTime: new Date().toISOString(),
      goal: goal.trim(), totalArrows: 0, endIds: [], notes: notes.trim(),
      bowConfigId, arrowConfigId,
    };
    await saveSession(newSession);
    setSession(newSession);
    startTimer(new Date(newSession.startTime));
  };

  const handleStop = async () => {
    if (!session) return;
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          const updated = { ...session, endTime: new Date().toISOString(), notes: notes.trim() };
          await saveSession(updated);
          setSession(updated);
        },
      },
    ]);
  };

  const handleAddEnd = () => {
    if (!session) return;
    router.push({ pathname: '/shot-detail', params: { sessionId: session.id } });
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Session', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSession(id); router.back(); } },
    ]);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isActive = session && !session.endTime;

  // Pre-session view
  if (!session) {
    return (
      <>
        <Stack.Screen
          options={{ title: 'NEW SESSION', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }}
        />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <AnimatedEntry>
            <LinearGradient
              colors={[...gradients.heroBg] as [string, string, ...string[]]}
              style={styles.preStart}
            >
              <Ionicons name="timer" size={64} color={colors.primary} />
              <Text style={styles.preStartTitle}>Start a Practice Session</Text>
              <Text style={styles.preStartSub}>Set your gear, goal, and start tracking</Text>
            </LinearGradient>
          </AnimatedEntry>

          <AnimatedEntry delay={80}>
            <Text style={styles.label}>EQUIPMENT</Text>
            <EquipmentPicker
              selectedBowId={bowConfigId} selectedArrowId={arrowConfigId}
              onBowSelect={setBowConfigId} onArrowSelect={setArrowConfigId}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={140}>
            <Text style={styles.label}>SESSION GOAL (optional)</Text>
            <TextInput
              style={styles.input} value={goal} onChangeText={setGoal}
              placeholder='e.g., "Shoot 120 arrows" or "Maintain 9+ avg"'
              placeholderTextColor={colors.textMuted}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <Text style={styles.label}>NOTES</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="Any notes for this session..."
              placeholderTextColor={colors.textMuted} multiline
            />
          </AnimatedEntry>

          <AnimatedEntry delay={260}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <LinearGradient
                colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Ionicons name="play" size={24} color={colors.background} />
                <Text style={styles.startBtnText}>START SESSION</Text>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isActive ? 'ACTIVE SESSION' : 'SESSION',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash" size={22} color={colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Timer */}
        <AnimatedEntry>
          <View style={styles.timerSection}>
            {isActive && (
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
            )}
            <Text style={[styles.timer, isActive && { color: colors.primary }]}>
              {formatTime(elapsed)}
            </Text>
            {session.goal ? (
              <Text style={styles.goalText}>
                <Ionicons name="flag" size={14} color={colors.secondary} /> {session.goal}
              </Text>
            ) : null}
          </View>
        </AnimatedEntry>

        {/* Stats */}
        <AnimatedEntry delay={80}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <LinearGradient
                colors={[...gradients.primaryFade] as [string, string]}
                style={styles.statGradient}
              >
                <Text style={[styles.statValue, { color: colors.primary }]}>{session.totalArrows}</Text>
                <Text style={styles.statLabel}>Arrows</Text>
              </LinearGradient>
            </View>
            <View style={styles.statBox}>
              <LinearGradient
                colors={[...gradients.secondaryFade] as [string, string]}
                style={styles.statGradient}
              >
                <Text style={[styles.statValue, { color: colors.secondary }]}>{session.endIds.length}</Text>
                <Text style={styles.statLabel}>Ends</Text>
              </LinearGradient>
            </View>
          </View>
        </AnimatedEntry>

        {/* Actions */}
        {isActive && (
          <AnimatedEntry delay={140}>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]} onPress={handleAddEnd}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '05'] as [string, string]}
                  style={styles.actionBtnInner}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Log End</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.danger }]} onPress={handleStop}>
                <LinearGradient
                  colors={[colors.danger + '20', colors.danger + '05'] as [string, string]}
                  style={styles.actionBtnInner}
                >
                  <Ionicons name="stop-circle" size={24} color={colors.danger} />
                  <Text style={[styles.actionBtnText, { color: colors.danger }]}>End Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </AnimatedEntry>
        )}

        {/* Notes */}
        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={async (text) => {
            setNotes(text);
            if (session) {
              const updated = { ...session, notes: text };
              setSession(updated);
              await saveSession(updated);
            }
          }}
          placeholder="Session notes..." placeholderTextColor={colors.textMuted}
          multiline editable={!!isActive}
        />

        {/* Session Shots */}
        {sessionShots.length > 0 && (
          <>
            <Text style={styles.label}>ENDS IN THIS SESSION</Text>
            {sessionShots.map((shot) => {
              const total = shot.scores.reduce((a, b) => a + b, 0);
              return (
                <GradientCard key={shot.id}>
                  <View style={styles.shotRow}>
                    <Text style={styles.shotDistance}>{shot.distance}m</Text>
                    <View style={styles.shotScores}>
                      {shot.scores.map((s, i) => (
                        <Text key={i} style={[styles.shotScore, { color: s >= 9 ? colors.primary : s >= 7 ? colors.secondary : colors.textSecondary }]}>
                          {s === 10 ? 'X' : s}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.shotTotal}>{total}</Text>
                  </View>
                </GradientCard>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  preStart: { alignItems: 'center', paddingVertical: spacing.xl, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  preStartTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  preStartSub: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  label: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
  },
  startBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  startBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  startBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  timerSection: { alignItems: 'center', paddingVertical: spacing.lg },
  liveDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, marginBottom: spacing.sm },
  timer: { fontSize: fontSize.hero, fontWeight: '900', color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  goalText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statBox: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  statGradient: { padding: spacing.md, alignItems: 'center', borderRadius: borderRadius.md },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginTop: spacing.xs },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, borderRadius: borderRadius.md, borderWidth: 1, overflow: 'hidden' },
  actionBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  actionBtnText: { fontSize: fontSize.md, fontWeight: '700' },
  shotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shotDistance: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, width: 50 },
  shotScores: { flexDirection: 'row', gap: spacing.xs, flex: 1, justifyContent: 'center' },
  shotScore: { fontSize: fontSize.md, fontWeight: '700' },
  shotTotal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.secondary, width: 40, textAlign: 'right' },
});
