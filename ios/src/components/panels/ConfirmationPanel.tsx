import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { usePanel } from '../../context/PanelContext';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function ConfirmationPanel() {
  const { goHome, showPanel, order } = usePanel();

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Order placed.</Text>
        <Text style={styles.subtitle}>{order.location_name} · {order.time_slot_time}</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>ORDER</Text>
            <Text style={styles.cardValue}>#{order.order_id}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>TOTAL</Text>
            <Text style={styles.cardValue}>CA${((order.total_cents ?? 0) / 100).toFixed(2)}</Text>
          </View>
        </View>

        {order.nfc_token && (
          <View style={styles.nfcCard}>
            <Text style={styles.nfcTitle}>Open your box when you arrive.</Text>
            <Text style={styles.nfcBody}>Tap your phone to the NFC chip inside the lid to verify your membership.</Text>
            <TouchableOpacity style={styles.nfcBtn} onPress={() => showPanel('nfc')} activeOpacity={0.85}>
              <Text style={styles.nfcBtnText}>Verify now →</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.standingBtn}
          onPress={() => showPanel('standingOrder')}
          activeOpacity={0.8}
        >
          <Text style={styles.standingBtnText}>Make this a standing order →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => { goHome(); TrueSheet.present('main-sheet', 1); }}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Done — back to map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: SPACING.md, gap: SPACING.md, alignItems: 'center', paddingTop: 32 },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.green, borderWidth: 3, borderColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { fontSize: 32, color: colors.gold },
  title: { fontSize: 32, color: colors.text, fontFamily: fonts.playfair },
  subtitle: { fontSize: 14, color: colors.muted, fontFamily: fonts.dmSans },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, width: '100%', gap: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  cardValue: { fontSize: 15, color: colors.text, fontFamily: fonts.playfair },
  nfcCard: {
    backgroundColor: 'rgba(28,58,42,0.06)',
    borderRadius: 14, padding: SPACING.md, width: '100%', gap: 8,
    borderWidth: 1, borderColor: 'rgba(28,58,42,0.15)',
  },
  nfcTitle: { fontSize: 15, color: colors.text, fontFamily: fonts.playfair },
  nfcBody: { fontSize: 13, color: colors.muted, fontFamily: fonts.dmSans, lineHeight: 20 },
  nfcBtn: { backgroundColor: colors.green, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  nfcBtnText: { color: colors.cream, fontSize: 13, fontFamily: fonts.dmSans, fontWeight: '600' },
  standingBtn: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, width: '100%', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)' },
  standingBtnText: { fontSize: 14, color: colors.green, fontFamily: fonts.playfair },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  doneBtn: { borderRadius: 30, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  doneBtnText: { color: colors.muted, fontSize: 14, fontFamily: fonts.dmSans },
});
