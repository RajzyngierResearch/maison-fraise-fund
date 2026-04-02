import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { usePanel } from '../../context/PanelContext';
import {
  fetchProfile,
  fetchMyPortalAccess,
  requestPortalAccess,
  fetchPortalContent,
} from '../../lib/api';
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
  return `CA$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PortalSubscriberPanel() {
  const { goBack, panelData } = usePanel();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const c = useColors();

  const ownerId: number | null = panelData?.userId ?? null;
  const requestingInit: boolean = panelData?.requesting ?? false;

  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [accessRecord, setAccessRecord] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [amountCents, setAmountCents] = useState<number>(0);

  const hasAccess = accessRecord && new Date(accessRecord.expires_at) > new Date();

  const load = useCallback(async () => {
    if (!ownerId) { setLoading(false); return; }
    try {
      const [profile, myAccess] = await Promise.all([
        fetchProfile(ownerId).catch(() => null),
        fetchMyPortalAccess().catch(() => []),
      ]);
      setOwnerProfile(profile);
      const found = (myAccess as any[]).find((a: any) => a.owner_id === ownerId || a.portal_owner_id === ownerId);
      setAccessRecord(found ?? null);
      if (found && new Date(found.expires_at) > new Date()) {
        const portalContent = await fetchPortalContent(ownerId).catch(() => []);
        setContent(portalContent);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const handlePurchase = async () => {
    if (!ownerId || purchasing) return;
    setPurchasing(true);
    try {
      const { client_secret, amount_cents } = await requestPortalAccess(ownerId, 'tap');
      setAmountCents(amount_cents);
      const { error: initErr } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'Maison Fraise',
      });
      if (initErr) throw new Error(initErr.message);
      const { error: presentErr } = await presentPaymentSheet();
      if (presentErr) {
        if (presentErr.code !== 'Canceled') {
          Alert.alert('Payment failed', 'Please try again.');
        }
        return;
      }
      // Refresh to show content
      await load();
    } catch (e: any) {
      Alert.alert('ERR: purchase failed', e.message ?? 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const ownerHandle = ownerProfile?.display_name
    ? `@${ownerProfile.display_name.toLowerCase().replace(/\s+/g, '_')}`
    : `@user_${ownerId}`;

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {hasAccess ? `portal: ${ownerHandle}` : 'request portal access'}
          </Text>
          {loading && <BlinkingCursor />}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!loading && (
          <>
            {!hasAccess ? (
              // Purchase view
              <View style={styles.purchaseContainer}>
                <Text style={[styles.ownerHandle, { color: c.text }]}>{ownerHandle}</Text>
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
                <Text style={[styles.priceLabel, { color: c.muted }]}>{'Annual access'}</Text>
                {amountCents > 0 && (
                  <Text style={[styles.priceValue, { color: c.text }]}>{fmtCents(amountCents)}</Text>
                )}
                {amountCents === 0 && (
                  <Text style={[styles.priceHint, { color: c.muted }]}>{'CA$3,000.00'}</Text>
                )}
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
                <Text style={[styles.disclaimer, { color: c.muted }]}>
                  {'This purchase is annual and irrevocable.\nAccess expires one year from payment.'}
                </Text>
                <TouchableOpacity
                  style={styles.actionLine}
                  onPress={handlePurchase}
                  activeOpacity={0.7}
                  disabled={purchasing}
                >
                  <Text style={[styles.actionText, { color: c.accent }]}>
                    {purchasing ? '> processing_' : '> PURCHASE ACCESS_'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Content view
              <>
                <Text style={[styles.expiryText, { color: c.muted }]}>
                  {`expires ${fmtDate(accessRecord.expires_at)}`}
                </Text>
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

                {content.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={[styles.emptyText, { color: c.muted }]}>{'no content yet'}</Text>
                    <BlinkingCursor />
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {content.map((item: any, i: number) => (
                      <View key={item.id ?? i} style={styles.gridItem}>
                        {item.media_url ? (
                          <Image
                            source={{ uri: item.media_url }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.thumbnail, { backgroundColor: c.card }]} />
                        )}
                        {item.type === 'video' && (
                          <View style={styles.playOverlay}>
                            <Text style={styles.playIcon}>{'▶'}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const THUMB_SIZE = 110;

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
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  headerPrompt: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 1 },
  headerTitle: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', flex: 1 },
  headerSpacer: { width: 40 },

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 12 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11, marginVertical: 4 },

  purchaseContainer: { gap: 12 },
  ownerHandle: { fontFamily: fonts.dmMono, fontSize: 18 },
  priceLabel: { fontFamily: fonts.dmMono, fontSize: 12 },
  priceValue: { fontFamily: fonts.dmMono, fontSize: 20 },
  priceHint: { fontFamily: fonts.dmMono, fontSize: 16 },
  disclaimer: { fontFamily: fonts.dmMono, fontSize: 11, lineHeight: 18 },
  actionLine: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontFamily: fonts.dmMono, fontSize: 13 },

  expiryText: { fontFamily: fonts.dmMono, fontSize: 12 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyText: { fontFamily: fonts.dmMono, fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: THUMB_SIZE, height: THUMB_SIZE, position: 'relative' },
  thumbnail: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 4 },
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  playIcon: { color: '#fff', fontSize: 24 },
});
