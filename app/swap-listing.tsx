import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { saveSwapListing, getSwapListings, deleteSwapListing, getUserProfile } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import { SWAP_CATEGORIES } from '../lib/types';
import type { SwapListing } from '../lib/types';

const CONDITIONS: SwapListing['condition'][] = ['new', 'like-new', 'good', 'fair', 'parts'];

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
  parts: 'Parts Only',
};

const CONDITION_COLORS: Record<string, string> = {
  new: '#00FF88',
  'like-new': '#00A3FF',
  good: '#FFB800',
  fair: '#FF8C00',
  parts: '#FF4444',
};

export default function SwapListingScreen() {
  useScreenTracking('swap-listing');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<SwapListing['condition']>('good');
  const [category, setCategory] = useState<string>(SWAP_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [sold, setSold] = useState(false);

  useEffect(() => {
    getUserProfile().then((p) => { if (p) setAuthor(p.displayName || p.username); });
  }, []);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    getSwapListings().then((all) => {
      const existing = all.find((l) => l.id === id);
      if (existing) {
        setTitle(existing.title);
        setPrice(existing.price);
        setCondition(existing.condition);
        setCategory(existing.category);
        setDescription(existing.description);
        setImageUrls(existing.imageUrls);
        setAuthor(existing.author);
        setLocation(existing.location);
        setSold(existing.sold);
      }
    });
  }, [id]));

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setImageUrls((prev) => [...prev, url]);
    setNewImageUrl('');
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Title required', 'Give your listing a title.'); return; }
    if (!price.trim()) { Alert.alert('Price required', 'Enter a price for your listing.'); return; }
    if (!description.trim()) { Alert.alert('Description required', 'Add a description for your listing.'); return; }

    const listing: SwapListing = {
      id: id || (uuid.v4() as string),
      title: title.trim(),
      price: price.trim(),
      condition,
      category,
      description: description.trim(),
      imageUrls,
      author: author.trim() || 'Anonymous',
      location: location.trim(),
      sold,
      createdAt: isEditing ? '' : new Date().toISOString(),
    };

    if (isEditing) {
      const all = await getSwapListings();
      const existing = all.find((l) => l.id === id);
      if (existing) listing.createdAt = existing.createdAt;
    }

    await saveSwapListing(listing);
    trackEvent('swap_listed');
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteSwapListing(id!);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{
        title: isEditing ? 'EDIT LISTING' : 'NEW LISTING',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerRight: isEditing ? () => (
          <TouchableOpacity onPress={handleDelete} style={{ marginRight: spacing.sm }}>
            <Ionicons name="trash" size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : undefined,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AnimatedEntry>
          <Text style={styles.label}>TITLE</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle}
            placeholder="What are you selling?" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        <AnimatedEntry delay={60}>
          <Text style={styles.label}>PRICE</Text>
          <View style={styles.priceRow}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput style={[styles.input, styles.priceInput]} value={price} onChangeText={setPrice}
              placeholder="e.g., 350" placeholderTextColor={colors.textMuted}
              keyboardType="numeric" />
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={120}>
          <Text style={styles.label}>CONDITION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CONDITIONS.map((c) => {
                const active = condition === c;
                const clr = CONDITION_COLORS[c];
                return (
                  <TouchableOpacity key={c}
                    style={[styles.chip, active && { backgroundColor: clr + '20', borderColor: clr }]}
                    onPress={() => setCondition(c)}>
                    <Text style={[styles.chipText, active && { color: clr }]}>{CONDITION_LABELS[c]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </AnimatedEntry>

        <AnimatedEntry delay={180}>
          <Text style={styles.label}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {SWAP_CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </AnimatedEntry>

        <AnimatedEntry delay={240}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            value={description} onChangeText={setDescription}
            placeholder="Describe your item, include any details about wear, use, specs..."
            placeholderTextColor={colors.textMuted} multiline numberOfLines={6} />
        </AnimatedEntry>

        <AnimatedEntry delay={300}>
          <Text style={styles.label}>IMAGE URLS</Text>
          <View style={styles.imageAddRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={newImageUrl} onChangeText={setNewImageUrl}
              placeholder="https://..." placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <TouchableOpacity style={styles.addBtn} onPress={addImageUrl}>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {imageUrls.map((url, i) => (
            <View key={i} style={styles.imageItem}>
              <Ionicons name="image" size={16} color={colors.secondary} />
              <Text style={styles.imageUrlText} numberOfLines={1}>{url}</Text>
              <TouchableOpacity onPress={() => removeImageUrl(i)}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </AnimatedEntry>

        <AnimatedEntry delay={360}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput style={styles.input} value={author} onChangeText={setAuthor}
            placeholder="Display name" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        <AnimatedEntry delay={420}>
          <Text style={styles.label}>LOCATION</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation}
            placeholder="e.g., Baton Rouge, LA" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {isEditing && (
          <AnimatedEntry delay={480}>
            <View style={styles.soldRow}>
              <Text style={styles.soldLabel}>MARK AS SOLD</Text>
              <Switch value={sold} onValueChange={setSold}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={sold ? colors.primary : colors.textMuted} />
            </View>
          </AnimatedEntry>
        )}

        <AnimatedEntry delay={isEditing ? 540 : 480}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={gradients.primaryToSecondary as unknown as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
              <Ionicons name={isEditing ? 'checkmark' : 'pricetag'} size={18} color={colors.text} />
              <Text style={styles.saveBtnText}>{isEditing ? 'SAVE CHANGES' : 'LIST ITEM'}</Text>
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
  chipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pricePrefix: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary },
  priceInput: { flex: 1 },
  imageAddRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addBtn: { padding: spacing.xs },
  imageItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, marginTop: spacing.xs, borderWidth: 1, borderColor: colors.border },
  imageUrlText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
  soldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  soldLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, letterSpacing: 1 },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, letterSpacing: 2 },
});
