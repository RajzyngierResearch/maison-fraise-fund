import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, RefreshControl,
  TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePanel } from '../../context/PanelContext';
import { fetchEditorialFeedFiltered } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

const TAGS = [
  { key: 'all', label: 'All' },
  { key: 'harvest', label: 'Harvest' },
  { key: 'portrait', label: 'Portrait' },
  { key: 'criticism', label: 'Criticism' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'essay', label: 'Essay' },
];

export default function EditorialFeedPanel() {
  const { goBack, showPanel, setPanelData } = usePanel();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [pieces, setPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q?: string, tag?: string) => {
    try {
      const data = await fetchEditorialFeedFiltered(q, tag);
      setPieces(data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(query, selectedTag);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(text, selectedTag), 300);
  };

  const handleTagSelect = (tagKey: string) => {
    setSelectedTag(tagKey);
    load(query, tagKey);
  };

  const handleTap = (piece: any) => {
    setPanelData({ pieceId: piece.id });
    showPanel('editorial-piece');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Editorial</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.searchRow, { borderBottomColor: c.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: c.searchBg, color: c.text, fontFamily: fonts.dmMono }]}
          placeholder="Search pieces..."
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tagScroll, { borderBottomColor: c.border }]}
        contentContainerStyle={styles.tagScrollContent}
      >
        {TAGS.map(tag => {
          const isSelected = selectedTag === tag.key;
          return (
            <TouchableOpacity
              key={tag.key}
              style={[
                styles.tagPill,
                isSelected
                  ? { backgroundColor: c.accent, borderColor: c.accent }
                  : { backgroundColor: 'transparent', borderColor: c.border },
              ]}
              onPress={() => handleTagSelect(tag.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { fontFamily: fonts.dmMono, color: isSelected ? '#fff' : c.muted },
                ]}
              >
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pieces}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={pieces.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Text style={styles.emptyKanji}>文</Text>
              <Text style={[styles.emptyText, { color: c.muted, fontFamily: fonts.dmSans }]}>
                No pieces found.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <>
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleTap(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.rowTitle, { color: c.text, fontFamily: fonts.playfair }]}>
                  {item.title}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowAuthor, { color: c.muted, fontFamily: fonts.dmMono }]}>
                    {item.author_display_name ?? 'Anonymous'}
                  </Text>
                  {item.published_at && (
                    <Text style={[styles.rowDate, { color: c.muted, fontFamily: fonts.dmMono }]}>
                      {formatDate(item.published_at)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              {index < pieces.length - 1 && (
                <View style={[styles.divider, { backgroundColor: c.border }]} />
              )}
            </>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: SPACING.sm },
  backBtnText: { fontSize: 22 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold' },
  headerSpacer: { width: 44 },
  searchRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    height: 36,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    fontSize: 14,
  },
  tagScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tagPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagPillText: { fontSize: 12 },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flex: 1 },
  emptyInner: { alignItems: 'center', paddingTop: 80 },
  emptyKanji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16 },
  row: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  rowTitle: { fontSize: 18, marginBottom: SPACING.xs },
  rowMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowAuthor: { fontSize: 13 },
  rowDate: { fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: SPACING.md },
});
