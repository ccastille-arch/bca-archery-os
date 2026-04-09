import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { FORUM_CATEGORIES } from '../lib/types';
import type { ForumPost } from '../lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ForumScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isSupabaseConfigured()) {
        loadPosts();
      }
    }, [])
  );

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, profiles(username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch {
      // Silently fail — posts stay empty
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const filteredPosts = selectedCategory
    ? posts.filter((p) => p.category === selectedCategory)
    : posts;

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'FORUM', headerShown: true }} />
        <View style={styles.notConfigured}>
          <LinearGradient
            colors={[colors.surface, colors.background] as [string, string]}
            style={styles.notConfiguredGradient}
          >
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.notConfiguredTitle}>Connect to Supabase</Text>
            <Text style={styles.notConfiguredText}>
              Connect to Supabase to unlock community features like forums, discussions, and gear reviews.
            </Text>
            <Text style={styles.notConfiguredHint}>
              Open lib/supabase.ts and replace the placeholder URL and anon key with your Supabase project credentials.
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  const renderPost = ({ item }: { item: ForumPost }) => {
    const authorName = item.profiles?.display_name || item.profiles?.username || 'Unknown';

    return (
      <GradientCard
        onPress={() => router.push({ pathname: '/forum-post', params: { id: item.id } })}
        accentColors={[...gradients.cardAccent]}
      >
        {/* Category badge */}
        <View style={styles.postTop}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          {item.image_url && (
            <Ionicons name="image-outline" size={16} color={colors.textMuted} style={{ marginLeft: spacing.xs }} />
          )}
        </View>

        {/* Body preview */}
        <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text>

        {/* Footer */}
        <View style={styles.postFooter}>
          <Text style={styles.postAuthor}>
            <Ionicons name="person-circle" size={12} color={colors.textSecondary} /> {authorName}
          </Text>
          <View style={styles.postStats}>
            <Text style={styles.postStat}>
              <Ionicons name="heart" size={12} color={colors.danger} /> {item.likes_count}
            </Text>
            <Text style={styles.postStat}>
              <Ionicons name="chatbubble" size={12} color={colors.secondary} /> {item.replies_count}
            </Text>
          </View>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'FORUM', headerShown: true }} />

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <AnimatedEntry>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <TouchableOpacity
                style={[styles.chip, !selectedCategory && styles.chipActive]}
                onPress={() => setSelectedCategory(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {FORUM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AnimatedEntry>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to start a discussion!</Text>
            </LinearGradient>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/forum-new')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[...gradients.primaryToSecondary] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  chipRow: { gap: spacing.xs, paddingBottom: spacing.md },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '60',
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.secondary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.secondary },
  postTime: { fontSize: fontSize.xs, color: colors.textMuted },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  postTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flex: 1 },
  postBody: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postAuthor: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  postStats: { flexDirection: 'row', gap: spacing.md },
  postStat: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  notConfigured: { flex: 1, justifyContent: 'center', padding: spacing.md },
  notConfiguredGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  notConfiguredTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  notConfiguredText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  notConfiguredHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
