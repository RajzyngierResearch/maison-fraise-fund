import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function VarietyPanel() {
  const { goBack, showPanel, order, varieties } = usePanel();
  const variety = varieties.find(v => v.id === order.variety_id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← {order.location_name ?? 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{variety?.name ?? '—'}</Text>
        {(variety as any)?.farm && <Text style={styles.source}>{(variety as any).farm}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {(variety as any)?.description && (
          <Text style={styles.description}>{(variety as any).description}</Text>
        )}

        {(variety as any)?.freshnessLevel !== undefined && (
          <View style={styles.freshnessTrack}>
            <View style={[styles.freshnessBar, {
              width: `${((variety as any).freshnessLevel ?? 0.8) * 100}%` as any,
              backgroundColor: (variety as any).freshnessColor ?? colors.green,
            }]} />
          </View>
        )}

        <View style={styles.metaRow}>
          {(variety as any)?.harvestDate && <Text style={styles.metaText}>{(variety as any).harvestDate}</Text>}
          <Text style={styles.metaText}>{variety?.stock_remaining ?? 0} remaining</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>CA${((variety?.price_cents ?? 0) / 100).toFixed(2)}</Text>
          <Text style={styles.perItem}>per strawberry</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => showPanel('chocolate')}
          activeOpacity={0.85}
        >
          <Text style={styles.orderBtnText}>Order This Strawberry →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: colors.green,
    paddingHorizontal: SPACING.md,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 4,
  },
  back: { paddingVertical: 4, marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: fonts.dmSans },
  title: { fontSize: 24, color: colors.cream, fontFamily: fonts.playfair },
  source: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: fonts.dmSans, fontStyle: 'italic' },
  body: { padding: SPACING.md, gap: SPACING.md },
  description: { fontSize: 13, color: colors.text, fontFamily: fonts.dmSans, fontStyle: 'italic', lineHeight: 22 },
  freshnessTrack: { height: 2, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 1, overflow: 'hidden' },
  freshnessBar: { height: 2, borderRadius: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: colors.muted, fontFamily: fonts.dmSans },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 24, color: colors.text, fontFamily: fonts.playfair },
  perItem: { fontSize: 12, color: colors.muted, fontFamily: fonts.dmSans },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  orderBtn: { backgroundColor: colors.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  orderBtnText: { color: colors.cream, fontSize: 14, fontFamily: fonts.dmSans, fontWeight: '700', letterSpacing: 1 },
});
