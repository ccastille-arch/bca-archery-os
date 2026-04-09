import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { Session } from '../lib/types';

interface Props {
  session: Session;
  onPress?: () => void;
}

export default function SessionCard({ session, onPress }: Props) {
  const start = new Date(session.startTime);
  const end = session.endTime ? new Date(session.endTime) : null;
  const durationMs = end ? end.getTime() - start.getTime() : Date.now() - start.getTime();
  const mins = Math.floor(durationMs / 60000);
  const isActive = !session.endTime;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {isActive && (
            <View style={styles.liveDot} />
          )}
          <Text style={styles.date}>
            {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.duration, isActive && { color: colors.primary }]}>
          {mins}m
        </Text>
      </View>
      {session.goal ? (
        <Text style={styles.goal} numberOfLines={1}>
          <Ionicons name="flag" size={12} color={colors.secondary} /> {session.goal}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.stat}>
          <Ionicons name="arrow-up" size={12} color={colors.primary} /> {session.totalArrows} arrows
        </Text>
        <Text style={styles.stat}>
          {session.endIds.length} ends
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  date: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  duration: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.secondary,
  },
  goal: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
