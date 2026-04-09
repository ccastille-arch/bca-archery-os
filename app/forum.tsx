import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getForumPosts } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { LocalForumPost } from '../lib/types';
import { FORUM_CATEGORIES } from '../lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'General Discussion': '#00FF88',
  'Equipment Reviews': '#00A3FF',
  'Form & Technique': '#FFB800',
  'Tuning Help': '#9B59B6',
  'Tournament Talk': '#FF8C00',
  'Hunting': '#27AE60',
  'For Sale / Trade': '#E74C3C',
};

export default function ForumScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<LocalForumPost[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    const all = await getForumPosts();
    setPosts(all);
  }, []);

  useFocusEffect(useCallback(() => { loadPosts(); }, [loadPosts]));

  const onRefresh = async () => { setRefreshing(true); await loadPosts(); setRefreshing(false); };

  const filtered = filter === 'All' ? posts : posts.filter((p) => p.category === filter);

  const renderPost = ({ item }: { item: LocalForumPost }) => {
    const catColor = CATEGORY_COLORS[item.category] || colors.textSecondary;
    return (
      <GradientCard onPress={() => router.push({ pathname: '/forum-post', params: { id: item.id } })}>
        <View style={styles.postHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{item.category}</Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text>
        <View style={styles.postFooter}>
          <View style={styles.postAuthor}>
            <Ionicons name="person-circle" size={16} color={colors.primary} />
            <Text style={styles.authorText}>{item.author}</Text>
          </View>
          <View style={styles.postStats}>
            {item.imageUrl ? <Ionicons name="image" size={14} color={colors.textMuted} style={{ marginRight: 8 }} /> : null}
            <Ionicons name="heart" size={14} color={colors.danger} />
            <Text style={styles.statNum}>{item.likes}</Text>
            <Ionicons name="chatbubble" size={14} color={colors.secondary} style={{ marginLeft: 10 }} />
            <Text style={styles.statNum}>{item.replies}</Text>
          </View>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category filters */}
      <View style={styles.filterWrap}>
        <FlatList horizontal showsHorizontalScrollIndicator={false}
          data={['All', ...FORUM_CATEGORIES]} keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList data={filtered} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <AnimatedEntry>
            <View style={styles.empty}>
              <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.emptyGradient}>
                <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>Be the first to start a discussion!</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/forum-new')}>
                  <LinearGradient colors={['#9B59B6', '#00A3FF'] as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnInner}>
                    <Ionicons name="add" size={18} color={colors.text} />
                    <Text style={styles.emptyBtnText}>Create Post</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </AnimatedEntry>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/forum-new')} activeOpacity={0.8}>
        <LinearGradient colors={['#9B59B6', '#00A3FF'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabGradient}>
          <Ionicons name="create" size={24} color={colors.text} />
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
  filterChipActive: { backgroundColor: '#9B59B620', borderColor: '#9B59B6' },
  filterText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: '#9B59B6' },
  list: { padding: spacing.md, paddingBottom: 100 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  categoryBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  categoryText: { fontSize: fontSize.xs, fontWeight: '700' },
  timeAgo: { fontSize: fontSize.xs, color: colors.textMuted },
  postTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  postBody: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  postStats: { flexDirection: 'row', alignItems: 'center' },
  statNum: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', marginLeft: 3 },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  emptyBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  emptyBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#9B59B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
