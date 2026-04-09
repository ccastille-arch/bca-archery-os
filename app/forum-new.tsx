import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import AnimatedEntry from '../components/AnimatedEntry';
import { FORUM_CATEGORIES } from '../lib/types';

export default function ForumNewScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>(FORUM_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your post.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Body', 'Please write something in the post body.');
      return;
    }

    setPosting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not Signed In', 'Please log in to create a post.');
        setPosting(false);
        return;
      }

      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: title.trim(),
        body: body.trim(),
        category,
        image_url: imageUrl.trim() || null,
      });

      if (error) throw error;

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create post.');
    } finally {
      setPosting(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'NEW POST', headerShown: true }} />
        <View style={styles.notConfigured}>
          <LinearGradient
            colors={[colors.surface, colors.background] as [string, string]}
            style={styles.notConfiguredGradient}
          >
            <Ionicons name="create-outline" size={64} color={colors.textMuted} />
            <Text style={styles.notConfiguredTitle}>Connect to Supabase</Text>
            <Text style={styles.notConfiguredText}>
              Connect to Supabase to unlock community features like creating forum posts.
            </Text>
            <Text style={styles.notConfiguredHint}>
              Open lib/supabase.ts and replace the placeholder URL and anon key with your Supabase project credentials.
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'NEW POST', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AnimatedEntry>
          <View style={styles.form}>
            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Body */}
            <Text style={styles.label}>Body</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Share details, ask a question, or start a discussion..."
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {FORUM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Image URL */}
            <Text style={styles.label}>Image URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://... (paste image link)"
              placeholderTextColor={colors.textMuted}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />
            <Text style={styles.hintText}>
              Image upload coming soon. For now, paste a direct link to an image.
            </Text>

            {/* Post button */}
            <TouchableOpacity onPress={handlePost} activeOpacity={0.8} disabled={posting}>
              <LinearGradient
                colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.postBtn, posting && { opacity: 0.6 }]}
              >
                <Ionicons name="send" size={18} color={colors.background} />
                <Text style={styles.postBtnText}>
                  {posting ? 'Posting...' : 'Post'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },
  form: { gap: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    padding: spacing.md,
  },
  bodyInput: { minHeight: 160 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
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
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  postBtnText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.background,
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
