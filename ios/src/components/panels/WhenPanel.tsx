import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchSlots } from '../../lib/api';
import { getDateOptions } from '../../data/seed';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

const DATE_OPTIONS = getDateOptions();

export default function WhenPanel() {
  const { goBack, showPanel, order, setOrder } = usePanel();
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!order.location_id || !order.date) return;
    setLoadingSlots(true);
    fetchSlots(order.location_id, order.date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [order.location_id, order.date]);

  const selectDate = (idx: number) => {
    setSelectedDateIdx(idx);
    setOrder({ date: DATE_OPTIONS[idx].isoDate, time_slot_id: null, time_slot_time: null });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← Quantity</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.seg, i < 5 && styles.segActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>STEP 5 OF 7</Text>
        <Text style={styles.stepTitle}>When</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {DATE_OPTIONS.map((d, idx) => {
            const sel = selectedDateIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dateChip, sel && styles.dateChipSelected]}
                onPress={() => selectDate(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateLabel, sel && styles.textWhite]}>{d.label}</Text>
                <Text style={[styles.dateNum, sel && styles.textWhite]}>{d.dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>TIME</Text>
        {loadingSlots ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <View style={styles.timeGrid}>
            {slots.map(slot => {
              const sel = order.time_slot_id === slot.id;
              const available = slot.capacity - slot.booked;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.timeChip, sel && styles.timeChipSelected]}
                  onPress={() => setOrder({ time_slot_id: slot.id, time_slot_time: slot.time })}
                  disabled={available <= 0}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeText, sel && styles.textWhite]}>{slot.time}</Text>
                  <Text style={[styles.slotsText, sel && styles.textWhiteMuted]}>{available} slots</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, (!order.date || !order.time_slot_id) && styles.continueBtnDisabled]}
          onPress={() => showPanel('review')}
          disabled={!order.date || !order.time_slot_id}
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
  body: { padding: SPACING.md, gap: SPACING.md },
  sectionLabel: { fontSize: 11, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  dateRow: { gap: 8, paddingVertical: 4 },
  dateChip: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 52 },
  dateChipSelected: { backgroundColor: colors.green },
  dateLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
  dateNum: { fontSize: 20, color: colors.text, fontFamily: fonts.playfair, marginTop: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10, paddingVertical: 14, alignItems: 'center', width: '31%', gap: 3 },
  timeChipSelected: { backgroundColor: colors.green },
  timeText: { fontSize: 16, color: colors.text, fontFamily: fonts.dmSans, fontWeight: '600' },
  slotsText: { fontSize: 11, color: colors.muted, fontFamily: fonts.dmSans },
  textWhite: { color: colors.cream },
  textWhiteMuted: { color: 'rgba(232,224,208,0.6)' },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  continueBtn: { backgroundColor: colors.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: colors.cream, fontSize: 14, fontFamily: fonts.dmSans, fontWeight: '700', letterSpacing: 1 },
});
