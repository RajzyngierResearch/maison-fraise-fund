import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { useApp } from '../../../App';
import { createOrder, confirmOrder } from '../../lib/api';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function ReviewPanel() {
  const { goBack, showPanel, order, setOrder, goHome } = usePanel();
  const { reviewMode, pushToken } = useApp();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [email, setEmail] = useState(order.customer_email);
  const [loading, setLoading] = useState(false);

  const totalCents = (order.price_cents ?? 0) * order.quantity;

  const handlePay = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Email required', 'Enter a valid email for your receipt.');
      return;
    }
    if (!order.variety_id || !order.location_id || !order.time_slot_id) {
      Alert.alert('Incomplete', 'Something is missing from your order.');
      return;
    }

    setLoading(true);
    try {
      setOrder({ customer_email: email });
      const { order: created, client_secret } = await createOrder({
        variety_id: order.variety_id!,
        location_id: order.location_id!,
        time_slot_id: order.time_slot_id!,
        chocolate: order.chocolate!,
        finish: order.finish!,
        quantity: order.quantity,
        is_gift: order.is_gift,
        customer_email: email,
        push_token: pushToken,
      });

      let confirmed;
      if (reviewMode) {
        confirmed = await confirmOrder(created.id);
      } else {
        const { error: initErr } = await initPaymentSheet({
          merchantDisplayName: 'Maison Fraise',
          paymentIntentClientSecret: client_secret,
          defaultBillingDetails: { email },
          appearance: { colors: { primary: colors.green, background: colors.cream } },
        });
        if (initErr) throw new Error(initErr.message);
        const { error: presentErr } = await presentPaymentSheet();
        if (presentErr) {
          if (presentErr.code === 'Canceled') { setLoading(false); return; }
          throw new Error(presentErr.message);
        }
        confirmed = await confirmOrder(created.id);
      }

      setOrder({
        order_id: confirmed.id,
        nfc_token: confirmed.nfc_token ?? null,
        total_cents: confirmed.total_cents ?? totalCents,
      });
      showPanel('confirmation');
    } catch (err: unknown) {
      Alert.alert('Something went wrong.', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← When</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.seg, i < 6 && styles.segActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>STEP 6 OF 7</Text>
        <Text style={styles.stepTitle}>Review</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Row label="STRAWBERRY" value={order.variety_name ?? '—'} />
          <View style={styles.divider} />
          <Row label="CHOCOLATE" value={order.chocolate_name ?? '—'} />
          <View style={styles.divider} />
          <Row label="FINISH" value={order.finish_name ?? '—'} />
          <View style={styles.divider} />
          <Row label="QUANTITY" value={String(order.quantity)} />
          <View style={styles.divider} />
          <Row label="COLLECTION" value={order.location_name ?? '—'} />
          <View style={styles.divider} />
          <Row label="WHEN" value={order.time_slot_time ?? '—'} sub={order.date ?? ''} />
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>CA${(totalCents / 100).toFixed(2)}</Text>
        </View>

        <View style={styles.emailCard}>
          <Text style={styles.emailLabel}>EMAIL FOR RECEIPT</Text>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.payBtnText}>{loading ? 'Processing...' : 'Place Order →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: colors.green, paddingHorizontal: SPACING.md, paddingTop: 16, paddingBottom: 20 },
  back: { paddingVertical: 4, marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: fonts.dmSans },
  progress: { flexDirection: 'row', gap: 3, marginBottom: 8 },
  seg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  segActive: { backgroundColor: colors.cream },
  stepLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: fonts.dmMono, letterSpacing: 1.5, marginBottom: 2 },
  stepTitle: { color: colors.cream, fontSize: 28, fontFamily: fonts.playfair },
  body: { padding: SPACING.md, gap: SPACING.md },
  card: { backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 12 },
  rowLabel: { fontSize: 9, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 1.8, marginTop: 2 },
  rowRight: { flex: 1, alignItems: 'flex-end', gap: 2 },
  rowValue: { fontSize: 14, color: colors.text, fontFamily: fonts.playfair, textAlign: 'right' },
  rowSub: { fontSize: 11, color: colors.muted, fontFamily: fonts.dmSans },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: SPACING.md },
  totalCard: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(232,224,208,0.55)', fontSize: 11, fontFamily: fonts.dmMono, letterSpacing: 1.8 },
  totalAmount: { color: colors.cream, fontSize: 22, fontFamily: fonts.playfair },
  emailCard: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, gap: 8 },
  emailLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  emailInput: { fontSize: 15, color: colors.text, fontFamily: fonts.dmSans, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  payBtn: { backgroundColor: colors.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: colors.cream, fontSize: 14, fontFamily: fonts.dmSans, fontWeight: '700', letterSpacing: 1 },
});
