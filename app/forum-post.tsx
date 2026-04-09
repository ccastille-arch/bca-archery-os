import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { getForumPosts, saveForumPost, getForumReplies, saveForumReply, getUserProfile } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { LocalForumPost, LocalForumReply } from '../lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ForumPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<LocalForumPost | null>(null);
  const [replies, setReplies] = useState<LocalForumReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    getUserProfile().then((p) => { if (p) setAuthor(p.displayName || p.username); });
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    const posts = await getForumPosts();
    setPost(posts.find((p) => p.id === id) || null);
    const allReplies = await getForumReplies();
    setReplies(allReplies.filter((r) => r.postId === id).sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleLike = async () => {
    if (!post) return;
    const updated = { ...post, likes: post.likes + 1 };
    await saveForumPost(updated);
    setPost(updated);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !post) return;
    const reply: LocalForumReply = {
      id: uuid.v4() as string, postId: post.id,
      author: author.trim() || 'Anonymous', body: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveForumReply(reply);
    const updated = { ...post, replies: post.replies + 1 };
    await saveForumPost(updated);
    setPost(updated);
    setReplyText('');
    await loadData();
  };

  if (!post) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.textSecondary }}>Loading...</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'POST', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <AnimatedEntry>
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.authorRow}>
                  <Ionicons name="person-circle" size={24} color={colors.primary} />
                  <Text style={styles.authorName}>{post.author}</Text>
                </View>
                <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{post.category}</Text>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>
              {post.imageUrl ? (
                <View style={styles.imgBox}>
                  <Ionicons name="image" size={20} color={colors.textMuted} />
                  <Text style={styles.imgUrl} numberOfLines={1}>{post.imageUrl}</Text>
                </View>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
                  <Ionicons name="heart" size={18} color={colors.danger} />
                  <Text style={styles.likeNum}>{post.likes}</Text>
                </TouchableOpacity>
                <View style={styles.replyStat}>
                  <Ionicons name="chatbubble" size={16} color={colors.secondary} />
                  <Text style={styles.replyStatText}>{replies.length} replies</Text>
                </View>
              </View>
            </View>
          </AnimatedEntry>

          {replies.length > 0 && <Text style={styles.repliesHeader}>REPLIES</Text>}
          {replies.map((reply, i) => (
            <AnimatedEntry key={reply.id} delay={i * 40}>
              <View style={styles.replyCard}>
                <View style={styles.replyHeader}>
                  <View style={styles.authorRow}>
                    <Ionicons name="person-circle" size={18} color={colors.secondary} />
                    <Text style={styles.replyAuthor}>{reply.author}</Text>
                  </View>
                  <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
                </View>
                <Text style={styles.replyBody}>{reply.body}</Text>
              </View>
            </AnimatedEntry>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.replyBar}>
          <TextInput style={styles.replyInput} value={replyText} onChangeText={setReplyText}
            placeholder="Write a reply..." placeholderTextColor={colors.textMuted} multiline />
          <TouchableOpacity style={[styles.sendBtn, !replyText.trim() && { opacity: 0.4 }]}
            onPress={handleReply} disabled={!replyText.trim()}>
            <Ionicons name="send" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  postCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorName: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  timeText: { fontSize: fontSize.xs, color: colors.textMuted },
  catBadge: { backgroundColor: '#9B59B620', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: spacing.sm },
  catText: { fontSize: fontSize.xs, fontWeight: '700', color: '#9B59B6' },
  postTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  postBody: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  imgBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, padding: spacing.sm, marginTop: spacing.md },
  imgUrl: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.danger + '15' },
  likeNum: { fontSize: fontSize.sm, fontWeight: '700', color: colors.danger },
  replyStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  replyStatText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  repliesHeader: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  replyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.secondary },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  replyAuthor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.secondary },
  replyTime: { fontSize: fontSize.xs, color: colors.textMuted },
  replyBody: { fontSize: fontSize.md, color: colors.text, lineHeight: 20 },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  replyInput: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.sm, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#9B59B6', alignItems: 'center', justifyContent: 'center' },
});
