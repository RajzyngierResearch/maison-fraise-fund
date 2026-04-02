import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchPatronages } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fmtCents(cents: number): string {
  return `CA$${(cents / 100).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
}

type Colors = ReturnType<typeof useColors>;

interface PatronageRowProps {
  patronage: any;
  onView: () => void;
  c: Colors;
}

function PatronageRow({ patronage, onView, c }: PatronageRowProps) {
  const isClaimed = !!patronage.is_claimed;

  return (
    <View style={[styles.patronageBlock, { opacity: isClaimed ? 0.65 : 1 }]}>
      <Text style={[styles.patronageDate, { color: c.muted }]}>
        {`[${fmtDate(patronage.created_at ?? new Date().toISOString())}]`}
      </Text>
      <Text style={[styles.patronageName, { color: c.text }]}>
        {(patronage.location_name ?? '').toUpperCase()}
      </Text>
      <Text style={[styles.patronageMeta, { color: c.muted }]}>
        {`Season ${patronage.season_year ?? '—'}`}
        {isClaimed ? ' · CLAIMED' : ''}
      </Text>
      {!isClaimed && patronage.price_per_year_cents != null && (
        <Text style={[styles.patronageMeta, { color: c.muted }]}>
          {`${fmtCents(patronage.price_per_year_cents)} / year`}
        </Text>
      )}
      {isClaimed && patronage.patron_handle && (
        <Text style={[styles.patronageMeta, { color: c.muted }]}>
          {`Patron: @${patronage.patron_handle}`}
        </Text>
      )}
      <TouchableOpacity onPress={onView} activeOpacity={0.7} style={styles.viewAction}>
        <Text style={[styles.viewActionText, { color: c.accent }]}>{'> view_'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatronagesPanel() {
  const { goBack, showPanel } = usePanel();
  const c = useColors();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patronages, setPatronages] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchPatronages();
      setPatronages(data);
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
    load();
  };

  const available = patronages.filter((p: any) => !p.is_claimed);
  const claimed = patronages.filter((p: any) => p.is_claimed);

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>{'season patronages'}</Text>
          {loading && <BlinkingCursor />}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
      >
        <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

        {!loading && patronages.length === 0 && (
          <Text style={[styles.emptyText, { color: c.muted }]}>{'> no patronages listed._'}</Text>
        )}

        {!loading && available.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: c.muted }]}>{'AVAILABLE'}</Text>
            {available.map((p: any) => (
              <PatronageRow
                key={p.id}
                patronage={p}
                onView={() => showPanel('patronage-detail', { patronageId: p.id })}
                c={c}
              />
            ))}
          </>
        )}

        {!loading && claimed.length > 0 && (
          <>
            {available.length > 0 && (
              <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
            )}
            {claimed.map((p: any) => (
              <PatronageRow
                key={p.id}
                patronage={p}
                onView={() => showPanel('patronage-detail', { patronageId: p.id })}
                c={c}
              />
            ))}
          </>
        )}

        <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerPrompt: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 1 },
  headerTitle: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 1.5, flex: 1 },
  headerSpacer: { width: 40 },

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 4 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11, marginVertical: 6 },
  sectionHeader: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  emptyText: { fontFamily: fonts.dmMono, fontSize: 12 },

  patronageBlock: { gap: 3, paddingVertical: 10 },
  patronageDate: { fontFamily: fonts.dmMono, fontSize: 11 },
  patronageName: { fontFamily: fonts.dmMono, fontSize: 14, letterSpacing: 1 },
  patronageMeta: { fontFamily: fonts.dmMono, fontSize: 12 },
  viewAction: { marginTop: 4 },
  viewActionText: { fontFamily: fonts.dmMono, fontSize: 12 },
});
