import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePanel } from '../../context/PanelContext';
import { fetchNominationsGiven, fetchNominationsReceived } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function NominationHistoryPanel() {
  const { goBack } = usePanel();
  const c = useColors();
  const [tab, setTab] = useState<'given' | 'received'>('received');
  const [given, setGiven] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user_db_id').then(id => {
      if (!id) { setLoading(false); return; }
      const uid = parseInt(id);
      Promise.all([fetchNominationsGiven(uid), fetchNominationsReceived(uid)])
        .then(([g, r]) => { setGiven(g); setReceived(r); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const data = tab === 'given' ? given : received;

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Nominations</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {(['received', 'given'] as const).map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabLabel, { color: tab === t ? c.accent : c.muted }]}>
              {t === 'received' ? `Received (${received.length})` : `Given (${given.length})`}
            </Text>
            {tab === t && <View style={[styles.tabUnderline, { backgroundColor: c.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <Text style={[styles.empty, { color: c.muted }]}>
          {tab === 'received' ? 'No nominations received yet.' : 'No nominations given yet.'}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {data.map((item, i) => (
            <View key={i} style={[styles.row, { borderBottomColor: c.border }]}>
              <View style={styles.rowMain}>
                <Text style={[styles.popup, { color: c.text }]}>{item.popup_name}</Text>
                <Text style={[styles.person, { color: c.muted }]}>
                  {tab === 'given' ? `→ ${item.nominee_name}` : `← ${item.nominator_name}`}
                </Text>
              </View>
              <Text style={[styles.date, { color: c.muted }]}>{fmtDate(item.popup_starts_at ?? item.created_at)}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
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
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowMain: { flex: 1, gap: 4 },
  popup: { fontSize: 15, fontFamily: fonts.playfair },
  person: { fontSize: 12, fontFamily: fonts.dmSans },
  date: { fontSize: 10, fontFamily: fonts.dmMono, flexShrink: 0 },
});
