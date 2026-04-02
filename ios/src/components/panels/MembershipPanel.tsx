import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePanel } from '../../context/PanelContext';
import {
  fetchMyMembership,
  createMembershipIntent,
  fetchFundHistory,
  renewMembership,
  joinMembershipWaitlist,
} from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

const TIERS = [
  { key: 'maison', label: 'Maison', price: '$3,000', desc: 'Annual membership', contactUs: false },
  { key: 'reserve', label: 'Réserve', price: '$30,000', desc: 'Annual membership', contactUs: false },
  { key: 'atelier', label: 'Atelier', price: '$300,000', desc: 'Annual membership', contactUs: false },
  { key: 'fondateur', label: 'Fondateur', price: '$3,000,000', desc: 'Contact us', contactUs: true },
  { key: 'patrimoine', label: 'Patrimoine', price: '$30,000,000', desc: 'Contact us', contactUs: true },
  { key: 'souverain', label: 'Souverain', price: '$300,000,000', desc: 'Contact us', contactUs: true },
  { key: 'unnamed', label: '—', price: '$3,000,000,000', desc: 'Contact us', contactUs: true },
];

const HIGH_TIERS = new Set(['fondateur', 'patrimoine', 'souverain', 'unnamed']);

const TIER_ANNUAL_CENTS: Record<string, number> = {
  maison: 300000,
  reserve: 3000000,
  atelier: 30000000,
};

