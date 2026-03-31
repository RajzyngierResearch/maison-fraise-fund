import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { usePanel } from '../../context/PanelContext';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function VerifiedPanel() {
  const { goHome, showPanel } = usePanel();

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <View style={styles.badgeInner}>
            <Text style={styles.check}>✓</Text>
          </View>
        </View>
        <Text style={styles.title}>You're in.</Text>
        <Text style={styles.body2}>Your account is now verified. Standing orders and campaigns will unlock when they're ready.</Text>

        <View style={styles.unlockedCard}>
          <Text style={styles.unlockedHeader}>UNLOCKED</Text>
          <View style={styles.unlockedRow}>
            <Text style={styles.unlockedIcon}>↻</Text>
            <View>
              <Text style={styles.unlockedTitle}>Standing orders</Text>
              <Text style={styles.unlockedDesc}>Set up weekly, biweekly, or monthly orders.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.unlockedRow}>
            <Text style={styles.unlockedIcon}>◈</Text>
            <View>
              <Text style={styles.unlockedTitle}>Campaign access</Text>
              <Text style={styles.unlockedDesc}>Portrait sessions at partner salons.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.standingBtn} onPress={() => showPanel('standingOrder')} activeOpacity={0.85}>
          <Text style={styles.standingBtnText}>Set up a standing order →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { goHome(); TrueSheet.present('main-sheet', 1); }}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>Back to map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: SPACING.md, gap: SPACING.md, alignItems: 'center', paddingTop: 32 },
  badge: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  badgeInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(196,151,58,0.15)', alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 32, color: colors.gold },
  title: { fontSize: 38, fontFamily: fonts.playfair, color: colors.text },
  body2: { fontSize: 15, color: colors.muted, fontFamily: fonts.dmSans, textAlign: 'center', lineHeight: 24 },
  unlockedCard: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, width: '100%', gap: 12 },
  unlockedHeader: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 2 },
  unlockedRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  unlockedIcon: { fontSize: 16, color: colors.green, width: 24, textAlign: 'center', marginTop: 2 },
  unlockedTitle: { fontSize: 15, color: colors.text, fontFamily: fonts.playfair },
  unlockedDesc: { fontSize: 13, color: colors.muted, fontFamily: fonts.dmSans, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.08)' },
  standingBtn: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, width: '100%', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)' },
  standingBtnText: { fontSize: 14, color: colors.green, fontFamily: fonts.playfair },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  backBtn: { paddingVertical: 16, alignItems: 'center' },
  backBtnText: { color: colors.muted, fontSize: 14, fontFamily: fonts.dmSans },
});
