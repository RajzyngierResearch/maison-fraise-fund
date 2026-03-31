import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';
import { QUANTITIES } from '../../data/seed';

export default function QuantityPanel() {
  const { goBack, showPanel, order, setOrder } = usePanel();
  const [selected, setSelected] = useState<number>(order.quantity ?? 4);
  const [isGift, setIsGift] = useState(order.is_gift);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← Finish</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.seg, i < 4 && styles.segActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>STEP 4 OF 7</Text>
        <Text style={styles.stepTitle}>Quantity</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.grid}>
          {QUANTITIES.map(q => {
            const isSelected = selected === q;
            return (
              <TouchableOpacity
                key={q}
                style={[styles.qCard, isSelected && styles.qCardSelected]}
                onPress={() => setSelected(q)}
                activeOpacity={0.85}
              >
                <Text style={[styles.qNum, isSelected && styles.qNumSelected]}>{q}</Text>
                <Text style={[styles.qLabel, isSelected && styles.qLabelSelected]}>
                  {q === 1 ? 'strawberry' : 'strawberries'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.giftRow}>
          <Text style={styles.giftLabel}>This is a gift</Text>
          <Switch
            value={isGift}
            onValueChange={setIsGift}
            trackColor={{ true: colors.green }}
            thumbColor={colors.cream}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            setOrder({ quantity: selected, is_gift: isGift });
            showPanel('when');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
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
  body: { flex: 1, padding: SPACING.md, gap: SPACING.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  qCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  qCardSelected: { backgroundColor: colors.green, borderColor: 'transparent' },
  qNum: { fontSize: 32, color: colors.text, fontFamily: fonts.playfair },
  qNumSelected: { color: colors.cream },
  qLabel: { fontSize: 12, color: colors.muted, fontFamily: fonts.dmSans },
  qLabelSelected: { color: 'rgba(232,224,208,0.65)' },
  giftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  giftLabel: { fontSize: 15, color: colors.text, fontFamily: fonts.playfair },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  continueBtn: { backgroundColor: colors.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { color: colors.cream, fontSize: 14, fontFamily: fonts.dmSans, fontWeight: '700', letterSpacing: 1 },
});