export default function MembershipPanel() {
  const { goBack } = usePanel();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [membership, setMembership] = useState<any | null>(null);
  const [fund, setFund] = useState<{ balance_cents: number; cycle_start: string } | null>(null);
  const [fundHistory, setFundHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState(false);
  // waitlist state: tier key -> 'pending' | 'done'
  const [waitlistState, setWaitlistState] = useState<Record<string, 'pending' | 'done'>>({});

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetchMyMembership().then(data => {
        setMembership(data.membership);
        setFund(data.fund);
      }).catch(() => {}),
      fetchFundHistory().then(data => setFundHistory(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleJoin = async (tierKey: string) => {
    if (paying) return;
    setPaying(tierKey);
    try {
      const { client_secret } = await createMembershipIntent(tierKey);
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
      setSuccess(true);
      fetchMyMembership().then(data => {
        setMembership(data.membership);
        setFund(data.fund);
      }).catch(() => {});
    } catch (e: any) {
      Alert.alert('Could not start payment', e.message ?? 'Please try again.');
    } finally {
      setPaying(null);
    }
  };

  const handleRenew = async () => {
    if (renewing || !membership) return;
    setRenewing(true);
    try {
      const { client_secret } = await renewMembership();
      const { error: initErr } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'Maison Fraise',
      });
      if (initErr) throw new Error(initErr.message);
      const { error: presentErr } = await presentPaymentSheet();
      if (presentErr) {
        if (presentErr.code !== 'Canceled') {
          Alert.alert('Renewal failed', 'Please try again.');
        }
        return;
      }
      // Refresh membership data
      fetchMyMembership().then(data => {
        setMembership(data.membership);
        setFund(data.fund);
      }).catch(() => {});
    } catch (e: any) {
      Alert.alert('Could not start renewal', e.message ?? 'Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  const handleWaitlist = (tierKey: string) => {
    Alert.prompt(
      'Express Interest',
      'Tell us about your relationship with Maison Fraise (optional)',
      async (message) => {
        try {
          await joinMembershipWaitlist(tierKey, message ?? undefined);
          Alert.alert("We'll be in touch.");
          setWaitlistState(prev => ({ ...prev, [tierKey]: 'done' }));
        } catch {
          Alert.alert('Something went wrong', 'Please try again.');
        }
      },
    );
  };

  const formatCurrency = (cents: number) => {
    return `CA$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

  const tierAnnualCents = membership ? (TIER_ANNUAL_CENTS[membership.tier] ?? 1) : 1;
  const fundRatio = fund ? Math.min(fund.balance_cents / tierAnnualCents, 1) : 0;

  const daysUntilRenewal = membership?.renews_at
    ? Math.ceil((new Date(membership.renews_at).getTime() - Date.now()) / 86400000)
    : null;

  const showRenewalBanner =
    membership?.status === 'active' && daysUntilRenewal !== null && daysUntilRenewal <= 30;

  const displayedHistory = fundHistory.slice(0, 5);
  const hasMoreHistory = fundHistory.length > 5;

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Membership</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : success ? (
          <View style={styles.successContainer}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.successText, { color: c.text, fontFamily: fonts.playfair }]}>
              Welcome to Maison Fraise
            </Text>
          </View>
        ) : membership ? (
          <>
            {/* Renewal warning banner */}
            {showRenewalBanner && (
              <View style={[styles.renewalBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
                <Text style={[styles.renewalBannerText, { fontFamily: fonts.dmMono }]}>
                  Renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'}
                </Text>
                <TouchableOpacity
                  style={[styles.renewNowBtn, { backgroundColor: '#C9973A' }]}
                  onPress={handleRenew}
                  activeOpacity={0.8}
                  disabled={renewing}
                >
                  {renewing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.renewNowBtnText, { fontFamily: fonts.dmSans }]}>Renew Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.activeMembershipCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.tierName, { color: c.text, fontFamily: fonts.playfair }]}>
                {TIERS.find(t => t.key === membership.tier)?.label ?? membership.tier}
              </Text>
              {membership.renews_at && (
                <Text style={[styles.renewsAt, { color: c.muted, fontFamily: fonts.dmMono }]}>
                  Renews {new Date(membership.renews_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              )}
              {fund && (
                <>
                  <Text style={[styles.fundBalance, { color: c.text, fontFamily: fonts.dmMono }]}>
                    {formatCurrency(fund.balance_cents)} in your fund
                  </Text>
                  <View style={[styles.fundBarBg, { backgroundColor: c.border }]}>
                    <View style={[styles.fundBarFill, { backgroundColor: c.accent, width: `${fundRatio * 100}%` }]} />
                  </View>
                </>
              )}
            </View>

            {/* Fund Activity section */}
            {fundHistory.length > 0 && (
              <View style={styles.fundActivitySection}>
                <Text style={[styles.fundActivityHeader, { color: c.muted, fontFamily: fonts.dmMono }]}>
                  FUND ACTIVITY
                </Text>
                {displayedHistory.map((event: any, idx: number) => {
                  const isContribution = event.type === 'contribution';
                  return (
                    <View
                      key={idx}
                      style={[styles.fundEventRow, { borderBottomColor: c.border }]}
                    >
                      <View style={styles.fundEventMain}>
                        {isContribution ? (
                          <Text style={[styles.fundEventLabel, { color: c.text, fontFamily: fonts.dmMono }]}>
                            {formatCurrency(event.amount_cents)} from {event.from_name ?? 'Anonymous'}
                            {event.note ? ` — ${event.note}` : ''}
                          </Text>
                        ) : (
                          <Text style={[styles.fundEventLabel, { color: c.accent, fontFamily: fonts.dmMono }]}>
                            {formatCurrency(event.amount_cents)} — {event.piece_title ?? 'Commission'}
                          </Text>
                        )}
                      </View>
                      {event.created_at && (
                        <Text style={[styles.fundEventDate, { color: c.muted, fontFamily: fonts.dmMono }]}>
                          {formatDate(event.created_at)}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {hasMoreHistory && (
                  <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7}>
                    <Text style={[styles.viewAllText, { color: c.accent, fontFamily: fonts.dmMono }]}>
                      View all
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: c.muted, fontFamily: fonts.dmMono }]}>
              Choose your tier
            </Text>
            {TIERS.map((tier, idx) => {
              const isHighTier = HIGH_TIERS.has(tier.key);
              const waitlistDone = waitlistState[tier.key] === 'done';
              return (
                <View
                  key={tier.key}
                  style={[
                    styles.tierCard,
                    { backgroundColor: c.card, borderColor: c.border },
                    idx < TIERS.length - 1 && { marginBottom: SPACING.sm },
                  ]}
                >
                  <View style={styles.tierCardContent}>
                    <Text style={[styles.tierCardLabel, { color: c.text, fontFamily: fonts.playfair }]}>
                      {tier.label}
                    </Text>
                    <Text style={[styles.tierCardPrice, { color: c.muted, fontFamily: fonts.dmMono }]}>
                      {tier.price}
                    </Text>
                    <Text style={[styles.tierCardDesc, { color: c.muted, fontFamily: fonts.dmSans }]}>
                      {tier.desc}
                    </Text>
                  </View>
                  {tier.contactUs ? (
                    isHighTier ? (
                      <TouchableOpacity
                        style={[
                          styles.waitlistBtn,
                          { borderColor: c.border },
                          waitlistDone && { borderColor: c.accent },
                        ]}
                        onPress={() => !waitlistDone && handleWaitlist(tier.key)}
                        activeOpacity={waitlistDone ? 1 : 0.8}
                      >
                        <Text style={[styles.waitlistBtnText, { color: waitlistDone ? c.accent : c.muted, fontFamily: fonts.dmMono }]}>
                          {waitlistDone ? 'On waitlist ✓' : 'Join Waitlist'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.contactUsText, { color: c.muted, fontFamily: fonts.dmMono }]}>
                        Contact us
                      </Text>
                    )
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinBtn, { backgroundColor: c.accent }]}
                      onPress={() => handleJoin(tier.key)}
                      activeOpacity={0.8}
                      disabled={paying !== null}
                    >
                      {paying === tier.key ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[styles.joinBtnText, { fontFamily: fonts.dmSans }]}>Join</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: SPACING.sm },
  backBtnText: { fontSize: 22 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold' },
  headerSpacer: { width: 44 },
  body: { padding: SPACING.md, paddingBottom: 40 },
  renewalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  renewalBannerText: { fontSize: 13, color: '#856404' },
  renewNowBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  renewNowBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  activeMembershipCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tierName: { fontSize: 28, marginBottom: SPACING.xs },
  renewsAt: { fontSize: 13, marginBottom: SPACING.sm },
  fundBalance: { fontSize: 15, marginBottom: SPACING.sm },
  fundBarBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fundBarFill: { height: 4, borderRadius: 2 },
  fundActivitySection: { marginTop: SPACING.sm },
  fundActivityHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  fundEventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fundEventMain: { flex: 1, marginRight: SPACING.sm },
  fundEventLabel: { fontSize: 13, lineHeight: 18 },
  fundEventDate: { fontSize: 11 },
  viewAllBtn: { paddingVertical: SPACING.sm, alignItems: 'center' },
  viewAllText: { fontSize: 13 },
  sectionLabel: { fontSize: 12, letterSpacing: 1, marginBottom: SPACING.md, textTransform: 'uppercase' },
  tierCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tierCardContent: { flex: 1 },
  tierCardLabel: { fontSize: 18, marginBottom: 2 },
  tierCardPrice: { fontSize: 14, marginBottom: 2 },
  tierCardDesc: { fontSize: 12 },
  contactUsText: { fontSize: 13 },
  waitlistBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 96,
    alignItems: 'center',
  },
  waitlistBtnText: { fontSize: 12 },
  joinBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  successContainer: { alignItems: 'center', paddingTop: 60 },
  checkmark: { fontSize: 48, marginBottom: SPACING.md },
  successText: { fontSize: 22, textAlign: 'center' },
});
