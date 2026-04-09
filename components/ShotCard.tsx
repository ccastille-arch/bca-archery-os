import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { ShotEnd } from '../lib/types';

interface Props {
  shot: ShotEnd;
  onPress?: () => void;
}

export default function ShotCard({ shot, onPress }: Props) {
  const avg = shot.scores.length > 0
    ? (shot.scores.reduce((a, b) => a + b, 0) / shot.scores.length).toFixed(1)
    : '—';
  const total = shot.scores.reduce((a, b) => a + b, 0);
  const date = new Date(shot.date).toLocaleDateString();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.distance}>{shot.distance}m</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.scores}>
        {shot.scores.map((s, i) => (
          <View
            key={i}
            style={[
              styles.scoreBadge,
              { backgroundColor: s >= 9 ? colors.primary + '30' : s >= 7 ? colors.secondary + '30' : colors.surface },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: s >= 9 ? colors.primary : s >= 7 ? colors.secondary : colors.textSecondary },
              ]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.stat}>
          Total: <Text style={{ color: colors.primary }}>{total}</Text>
        </Text>
        <Text style={styles.stat}>
          Avg: <Text style={{ color: colors.secondary }}>{avg}</Text>
        </Text>
        <Text style={styles.stat}>
          {shot.arrowCount} arrows
        </Text>
      </View>
      {shot.conditions.indoor ? (
        <Text style={styles.condition}>Indoor</Text>
      ) : (
        <Text style={styles.condition}>
          {shot.conditions.weather} / Wind: {shot.conditions.wind}
        </Text>
      )}
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
    marginBottom: spacing.sm,
  },
  distance: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: fontSize.md,
    fontWeight: '700',
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
  condition: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
