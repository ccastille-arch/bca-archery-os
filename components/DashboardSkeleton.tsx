import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonStatRow, SkeletonCard } from './SkeletonLoader';
import { colors, spacing, borderRadius } from '../lib/theme';

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Hero */}
      <SkeletonLoader width="100%" height={120} borderRadius={borderRadius.lg} />

      {/* Stats */}
      <View style={{ marginTop: spacing.lg }}>
        <SkeletonStatRow />
      </View>

      {/* Action grid */}
      <SkeletonLoader width="30%" height={14} style={{ marginTop: spacing.md, marginBottom: spacing.sm }} />
      <View style={styles.grid}>
        <SkeletonLoader width="48%" height={90} />
        <SkeletonLoader width="48%" height={90} />
        <SkeletonLoader width="48%" height={90} />
        <SkeletonLoader width="48%" height={90} />
      </View>

      {/* Recent */}
      <SkeletonLoader width="30%" height={14} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
});
