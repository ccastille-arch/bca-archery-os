import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import type { ArrowImpact } from '../lib/ballistics';

interface Props {
  impacts: ArrowImpact[];
  onTap: (x: number, y: number) => void;
  size?: number;
  targetType?: 'standard' | '3d-vitals' | '5-spot';
  showHeatMap?: boolean;
  currentArrow?: number;
}

const RING_COLORS = [
  '#FFD700', '#FFD700',  // X, 10 (gold)
  '#FF4444', '#FF4444',  // 9, 8 (red)
  '#00A3FF', '#00A3FF',  // 7, 6 (blue)
  '#222222', '#222222',  // 5, 4 (black)
  '#FFFFFF', '#FFFFFF',  // 3, 2 (white)
  '#CCCCCC',             // 1
];

export default function TargetFace({ impacts, onTap, size = 300, targetType = 'standard', showHeatMap = false, currentArrow = 0 }: Props) {
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handlePress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Normalize to -1 to 1
    const nx = (locationX - centerX) / radius;
    const ny = -(locationY - centerY) / radius; // flip Y so up is positive

    onTap(nx, ny);
  };

  const renderRings = () => {
    if (targetType === '3d-vitals') {
      return (
        <>
          {/* Deer silhouette vitals */}
          <View style={[styles.vitalsOuter, { width: size * 0.8, height: size * 0.5, borderRadius: size * 0.15, top: size * 0.25, left: size * 0.1 }]} />
          <View style={[styles.vitalsInner, { width: size * 0.3, height: size * 0.25, borderRadius: size * 0.08, top: size * 0.38, left: size * 0.35 }]} />
          <View style={[styles.vitalsCore, { width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, top: size * 0.44, left: size * 0.44 }]} />
        </>
      );
    }

    if (targetType === '5-spot') {
      const spotSize = size * 0.15;
      const positions = [
        { top: size * 0.15, left: size * 0.5 - spotSize / 2 },
        { top: size * 0.42, left: size * 0.22 - spotSize / 2 },
        { top: size * 0.42, left: size * 0.78 - spotSize / 2 },
        { top: size * 0.7, left: size * 0.32 - spotSize / 2 },
        { top: size * 0.7, left: size * 0.68 - spotSize / 2 },
      ];
      return positions.map((pos, i) => (
        <View key={i} style={[styles.spot, { width: spotSize, height: spotSize, borderRadius: spotSize / 2, ...pos }]}>
          <View style={[styles.spotInner, { width: spotSize * 0.4, height: spotSize * 0.4, borderRadius: spotSize * 0.2 }]} />
        </View>
      ));
    }

    // Standard concentric rings
    const rings = [];
    const numRings = 10;
    for (let i = numRings; i >= 1; i--) {
      const ringSize = (size * i) / numRings;
      const ringColor = RING_COLORS[numRings - i] || '#CCC';
      const textColor = (numRings - i) >= 6 && (numRings - i) <= 7 ? '#FFF' : (numRings - i) >= 8 ? '#000' : '#FFF';
      rings.push(
        <View
          key={i}
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: ringColor,
              position: 'absolute',
              top: (size - ringSize) / 2,
              left: (size - ringSize) / 2,
            },
          ]}
        />
      );
    }
    // X ring
    const xSize = size * 0.06;
    rings.push(
      <View key="x" style={[styles.xRing, {
        width: xSize, height: xSize, borderRadius: xSize / 2,
        top: (size - xSize) / 2, left: (size - xSize) / 2,
      }]} />
    );
    return rings;
  };

  const renderImpacts = () => {
    return impacts.map((impact, i) => {
      const cx = (impact.x * size / 2) + size / 2;
      const cy = (-impact.y * size / 2) + size / 2;
      const isLatest = i === impacts.length - 1;

      return (
        <View
          key={i}
          style={[
            styles.impactDot,
            {
              left: cx - 6,
              top: cy - 6,
              backgroundColor: isLatest ? colors.primary : '#FF4444',
              borderColor: isLatest ? '#FFF' : 'rgba(255,255,255,0.6)',
              width: isLatest ? 14 : 10,
              height: isLatest ? 14 : 10,
              borderRadius: isLatest ? 7 : 5,
              left: cx - (isLatest ? 7 : 5),
              top: cy - (isLatest ? 7 : 5),
            },
          ]}
        >
          <Text style={[styles.impactNum, { fontSize: isLatest ? 8 : 6 }]}>{impact.arrowNum}</Text>
        </View>
      );
    });
  };

  const renderHeatMap = () => {
    if (!showHeatMap || impacts.length < 3) return null;

    // Create a simple heat visualization
    return impacts.map((impact, i) => {
      const cx = (impact.x * size / 2) + size / 2;
      const cy = (-impact.y * size / 2) + size / 2;
      return (
        <View
          key={`heat-${i}`}
          style={{
            position: 'absolute',
            left: cx - 20,
            top: cy - 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + '15',
          }}
        />
      );
    });
  };

  // Center of group indicator
  const renderGroupCenter = () => {
    if (impacts.length < 2) return null;
    const avgX = impacts.reduce((s, i) => s + i.x, 0) / impacts.length;
    const avgY = impacts.reduce((s, i) => s + i.y, 0) / impacts.length;
    const cx = (avgX * size / 2) + size / 2;
    const cy = (-avgY * size / 2) + size / 2;

    return (
      <View style={[styles.groupCenter, { left: cx - 8, top: cy - 8 }]}>
        <Ionicons name="add" size={16} color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {impacts.length === 0 ? 'Tap where arrow #1 hit' : `Tap where arrow #${currentArrow + 1} hit`}
      </Text>
      <Pressable
        onPress={handlePress}
        style={[styles.target, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {renderRings()}
        {renderHeatMap()}
        {renderImpacts()}
        {renderGroupCenter()}
      </Pressable>
      {impacts.length > 0 && (
        <Text style={styles.shotCount}>{impacts.length} arrow{impacts.length !== 1 ? 's' : ''} placed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  instruction: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  target: {
    backgroundColor: '#DDDDDD',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.border,
  },
  ring: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  xRing: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#000',
  },
  vitalsOuter: {
    position: 'absolute',
    backgroundColor: '#8B4513',
    borderWidth: 1,
    borderColor: '#5C3317',
  },
  vitalsInner: {
    position: 'absolute',
    backgroundColor: '#FF4444',
    borderWidth: 1,
    borderColor: '#CC0000',
  },
  vitalsCore: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#CC9900',
  },
  spot: {
    position: 'absolute',
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  spotInner: {
    backgroundColor: '#FFD700',
  },
  impactDot: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  impactNum: {
    color: '#FFF',
    fontWeight: '900',
  },
  groupCenter: {
    position: 'absolute',
    width: 16,
    height: 16,
    zIndex: 5,
  },
  shotCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
