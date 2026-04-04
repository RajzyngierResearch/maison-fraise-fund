import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { usePanel } from '../../context/PanelContext';
import { fetchNfcPending } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

const CHOC: Record<string, string> = {
  guanaja_70: 'guanaja 70%', caraibe_66: 'caraïbe 66%',
  jivara_40: 'jivara 40%', ivoire_blanc: 'ivoire blanc',
};
const FIN: Record<string, string> = {
  plain: 'plain', fleur_de_sel: 'fleur de sel', or_fin: 'or fin',
};

type WriteState = 'idle' | 'writing' | 'done' | 'error';

export default function NfcWritePanel() {
  const { goBack } = usePanel();
  const c = useColors();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState<number | null>(null); // order id being written
  const [writeState, setWriteState] = useState<WriteState>('idle');
  const [writtenIds, setWrittenIds] = useState<Set<number>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    fetchNfcPending()
      .then(setOrders)
      .catch(() => Alert.alert('Error', 'Could not load pending tokens.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const writeToken = async (orderId: number, token: string) => {
    if (writing !== null) return;
    setWriting(orderId);
    setWriteState('writing');
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(token)]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      setWrittenIds(prev => new Set(prev).add(orderId));
      setWriteState('done');
      setTimeout(() => {
        setWriteState('idle');
        setWriting(null);
      }, 1500);
    } catch (err: any) {
      setWriteState('error');
      if (err?.message !== 'UserCancel') {
        Alert.alert('Write failed', 'Hold your phone steady against the tag and try again.');
      }
      setTimeout(() => {
        setWriteState('idle');
        setWriting(null);
      }, 1500);
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const renderItem = ({ item: o }: { item: any }) => {
    const isWritten = writtenIds.has(o.id);
    const isWriting = writing === o.id;
    const detail = [
      CHOC[o.chocolate] ?? o.chocolate,
      FIN[o.finish] ?? o.finish,
      `×${o.quantity}`,
      o.slot_time,
    ].filter(Boolean).join('  ·  ');

    return (
      <View style={[styles.row, { borderBottomColor: c.border, opacity: isWritten ? 0.4 : 1 }]}>
        <View style={styles.rowLeft}>
          <Text style={[styles.variety, { color: c.text }]}>{o.variety_name ?? '—'}</Text>
          <Text style={[styles.detail, { color: c.muted }]}>{detail}</Text>
          <Text style={[styles.token, { color: c.accent }]}>{o.nfc_token}</Text>
          <Text style={[styles.email, { color: c.muted }]}>{o.customer_email}</Text>
        </View>
        <TouchableOpacity
          style={[styles.writeBtn, { borderColor: isWritten ? c.border : c.accent }]}
          onPress={() => writeToken(o.id, o.nfc_token)}
          disabled={writing !== null || isWritten}
          activeOpacity={0.7}
        >
          {isWriting ? (
            writeState === 'done'
              ? <Text style={[styles.writeBtnText, { color: c.accent }]}>✓</Text>
              : writeState === 'error'
                ? <Text style={[styles.writeBtnText, { color: c.muted }]}>✕</Text>
                : <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Text style={[styles.writeBtnText, { color: isWritten ? c.muted : c.accent }]}>
              {isWritten ? '✓' : 'write →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: c.text }]}>write tokens</Text>
          <Text style={[styles.subtitle, { color: c.accent }]}>nfc</Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn} activeOpacity={0.7} disabled={loading}>
          <Text style={[styles.refreshText, { color: c.muted }]}>↺</Text>
        </TouchableOpacity>
      </View>

      {writing !== null && (
        <View style={[styles.scanBanner, { backgroundColor: c.card, borderBottomColor: c.border }]}>
          <Text style={[styles.scanBannerText, { color: c.text }]}>
            {writeState === 'writing' ? 'hold phone to tag...' : writeState === 'done' ? 'written.' : 'failed — try again'}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <Text style={[styles.empty, { color: c.muted }]}>no pending tokens</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: 18, paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { paddingVertical: 4 },
  backArrow: { fontSize: 28, lineHeight: 34 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  title: { textAlign: 'center', fontSize: 17, fontFamily: fonts.playfair },
  subtitle: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1 },
  refreshBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  refreshText: { fontSize: 20, lineHeight: 26 },

  scanBanner: {
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scanBannerText: { fontSize: 12, fontFamily: fonts.dmMono, letterSpacing: 1, textAlign: 'center' },

  empty: { textAlign: 'center', marginTop: 60, fontSize: 13, fontFamily: fonts.dmSans, fontStyle: 'italic' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  rowLeft: { flex: 1, gap: 3 },
  variety: { fontSize: 20, fontFamily: fonts.playfair },
  detail: { fontSize: 10, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
  token: { fontSize: 12, fontFamily: fonts.dmMono, letterSpacing: 2 },
  email: { fontSize: 10, fontFamily: fonts.dmMono },
  writeBtn: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    alignItems: 'center', minWidth: 70,
  },
  writeBtnText: { fontSize: 11, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
});
