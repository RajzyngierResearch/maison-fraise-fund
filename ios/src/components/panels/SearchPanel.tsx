import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { searchUsers } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function SearchPanel() {
  const { goBack, showPanel, setPanelData } = usePanel();
  const c = useColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    searchUsers(q.trim())
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (user: any) => {
    setPanelData({ userId: user.id });
    showPanel('user-profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.searchRow, { borderBottomColor: c.border }]}>
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }]}
          placeholder="Search by name…"
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : searched && results.length === 0 ? (
        <Text style={[styles.empty, { color: c.muted }]}>No results.</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={u => String(u.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: c.border }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <View style={styles.rowMain}>
                <Text style={[styles.name, { color: c.text }]}>{item.display_name}</Text>
                {item.is_dj && (
                  <Text style={[styles.tag, { color: c.muted }]}>DJ</Text>
                )}
              </View>
              <Text style={[styles.chevron, { color: c.muted }]}>›</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 18, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.playfair },
  headerSpacer: { width: 40 },
  searchRow: { paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: fonts.dmSans },
  empty: { textAlign: 'center', marginTop: 60, fontFamily: fonts.dmSans, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontFamily: fonts.playfair },
  tag: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  chevron: { fontSize: 22 },
});
