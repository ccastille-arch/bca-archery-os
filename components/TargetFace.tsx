import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import type { ArrowImpact } from '../lib/ballistics';

export type TargetType = 'vegas-3spot' | '5-spot' | 'asa-3d' | 'fita' | 'standard';

interface Props {
  impacts: ArrowImpact[];
  onTap: (x: number, y: number) => void;
  size?: number;
  targetType?: TargetType;
  showHeatMap?: boolean;
  currentArrow?: number;
}

// FITA / WA outdoor full-size target colors (outside→in)
// White, White, Black, Black, Blue, Blue, Red, Red, Gold, Gold, X
const FITA_RING_COLORS = [
  '#FFFFFF', '#FFFFFF',  // 1, 2
  '#222222', '#222222',  // 3, 4
  '#00A3FF', '#00A3FF',  // 5, 6
  '#FF4444', '#FF4444',  // 7, 8
  '#FFD700', '#FFD700',  // 9, 10
];

export default function TargetFace({ impacts, onTap, size = 300, targetType = 'standard', showHeatMap = false, currentArrow = 0 }: Props) {
  const handlePress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    // For non-circular targets, use the full rectangle
    const isRect = targetType === 'vegas-3spot' || targetType === '5-spot';
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    const nx = (locationX - centerX) / radius;
    const ny = -(locationY - centerY) / radius;
    onTap(nx, ny);
  };

  // Render a single concentric ring target at offset position
  const renderSingleTarget = (cx: number, cy: number, targetSize: number, ringColors: string[]) => {
    const rings = [];
    const numRings = ringColors.length;
    for (let i = numRings; i >= 1; i--) {
      const ringSize = (targetSize * i) / numRings;
      rings.push(
        <View key={`ring-${cx}-${cy}-${i}`} style={{
          position: 'absolute', width: ringSize, height: ringSize, borderRadius: ringSize / 2,
          backgroundColor: ringColors[numRings - i],
          top: cy - ringSize / 2, left: cx - ringSize / 2,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
        }} />
      );
    }
    // X ring
    const xSize = targetSize * 0.08;
    rings.push(
      <View key={`x-${cx}-${cy}`} style={{
        position: 'absolute', width: xSize, height: xSize, borderRadius: xSize / 2,
        backgroundColor: '#FFD700', borderWidth: 1, borderColor: '#000',
        top: cy - xSize / 2, left: cx - xSize / 2,
      }} />
    );
    return rings;
  };

  const renderTarget = () => {
    // ===== VEGAS 3-SPOT (3 vertical faces) =====
    if (targetType === 'vegas-3spot') {
      const spotSize = size * 0.28;
      const vegasColors = ['#FFFFFF', '#FFFFFF', '#222222', '#222222', '#00A3FF', '#00A3FF', '#FF4444', '#FF4444', '#FFD700', '#FFD700'];
      const centers = [
        { x: size * 0.5, y: size * 0.2 },
        { x: size * 0.5, y: size * 0.5 },
        { x: size * 0.5, y: size * 0.8 },
      ];
      return (
        <>
          {/* Background */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, backgroundColor: '#F5F5DC' }} />
          {/* Labels */}
          <Text style={{ position: 'absolute', top: size * 0.2 - spotSize / 2 - 14, left: size * 0.5 - 6, fontSize: 10, fontWeight: '800', color: '#888' }}>1</Text>
          <Text style={{ position: 'absolute', top: size * 0.5 - spotSize / 2 - 14, left: size * 0.5 - 6, fontSize: 10, fontWeight: '800', color: '#888' }}>2</Text>
          <Text style={{ position: 'absolute', top: size * 0.8 - spotSize / 2 - 14, left: size * 0.5 - 6, fontSize: 10, fontWeight: '800', color: '#888' }}>3</Text>
          {centers.flatMap((c) => renderSingleTarget(c.x, c.y, spotSize, vegasColors))}
        </>
      );
    }

    // ===== 5-SPOT (NFAA Indoor) =====
    if (targetType === '5-spot') {
      const spotSize = size * 0.22;
      const spotColors = ['#FFFFFF', '#222222', '#222222', '#00A3FF', '#FFD700'];
      const centers = [
        { x: size * 0.5, y: size * 0.18 },      // top
        { x: size * 0.22, y: size * 0.45 },      // mid-left
        { x: size * 0.78, y: size * 0.45 },      // mid-right
        { x: size * 0.32, y: size * 0.78 },      // bot-left
        { x: size * 0.68, y: size * 0.78 },      // bot-right
      ];
      return (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, backgroundColor: '#F5F5DC' }} />
          {centers.map((c, idx) => (
            <Text key={`lbl-${idx}`} style={{ position: 'absolute', top: c.y - spotSize / 2 - 12, left: c.x - 4, fontSize: 9, fontWeight: '800', color: '#888' }}>{idx + 1}</Text>
          ))}
          {centers.flatMap((c) => renderSingleTarget(c.x, c.y, spotSize, spotColors))}
        </>
      );
    }

    // ===== ASA 3D RINGS (correct format) =====
    if (targetType === 'asa-3d') {
      // ASA scoring: 5 (body), 8 (large outer ring), 10 (inner ring),
      // inside the 10: upper 12, center 10, lower 12 (3 small circles)
      // 14 ring: small circle off to the side of the 8 ring
      const cx = size * 0.48;  // slightly left of center (14 is on right)
      const cy = size * 0.48;
      const bodyW = size * 0.82;
      const bodyH = size * 0.6;

      // Ring sizes
      const ring8W = size * 0.48;
      const ring8H = size * 0.38;
      const ring10W = size * 0.30;
      const ring10H = size * 0.24;

      // Inner 3 circles (upper 12, center 10, lower 12)
      const innerR = size * 0.055;

      // 14 ring (off to the right side)
      const ring14R = size * 0.035;

      return (
        <>
          {/* 5 — Body / foam background */}
          <View style={{
            position: 'absolute', top: cy - bodyH / 2, left: cx - bodyW / 2,
            width: bodyW, height: bodyH, borderRadius: size * 0.12,
            backgroundColor: '#8B7355', borderWidth: 1, borderColor: '#6B5335',
          }} />
          {/* 5 label */}
          <Text style={{ position: 'absolute', top: cy - bodyH / 2 + 6, left: cx - bodyW / 2 + 10, fontSize: 11, fontWeight: '900', color: '#FFF' }}>5</Text>

          {/* 8 ring — large oval */}
          <View style={{
            position: 'absolute', top: cy - ring8H / 2, left: cx - ring8W / 2,
            width: ring8W, height: ring8H, borderRadius: ring8H / 2,
            backgroundColor: '#444444', borderWidth: 2, borderColor: '#666',
          }} />
          {/* 8 label */}
          <Text style={{ position: 'absolute', top: cy - ring8H / 2 + 4, left: cx - ring8W / 2 + 8, fontSize: 10, fontWeight: '900', color: '#CCC' }}>8</Text>

          {/* 10 ring — inside the 8 */}
          <View style={{
            position: 'absolute', top: cy - ring10H / 2, left: cx - ring10W / 2,
            width: ring10W, height: ring10H, borderRadius: ring10H / 2,
            backgroundColor: '#222222', borderWidth: 2, borderColor: '#00A3FF',
          }} />
          {/* 10 label */}
          <Text style={{ position: 'absolute', top: cy - ring10H / 2 + 3, left: cx + ring10W / 2 - 16, fontSize: 9, fontWeight: '900', color: '#00A3FF' }}>10</Text>

          {/* Upper 12 — small circle inside top of 10 ring */}
          <View style={{
            position: 'absolute',
            top: cy - ring10H / 2 + ring10H * 0.12,
            left: cx - innerR,
            width: innerR * 2, height: innerR * 2, borderRadius: innerR,
            backgroundColor: '#FF4444', borderWidth: 1.5, borderColor: '#FF6666',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF' }}>12</Text>
          </View>

          {/* Center 10 — small circle in center of 10 ring */}
          <View style={{
            position: 'absolute',
            top: cy - innerR,
            left: cx - innerR,
            width: innerR * 2, height: innerR * 2, borderRadius: innerR,
            backgroundColor: '#FFD700', borderWidth: 1.5, borderColor: '#FFAA00',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: '#000' }}>10</Text>
          </View>

          {/* Lower 12 — small circle inside bottom of 10 ring */}
          <View style={{
            position: 'absolute',
            top: cy + ring10H / 2 - ring10H * 0.12 - innerR * 2,
            left: cx - innerR,
            width: innerR * 2, height: innerR * 2, borderRadius: innerR,
            backgroundColor: '#FF4444', borderWidth: 1.5, borderColor: '#FF6666',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF' }}>12</Text>
          </View>

          {/* 14 ring — small circle off to the right side of the 8 ring */}
          <View style={{
            position: 'absolute',
            top: cy + ring8H / 2 - ring14R * 2,
            left: cx + ring8W / 2 + size * 0.02,
            width: ring14R * 2, height: ring14R * 2, borderRadius: ring14R,
            backgroundColor: '#00FF88', borderWidth: 1.5, borderColor: '#00CC66',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: '#000' }}>14</Text>
          </View>
        </>
      );
    }

    // ===== FITA / WA Outdoor =====
    if (targetType === 'fita') {
      return (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, backgroundColor: '#F5F5DC' }} />
          {renderSingleTarget(size / 2, size / 2, size * 0.92, FITA_RING_COLORS)}
          {/* Ring numbers */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const dist = (size * 0.92 / 2) * (1 - (n - 0.5) / 10);
            const textColor = n <= 2 ? '#000' : n <= 4 ? '#FFF' : n <= 6 ? '#FFF' : n <= 8 ? '#FFF' : '#000';
            return (
              <Text key={`num-${n}`} style={{
                position: 'absolute', top: size / 2 - 6, left: size / 2 + dist - 4,
                fontSize: 8, fontWeight: '700', color: textColor, opacity: 0.6,
              }}>{n}</Text>
            );
          })}
        </>
      );
    }

    // ===== STANDARD (default single spot) =====
    const stdColors = ['#FFFFFF', '#FFFFFF', '#222222', '#222222', '#00A3FF', '#00A3FF', '#FF4444', '#FF4444', '#FFD700', '#FFD700'];
    return renderSingleTarget(size / 2, size / 2, size * 0.92, stdColors);
  };

  const renderImpacts = () => {
    return impacts.map((impact, i) => {
      const cx = (impact.x * size / 2) + size / 2;
      const cy = (-impact.y * size / 2) + size / 2;
      const isLatest = i === impacts.length - 1;
      const dotSize = isLatest ? 14 : 10;

      return (
        <View key={i} style={[styles.impactDot, {
          backgroundColor: isLatest ? colors.primary : '#FF4444',
          borderColor: isLatest ? '#FFF' : 'rgba(255,255,255,0.7)',
          width: dotSize, height: dotSize, borderRadius: dotSize / 2,
          left: cx - dotSize / 2, top: cy - dotSize / 2,
        }]}>
          <Text style={[styles.impactNum, { fontSize: isLatest ? 8 : 6 }]}>{impact.arrowNum}</Text>
        </View>
      );
    });
  };

  const renderHeatMap = () => {
    if (!showHeatMap || impacts.length < 3) return null;
    return impacts.map((impact, i) => {
      const cx = (impact.x * size / 2) + size / 2;
      const cy = (-impact.y * size / 2) + size / 2;
      return (
        <View key={`heat-${i}`} style={{
          position: 'absolute', left: cx - 20, top: cy - 20,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.primary + '15',
        }} />
      );
    });
  };

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

  // Use square shape for multi-spot targets, circle for single targets
  const isSquare = targetType === 'vegas-3spot' || targetType === '5-spot' || targetType === 'asa-3d';

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {impacts.length === 0 ? 'Tap where arrow #1 hit' : `Tap where arrow #${currentArrow + 1} hit`}
      </Text>
      <Pressable
        onPress={handlePress}
        style={[styles.target, {
          width: size, height: size,
          borderRadius: isSquare ? borderRadius.md : size / 2,
          backgroundColor: isSquare ? '#F5F5DC' : '#DDDDDD',
        }]}
      >
        {renderTarget()}
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
  container: { alignItems: 'center', marginVertical: spacing.md },
  instruction: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  target: { overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: colors.border },
  impactDot: { position: 'absolute', borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  impactNum: { color: '#FFF', fontWeight: '900' },
  groupCenter: { position: 'absolute', width: 16, height: 16, zIndex: 5 },
  shotCount: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
});
