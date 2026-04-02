import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchChocolateLocations, fundChocolateLocation } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

function fmtCents(cents: number): string {
  return `CA$${(cents / 100).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
}

function locationDisplayName(loc: any): string {
  if (loc.location_type === 'collab_chocolate' && loc.partner_name) {
    return `MAISON FRAISE × ${(loc.partner_name as string).toUpperCase()}`;
  }
  return (loc.name as string ?? 'UNNAMED').toUpperCase();
}

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
}

export default function ChocolateLocationDetailPanel() {
  const { goBack, panelData } = usePanel();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const c = useColors();

  const businessId: number | null = panelData?.businessId ?? null;
  const initialMode: 'fund' | 'view' = panelData?.mode ?? 'view';

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [mode, setMode] = useState<'fund' | 'view'>(initialMode);
  const [funding, setFunding] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ name: string } | null>(null);

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    try {
      const all = await fetchChocolateLocations();
      const found = all.find((l: any) => l.id === businessId) ?? null;
      setLocation(found);
      if (found?.founding_patron_id != null && initialMode === 'fund') {
        setMode('view');
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [businessId, initialMode]);

  useEffect(() => { load(); }, [load]);

  const handleFund = async () => {
    if (!businessId || funding) return;
    setFunding(true);
    try {
      const result = await fundChocolateLocation(businessId);
      const { error: initErr } = await initPaymentSheet({
        paymentIntentClientSecret: result.client_secret,
        merchantDisplayName: 'Maison Fraise',
      });
      if (initErr) throw new Error(initErr.message);
      const { error: payErr } = await presentPaymentSheet();
      if (payErr) {
        if (payErr.code !== 'Canceled') {
          Alert.alert('Payment failed', 'Please try again.');
        }
        return;
      }
      setSuccessInfo({ name: location?.name ?? '' });
      await load();
    } catch (e: any) {
      Alert.alert('Could not fund location', e.message ?? 'Please try again.');
    } finally {
      setFunding(false);
    }
  };

  const isAlreadyFounded = !!location?.founding_patron_id;
  const isCollab = location?.location_type === 'collab_chocolate';
  const operatingCents: number = location?.operating_cost_cents ?? 0;

  const founderHandle = location?.founder_handle ?? null;
  const founderToYear = location?.founder_to_year ?? null;

  const headerTitle =
    mode === 'fund'
      ? 'inaugurate a chocolate shop'
      : (location ? locationDisplayName(location).toLowerCase() : 'chocolate shop');

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {headerTitle}
          </Text>
          {loading && <BlinkingCursor />}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.separator, { color: c.border }]}>
          {'────────────────────────────────'}
        </Text>

        {loading && <ActivityIndicator color={c.accent} style={{ marginTop: 20 }} />}

        {/* VIEW MODE */}
        {!loading && location && mode === 'view' && (
          <>
            {location.address ? (
              <Text style={[styles.address, { color: c.muted }]}>{location.address}</Text>
            ) : null}

            {isCollab ? (
              <Text style={[styles.statusLine, { color: c.text }]}>
                {locationDisplayName(location)}
              </Text>
            ) : (
              <Text style={[styles.statusLine, { color: c.text }]}>
                {'MAISON FRAISE'}
                {founderHandle ? ` · Founded by @${founderHandle}` : ''}
                {founderToYear ? ` · ends ${founderToYear}` : ''}
              </Text>
            )}

            <Text style={[styles.description, { color: c.muted }]}>
              {'Chocolate-covered strawberries available here.'}
            </Text>
            <Text style={[styles.description, { color: c.muted }]}>
              {'Excess payment on purchase mints a chocolate token.'}
            </Text>

            <Text style={[styles.separator, { color: c.border }]}>
              {'────────────────────────────────'}
            </Text>
          </>
        )}

        {/* FUND MODE */}
        {!loading && location && mode === 'fund' && (
          <>
            {/* Success state */}
            {successInfo && (
              <>
                <Text style={[styles.successLine, { color: c.text }]}>
                  {'OK: location inaugurated_'}
                </Text>
                <Text style={[styles.successMeta, { color: c.muted }]}>
                  {`    ${successInfo.name} · 10-year founding term`}
                </Text>
                <Text style={[styles.successMeta, { color: c.muted }]}>
                  {'    Provenance token minted.'}
                </Text>
                <Text style={[styles.separator, { color: c.border }]}>
                  {'────────────────────────────────'}
                </Text>
              </>
            )}

            {/* Already funded */}
            {isAlreadyFounded && !successInfo && (
              <Text style={[styles.mutedNotice, { color: c.muted }]}>
                {'This location has already been inaugurated.'}
              </Text>
            )}

            {/* Fund form */}
            {!isAlreadyFounded && !successInfo && (
              <>
                <Text style={[styles.locName, { color: c.text }]}>
                  {(location.name ?? '').toUpperCase()}
                </Text>
                {location.address ? (
                  <Text style={[styles.address, { color: c.muted }]}>{location.address}</Text>
                ) : null}

                <Text style={[styles.separator, { color: c.border }]}>
                  {'────────────────────────────────'}
                </Text>

                <Text style={[styles.commitLine, { color: c.text }]}>
                  {'10-year operating commitment'}
                </Text>
                {operatingCents > 0 && (
                  <Text style={[styles.amountLine, { color: c.text }]}>
                    {fmtCents(operatingCents)}
                  </Text>
                )}

                <Text style={[styles.termNote, { color: c.muted }]}>
                  {'Your name exists only in the platform\nprovenance record. Not on the shop itself.'}
                </Text>
                <Text style={[styles.termNote, { color: c.muted }]}>
                  {'This is a Maison Fraise location.\nYou are funding its existence.'}
                </Text>

                <Text style={[styles.separator, { color: c.border }]}>
                  {'────────────────────────────────'}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.confirmRow,
                    { borderColor: c.accent, opacity: funding ? 0.6 : 1 },
                  ]}
                  onPress={handleFund}
                  disabled={funding}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.confirmText, { color: c.accent }]}>
                    {funding
                      ? '…'
                      : `> CONFIRM — ${operatingCents > 0 ? fmtCents(operatingCents) : ''}_ `}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.termSmall, { color: c.muted }]}>
                  {'Paid in full · irrevocable · 10 years.'}
                </Text>

                <Text style={[styles.separator, { color: c.border }]}>
                  {'────────────────────────────────'}
                </Text>
              </>
            )}
          </>
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
  headerTitle: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 1.5, flex: 1 },
  headerSpacer: { width: 40 },

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 6 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11, marginVertical: 4 },

  address: { fontFamily: fonts.dmMono, fontSize: 12 },
  statusLine: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 0.5 },
  description: { fontFamily: fonts.dmMono, fontSize: 12, lineHeight: 18 },

  locName: { fontFamily: fonts.dmMono, fontSize: 13, letterSpacing: 1 },
  commitLine: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 0.5 },
  amountLine: { fontFamily: fonts.dmMono, fontSize: 16, letterSpacing: 1 },
  termNote: { fontFamily: fonts.dmMono, fontSize: 11, lineHeight: 17 },
  termSmall: { fontFamily: fonts.dmMono, fontSize: 11 },

  confirmRow: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  confirmText: { fontFamily: fonts.dmMono, fontSize: 13, letterSpacing: 1 },

  successLine: { fontFamily: fonts.dmMono, fontSize: 13, letterSpacing: 1 },
  successMeta: { fontFamily: fonts.dmMono, fontSize: 12 },
  mutedNotice: { fontFamily: fonts.dmMono, fontSize: 12 },
});
