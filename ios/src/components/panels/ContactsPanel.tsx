import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchContacts } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function ContactsPanel() {
  const { goBack, showPanel, setPanelData } = usePanel();
  const c = useColors();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleViewProfile = (userId: number) => {
    setPanelData({ userId });
    showPanel('user-profile');
  };

  const handleRequestPortal = (userId: number) => {
    setPanelData({ userId, requesting: true });
    showPanel('portal-subscriber');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {`contacts [${contacts.length}]`}
          </Text>
          {loading && <BlinkingCursor />}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />
        }
      >
        {/* Separator */}
        <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

        {!loading && contacts.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={[styles.prompt, { color: c.accent }]}>{'> '}</Text>
            <Text style={[styles.emptyText, { color: c.muted }]}>no connections yet. tap devices to connect.</Text>
            <BlinkingCursor />
          </View>
        ) : (
          contacts.map((contact: any, i: number) => (
            <View key={contact.id ?? i} style={styles.contactBlock}>
              <View style={styles.contactRow}>
                <Text style={[styles.timestamp, { color: c.muted }]}>
                  {`[${fmtTimestamp(contact.connected_at ?? contact.created_at ?? new Date().toISOString())}]`}
                </Text>
                <Text style={[styles.displayName, { color: c.text }]}>
                  {`@${contact.display_name ?? contact.username ?? 'unknown'}`}
                </Text>
              </View>
              <View style={styles.contactMeta}>
                <Text style={[styles.metaText, { color: c.muted }]}>
                  {[contact.membership_tier, contact.location].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionLine}
                onPress={() => handleViewProfile(contact.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: c.accent }]}>{'> view profile'}</Text>
                <Text style={[styles.actionText, { color: c.accent }]}>_</Text>
              </TouchableOpacity>
              {contact.portal_opted_in && (
                <TouchableOpacity
                  style={styles.actionLine}
                  onPress={() => handleRequestPortal(contact.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, { color: c.accent }]}>{'> request portal access'}</Text>
                  <Text style={[styles.actionText, { color: c.accent }]}>_</Text>
                </TouchableOpacity>
              )}
              {i < contacts.length - 1 && (
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
              )}
            </View>
          ))
        )}
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
  headerTitle: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  headerSpacer: { width: 40 },

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 0 },

  separator: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    marginVertical: SPACING.sm,
  },

  emptyRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  emptyText: { fontFamily: fonts.dmMono, fontSize: 12 },
  prompt: { fontFamily: fonts.dmMono, fontSize: 12 },

  contactBlock: { gap: 4, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  timestamp: { fontFamily: fonts.dmMono, fontSize: 11 },
  displayName: { fontFamily: fonts.dmMono, fontSize: 13 },
  contactMeta: { paddingLeft: 20 },
  metaText: { fontFamily: fonts.dmMono, fontSize: 11 },

  actionLine: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, marginTop: 2 },
  actionText: { fontFamily: fonts.dmMono, fontSize: 12 },
});
