import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getSessions, getBowConfigs, getArrowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Session, BowConfig, ArrowConfig } from '../lib/types';

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getSessions(), getBowConfigs(), getArrowConfigs()]).then(([s, b, a]) => {
        setSessions(s);
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  const getBowName = (id?: string) => bows.find((b) => b.id === id)?.name;
  const getArrowName = (id?: string) => arrows.find((a) => a.id === id)?.name;
  const activeSessions = sessions.filter((s) => !s.endTime);

  const renderSession = ({ item }: { item: Session }) => {
    const start = new Date(item.startTime);
    const end = item.endTime ? new Date(item.endTime) : null;
    const durationMs = end ? end.getTime() - start.getTime() : Date.now() - start.getTime();
    const mins = Math.floor(durationMs / 60000);
    const isActive = !item.endTime;
    const bowName = getBowName(item.bowConfigId);
    const arrowName = getArrowName(item.arrowConfigId);

    return (
      <GradientCard
        onPress={() => router.push({ pathname: '/session-detail', params: { id: item.id } })}
        accentColors={isActive ? [...gradients.primaryToSecondary] : [...gradients.cardAccent]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {isActive && <View style={styles.liveDot} />}
            <Text style={styles.date}>
              {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.duration, isActive && { color: colors.primary }]}>{mins}m</Text>
        </View>
        {(bowName || arrowName) && (
          <View style={styles.gearTags}>
            {bowName && (
              <View style={styles.gearTag}>
                <Ionicons name="fitness" size={10} color={colors.primary} />
                <Text style={styles.gearTagText}>{bowName}</Text>
              </View>
            )}
            {arrowName && (
              <View style={[styles.gearTag, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="arrow-forward" size={10} color={colors.secondary} />
                <Text style={[styles.gearTagText, { color: colors.secondary }]}>{arrowName}</Text>
              </View>
            )}
          </View>
        )}
        {item.goal ? (
          <Text style={styles.goal} numberOfLines={1}>
            <Ionicons name="flag" size={12} color={colors.secondary} /> {item.goal}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.stat}>
            <Ionicons name="arrow-up" size={12} color={colors.primary} /> {item.totalArrows} arrows
          </Text>
          <Text style={styles.stat}>{item.endIds.length} ends</Text>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderSession}
        ListHeaderComponent={
          activeSessions.length > 0 ? (
            <AnimatedEntry>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '05'] as [string, string]}
                style={styles.activeBanner}
              >
                <View style={styles.liveDotBig} />
                <Text style={styles.activeText}>
                  {activeSessions.length} active session{activeSessions.length > 1 ? 's' : ''}
                </Text>
              </LinearGradient>
            </AnimatedEntry>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="timer-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No sessions yet</Text>
              <Text style={styles.emptySubtext}>Tap + to start your first practice session</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/session-detail')} activeOpacity={0.8}>
        <LinearGradient
          colors={[...gradients.primaryToSecondary] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="play" size={24} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  liveDotBig: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  date: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  duration: { fontSize: fontSize.lg, fontWeight: '800', color: colors.secondary },
  gearTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  gearTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  gearTagText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  goal: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
  stat: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  activeText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', elevation: 8, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
