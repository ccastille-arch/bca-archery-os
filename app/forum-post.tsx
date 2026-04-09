import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import AnimatedEntry from '../components/AnimatedEntry';
import type { ForumPost, ForumReply } from '../lib/types';

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

export default function ForumPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isSupabaseConfigured() && id) {
        loadData();
      }
    }, [id])
  );

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Load post
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('id', id)
        .single();

      if (postError) throw postError;
      setPost(postData);
      setLikesCount(postData.likes_count || 0);

      // Check if user liked this post
      if (user) {
        const { data: likeData } = await supabase
          .from('forum_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setLiked(!!likeData);
      }

      // Load replies
      const { data: replyData, error: replyError } = await supabase
        .from('forum_replies')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (replyError) throw replyError;
      setReplies(replyData || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load post.');
    }
  };

  const toggleLike = async () => {
    if (!currentUserId || !id) return;

    try {
      if (liked) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUserId);

        await supabase
          .from('forum_posts')
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq('id', id);

        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        await supabase
          .from('forum_likes')
          .insert({ post_id: id, user_id: currentUserId });

        await supabase
          .from('forum_posts')
          .update({ likes_count: likesCount + 1 })
          .eq('id', id);

        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update like.');
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !currentUserId || !id) return;
    setSending(true);

    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: id,
        user_id: currentUserId,
        body: replyText.trim(),
      });

      if (error) throw error;

      // Update reply count
      await supabase
        .from('forum_posts')
        .update({ replies_count: (post?.replies_count || 0) + 1 })
        .eq('id', id);

      setReplyText('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send reply.');
    } finally {
      setSending(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'POST', headerShown: true }} />
        <View style={styles.notConfigured}>
          <LinearGradient
            colors={[colors.surface, colors.background] as [string, string]}
            style={styles.notConfiguredGradient}
          >
            <Ionicons name="chatbubble-outline" size={64} color={colors.textMuted} />
            <Text style={styles.notConfiguredTitle}>Connect to Supabase</Text>
            <Text style={styles.notConfiguredText}>
              Connect to Supabase to unlock community features like forums and discussions.
            </Text>
            <Text style={styles.notConfiguredHint}>
              Open lib/supabase.ts and replace the placeholder URL and anon key with your Supabase project credentials.
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'POST', headerShown: true }} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </View>
    );
  }

  const authorName = post.profiles?.display_name || post.profiles?.username || 'Unknown';

  const renderReply = ({ item }: { item: ForumReply }) => {
    const replyAuthor = item.profiles?.display_name || item.profiles?.username || 'Unknown';
    return (
      <View style={styles.reply}>
        <View style={styles.replyHeader}>
          <Text style={styles.replyAuthor}>
            <Ionicons name="person-circle" size={12} color={colors.textSecondary} /> {replyAuthor}
          </Text>
          <Text style={styles.replyTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.replyBody}>{item.body}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'POST', headerShown: true }} />

      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderReply}
        ListHeaderComponent={
          <AnimatedEntry>
            <View style={styles.postCard}>
              {/* Category + time */}
              <View style={styles.postTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{post.category}</Text>
                </View>
                <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
              </View>

              {/* Title */}
              <Text style={styles.postTitle}>{post.title}</Text>

              {/* Author */}
              <Text style={styles.postAuthor}>
                <Ionicons name="person-circle" size={14} color={colors.textSecondary} /> {authorName}
              </Text>

              {/* Body */}
              <Text style={styles.postBody}>{post.body}</Text>

              {/* Image */}
              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              ) : null}

              {/* Like button */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.likeBtn} onPress={toggleLike} activeOpacity={0.7}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? colors.danger : colors.textSecondary}
                  />
                  <Text style={[styles.likeText, liked && { color: colors.danger }]}>
                    {likesCount}
                  </Text>
                </TouchableOpacity>

                <View style={styles.replyCountWrap}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.secondary} />
                  <Text style={styles.replyCountText}>{replies.length} replies</Text>
                </View>
              </View>
            </View>

            {/* Replies header */}
            {replies.length > 0 && (
              <Text style={styles.repliesHeader}>Replies</Text>
            )}
          </AnimatedEntry>
        }
        ListEmptyComponent={
          <View style={styles.emptyReplies}>
            <Text style={styles.emptyRepliesText}>No replies yet. Be the first!</Text>
          </View>
        }
      />

      {/* Reply input */}
      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Write a reply..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.4 }]}
          onPress={sendReply}
          activeOpacity={0.7}
          disabled={!replyText.trim() || sending}
        >
          <Ionicons name="send" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.secondary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.secondary },
  postTime: { fontSize: fontSize.xs, color: colors.textMuted },
  postTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  postAuthor: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  postBody: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  likeText: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary },
  replyCountWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  replyCountText: { fontSize: fontSize.sm, color: colors.secondary, fontWeight: '600' },
  repliesHeader: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  reply: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary + '40',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  replyAuthor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  replyTime: { fontSize: fontSize.xs, color: colors.textMuted },
  replyBody: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  emptyReplies: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyRepliesText: { fontSize: fontSize.sm, color: colors.textMuted },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    padding: spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
  },
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
