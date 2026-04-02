import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchPatronage, claimPatronage } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';
import { PatronTokenCard } from '../PatronTokenCard';

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
}

function fmtCents(cents: number): string {
  return `CA$${(cents / 100).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
}

const YEAR_OPTIONS: Array<1 | 2 | 3 | 5 | 10> = [1, 2, 3, 5, 10];

export default function PatronageDetailPanel() {
  const { goBack, panelData } = usePanel();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const c = useColors();

  const patronageId: number | null = panelData?.patronageId ?? null;

  const [loading, setLoading] = useState(true);
  const [patronage, setPatronage] = useState<any>(null);
  const [selectedYears, setSelectedYears] = useState<1 | 2 | 3 | 5 | 10 | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ years: number; locationName: string; yearList: number[] } | null>(null);

  const load = useCallback(async () => {
    if (!patronageId) { setLoading(false); return; }
    try {
      const data = await fetchPatronage(patronageId);
      setPatronage(data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [patronageId]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async () => {
    if (!patronageId || !selectedYears || claiming) return;
    setClaiming(true);
    try {
      const result = await claimPatronage(patronageId, selectedYears);
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
      // Success
      const startYear = patronage?.season_year ?? new Date().getFullYear();
      const yearList = Array.from({ length: selectedYears }, (_, i) => startYear + i);
      setSuccessInfo({
        years: selectedYears,
        locationName: patronage?.location_name ?? '',
        yearList,
      });
      await load();
    } catch (e: any) {
      Alert.alert('Could not claim patronage', e.message ?? 'Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const isClaimed = !!patronage?.is_claimed;
  const pricePerYear: number = patronage?.price_per_year_cents ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>{'season patronage'}</Text>
          {loading && <BlinkingCursor />}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

        {!loading && patronage && (
          <>
            <Text style={[styles.locationName, { color: c.text }]}>
              {(patronage.location_name ?? '').toUpperCase()}
            </Text>
            <Text style={[styles.seasonLabel, { color: c.muted }]}>
              {`Season ${patronage.season_year ?? '—'}`}
            </Text>

            <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

            {/* Success state */}
            {successInfo && (
              <>
                <Text style={[styles.successLine, { color: c.text }]}>
                  {'OK: patronage claimed_'}
                </Text>
                <Text style={[styles.successMeta, { color: c.muted }]}>
                  {`    ${successInfo.years} patron token${successInfo.years > 1 ? 's' : ''} minted.`}
                </Text>
                <Text style={[styles.successMeta, { color: c.muted }]}>
                  {`    ${successInfo.locationName.toUpperCase()} · ${successInfo.yearList.join(', ')}`}
                </Text>
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
              </>
            )}

            {/* Claimed state */}
            {isClaimed && !successInfo && (
              <>
                <Text style={[styles.claimedBadge, { color: c.accent }]}>
                  {`CLAIMED · Season ${patronage.season_year ?? '—'}`}
                </Text>
                {patronage.patron_handle && (
                  <Text style={[styles.patronMeta, { color: c.muted }]}>
                    {`Patron: @${patronage.patron_handle}`}
                    {patronage.patron_years_start != null && patronage.patron_years_end != null && patronage.patron_years_count != null
                      ? ` (${patronage.patron_years_start}–${patronage.patron_years_end}, ${patronage.patron_years_count} years)`
                      : ''}
                  </Text>
                )}
                {patronage.patron_tokens && patronage.patron_tokens.length > 0 && (
                  <>
                    <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
                    <Text style={[styles.sectionHeader, { color: c.muted }]}>{'PATRON TOKENS'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenRow}>
                      {patronage.patron_tokens.map((pt: any, i: number) => (
                        <PatronTokenCard
                          key={pt.token_id ?? i}
                          data={{
                            tokenId: pt.token_id ?? i,
                            locationName: patronage.location_name ?? '',
                            year: pt.year ?? patronage.season_year ?? 0,
                            patronHandle: patronage.patron_handle ?? '',
                          }}
                        />
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}

            {/* Available state — year selector */}
            {!isClaimed && (
              <>
                <Text style={[styles.pricePerYear, { color: c.text }]}>
                  {`${fmtCents(pricePerYear)} per year`}
                </Text>
                <View style={styles.yearOptions}>
                  {YEAR_OPTIONS.map(yr => {
                    const total = pricePerYear * yr;
                    const isSelected = selectedYears === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.yearRow,
                          isSelected && { borderColor: c.accent },
                        ]}
                        onPress={() => setSelectedYears(yr)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.yearRowText, { color: isSelected ? c.accent : c.text }]}>
                          {`> claim ${yr} year${yr > 1 ? 's' : ''}`}
                        </Text>
                        <Text style={[styles.yearRowAmount, { color: isSelected ? c.accent : c.muted }]}>
                          {fmtCents(total)}
                        </Text>
                        <Text style={[styles.yearRowCursor, { color: isSelected ? c.accent : c.text }]}>_</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>
                <Text style={[styles.legalNote, { color: c.muted }]}>
                  {'Each year mints one patron token.'}
                </Text>
                <Text style={[styles.legalNote, { color: c.muted }]}>
                  {'Annual · paid in full · irrevocable.'}
                </Text>
                <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

                {selectedYears && (
                  <TouchableOpacity
                    style={[styles.confirmBtn, { borderColor: c.accent, opacity: claiming ? 0.5 : 1 }]}
                    onPress={handleClaim}
                    disabled={claiming}
                    activeOpacity={0.75}
                  >
                    {claiming ? (
                      <ActivityIndicator color={c.accent} size="small" />
                    ) : (
                      <Text style={[styles.confirmBtnText, { color: c.accent }]}>
                        {`> CONFIRM — claim ${selectedYears} year${selectedYears > 1 ? 's' : ''} for ${fmtCents(pricePerYear * selectedYears)}_`}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        {!loading && !patronage && (
          <Text style={[styles.errorText, { color: c.muted }]}>{'ERR: patronage not found'}</Text>
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

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 8 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11, marginVertical: 4 },

  locationName: { fontFamily: fonts.dmMono, fontSize: 16, letterSpacing: 1.5 },
  seasonLabel: { fontFamily: fonts.dmMono, fontSize: 12 },

  pricePerYear: { fontFamily: fonts.dmMono, fontSize: 14 },

  yearOptions: { gap: 2 },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  yearRowText: { fontFamily: fonts.dmMono, fontSize: 13, flex: 1 },
  yearRowAmount: { fontFamily: fonts.dmMono, fontSize: 13 },
  yearRowCursor: { fontFamily: fonts.dmMono, fontSize: 13 },

  legalNote: { fontFamily: fonts.dmMono, fontSize: 11 },

  confirmBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  confirmBtnText: { fontFamily: fonts.dmMono, fontSize: 12 },

  claimedBadge: { fontFamily: fonts.dmMono, fontSize: 13, letterSpacing: 1 },
  patronMeta: { fontFamily: fonts.dmMono, fontSize: 12 },
  sectionHeader: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 2 },
  tokenRow: { marginTop: 8 },

  successLine: { fontFamily: fonts.dmMono, fontSize: 13 },
  successMeta: { fontFamily: fonts.dmMono, fontSize: 12 },
  errorText: { fontFamily: fonts.dmMono, fontSize: 12 },
});
