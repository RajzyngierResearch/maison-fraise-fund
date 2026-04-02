import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePanel } from '../../context/PanelContext';
import { fetchFollowing, fetchFollowersList } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function FollowingListPanel() {
  const { goBack, showPanel, setPanelData } = usePanel();
  const c = useColors();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user_db_id').then(id => {
      if (!id) { setLoading(false); return; }
      const uid = parseInt(id);
      Promise.all([fetchFollowing(uid), fetchFollowersList(uid)])
        .then(([f, fl]) => { setFollowing(f); setFollowers(fl); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const data = tab === 'following' ? following : followers;

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
        <Text style={[styles.title, { color: c.text }]}>Connections</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {(['following', 'followers'] as const).map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabLabel, { color: tab === t ? c.accent : c.muted }]}>
              {t === 'following' ? `Following (${following.length})` : `Followers (${followers.length})`}
            </Text>
            {tab === t && <View style={[styles.tabUnderline, { backgroundColor: c.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <Text style={[styles.empty, { color: c.muted }]}>
          {tab === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={u => String(u.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: c.border }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.name, { color: c.text }]}>{item.display_name}</Text>
              {item.is_dj && <Text style={[styles.djTag, { color: c.muted }]}>DJ</Text>}
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
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 0.5 },
  tabUnderline: { height: 2, width: '60%', borderRadius: 1, marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 60, fontFamily: fonts.dmSans, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  name: { flex: 1, fontSize: 16, fontFamily: fonts.playfair },
  djTag: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  chevron: { fontSize: 22 },
});
