import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getSwapListings } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { SwapListing } from '../lib/types';
import { SWAP_CATEGORIES } from '../lib/types';

const CONDITION_COLORS: Record<string, string> = {
  new: '#00FF88',
  'like-new': '#00A3FF',
  good: '#FFB800',
  fair: '#FF8C00',
  parts: '#FF4444',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
  parts: 'Parts Only',
};

type StatusFilter = 'All' | 'For Sale' | 'Sold';

export default function SwapShopScreen() {
  useScreenTracking('swap-shop');
  const router = useRouter();
  const [listings, setListings] = useState<SwapListing[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = useCallback(async () => {
    const all = await getSwapListings();
    setListings(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  useFocusEffect(useCallback(() => { loadListings(); }, [loadListings]));

  const onRefresh = async () => { setRefreshing(true); await loadListings(); setRefreshing(false); };

  const filtered = listings.filter((l) => {
    if (categoryFilter !== 'All' && l.category !== categoryFilter) return false;
    if (statusFilter === 'For Sale' && l.sold) return false;
    if (statusFilter === 'Sold' && !l.sold) return false;
    return true;
  });

  const renderListing = ({ item }: { item: SwapListing }) => {
    const condColor = CONDITION_COLORS[item.condition] || colors.textSecondary;
    return (
      <GradientCard onPress={() => router.push({ pathname: '/swap-listing', params: { id: item.id } })}>
        {item.sold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldOverlayText}>SOLD</Text>
          </View>
        )}
        <View style={styles.cardTop}>
          <View style={styles.badgeRow}>
            <View style={[styles.conditionBadge, { backgroundColor: condColor + '20' }]}>
              <Text style={[styles.conditionText, { color: condColor }]}>{CONDITION_LABELS[item.condition]}</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.secondary }]}>{item.category}</Text>
            </View>
          </View>
          {item.imageUrls.length > 0 && (
            <View style={styles.imageIndicator}>
              <Ionicons name="image" size={14} color={colors.textMuted} />
              <Text style={styles.imageCount}>{item.imageUrls.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.priceText}>${item.price}</Text>
        <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.authorRow}>
            <Ionicons name="person-circle" size={16} color={colors.primary} />
            <Text style={styles.authorText}>{item.author}</Text>
          </View>
          {item.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          ) : null}
        </View>
      </GradientCard>
    );
  };

  const STATUS_OPTIONS: StatusFilter[] = ['All', 'For Sale', 'Sold'];

  return (
    <View style={styles.container}>
      {/* Category filter chips */}
      <View style={styles.filterWrap}>
        <FlatList horizontal showsHorizontalScrollIndicator={false}
          data={['All', ...SWAP_CATEGORIES]} keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, categoryFilter === item && styles.filterChipActive]}
              onPress={() => setCategoryFilter(item)}>
              <Text style={[styles.filterText, categoryFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Status toggle */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt} style={[styles.statusChip, statusFilter === opt && styles.statusChipActive]}
            onPress={() => setStatusFilter(opt)}>
            <Text style={[styles.statusText, statusFilter === opt && styles.statusTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={filtered} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} renderItem={renderListing}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <AnimatedEntry>
            <View style={styles.empty}>
              <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.emptyGradient}>
                <Ionicons name="cart-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyText}>No listings yet</Text>
                <Text style={styles.emptySubtext}>Be the first to list something!</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/swap-listing')}>
                  <LinearGradient colors={gradients.primaryToSecondary as unknown as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnInner}>
                    <Ionicons name="add" size={18} color={colors.text} />
                    <Text style={styles.emptyBtnText}>Create Listing</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </AnimatedEntry>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/swap-listing')} activeOpacity={0.8}>
        <LinearGradient colors={gradients.primaryToSecondary as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color={colors.text} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  statusRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  statusChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.secondary + '20', borderColor: colors.secondary },
  statusText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  statusTextActive: { color: colors.secondary },
  list: { padding: spacing.md, paddingBottom: 100 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexShrink: 1 },
  conditionBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  conditionText: { fontSize: fontSize.xs, fontWeight: '700' },
  categoryBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  categoryText: { fontSize: fontSize.xs, fontWeight: '700' },
  imageIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  imageCount: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  listingTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  priceText: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary, marginBottom: spacing.xs },
  descriptionText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  soldOverlay: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.danger, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomLeftRadius: borderRadius.md, borderTopRightRadius: borderRadius.md, zIndex: 10 },
  soldOverlayText: { fontSize: fontSize.xs, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  emptyBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  emptyBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
