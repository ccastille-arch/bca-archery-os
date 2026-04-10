import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../lib/theme';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({ width, height, borderRadius: br = borderRadius.md, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[{ width: width as any, height, borderRadius: br, backgroundColor: colors.surface, opacity }, style]} />
  );
}

export function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <SkeletonLoader width="40%" height={14} borderRadius={7} />
      <SkeletonLoader width="100%" height={18} borderRadius={9} style={{ marginTop: 8 }} />
      <SkeletonLoader width="70%" height={14} borderRadius={7} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonStatRow() {
  return (
    <View style={skStyles.statRow}>
      <SkeletonLoader width="31%" height={80} />
      <SkeletonLoader width="31%" height={80} />
      <SkeletonLoader width="31%" height={80} />
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: 16, marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
});
