import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { saveForumPost, getUserProfile } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import { FORUM_CATEGORIES } from '../lib/types';
import type { LocalForumPost } from '../lib/types';

export default function ForumNewScreen() {
  useScreenTracking('forum-new');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(FORUM_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    getUserProfile().then((p) => { if (p) setAuthor(p.displayName || p.username); });
  }, []);

  const handlePost = async () => {
    if (!title.trim()) { Alert.alert('Title required', 'Give your post a title.'); return; }
    if (!body.trim()) { Alert.alert('Body required', 'Write something in your post.'); return; }
    const post: LocalForumPost = {
      id: uuid.v4() as string, author: author.trim() || 'Anonymous',
      title: title.trim(), body: body.trim(), category,
      imageUrl: imageUrl.trim() || undefined, likes: 0, replies: 0,
      createdAt: new Date().toISOString(),
    };
    await saveForumPost(post);
    trackEvent('forum_post_created');
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'NEW POST', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AnimatedEntry>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput style={styles.input} value={author} onChangeText={setAuthor}
            placeholder="Display name" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>
        <AnimatedEntry delay={60}>
          <Text style={styles.label}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {FORUM_CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </AnimatedEntry>
        <AnimatedEntry delay={120}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle}
            placeholder="What's on your mind?" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>
        <AnimatedEntry delay={180}>
          <Text style={styles.label}>POST</Text>
          <TextInput style={[styles.input, { minHeight: 160, textAlignVertical: 'top' }]} value={body} onChangeText={setBody}
            placeholder="Share your thoughts, questions, or tips..." placeholderTextColor={colors.textMuted} multiline numberOfLines={8} />
        </AnimatedEntry>
        <AnimatedEntry delay={240}>
          <Text style={styles.label}>IMAGE URL (optional)</Text>
          <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl}
            placeholder="https://..." placeholderTextColor={colors.textMuted} autoCapitalize="none" />
        </AnimatedEntry>
        <AnimatedEntry delay={300}>
          <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
            <LinearGradient colors={['#9B59B6', '#00A3FF'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.postBtnGradient}>
              <Ionicons name="send" size={18} color={colors.text} />
              <Text style={styles.postBtnText}>POST</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: '#9B59B620', borderColor: '#9B59B6' },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#9B59B6' },
  postBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  postBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  postBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, letterSpacing: 2 },
});
