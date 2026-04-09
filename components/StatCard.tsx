import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';

interface Props {
  label: string;
  value: string | number;
  accent?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, accent = colors.primary, icon }: Props) {
  return (
    <View style={styles.card}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 100,
  },
  iconWrap: {
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
