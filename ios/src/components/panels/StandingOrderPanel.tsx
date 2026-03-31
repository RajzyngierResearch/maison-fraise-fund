import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { searchVerifiedUsers, generateGiftNote, createStandingOrder } from '../../lib/api';
import { getUserId } from '../../lib/userId';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

const FREQUENCIES = [
  { key: 'weekly', label: 'Weekly', cycles: 52, desc: 'Every week' },
  { key: 'biweekly', label: 'Biweekly', cycles: 26, desc: 'Every two weeks' },
  { key: 'monthly', label: 'Monthly', cycles: 12, desc: 'Once a month' },
];
const TIME_PREFS = ['9:00 – 11:00', '11:00 – 13:00', '13:00 – 15:00', '15:00 – 17:00'];
const TONES = ['warm', 'funny', 'poetic', 'minimal'] as const;

export default function StandingOrderPanel() {
  const { goBack, goHome, order } = usePanel();
  const [type, setType] = useState<'personal' | 'gift'>('personal');
  const [freq, setFreq] = useState('monthly');
  const [timePref, setTimePref] = useState(TIME_PREFS[0]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tone, setTone] = useState<'warm' | 'funny' | 'poetic' | 'minimal'>('warm');
  const [notePreview, setNotePreview] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedFreq = FREQUENCIES.find(f => f.key === freq)!;
  const totalCents = (order.price_cents ?? 0) * order.quantity * selectedFreq.cycles;

  const handleSearch = useCallback(async (q: string) => {
    setRecipientQuery(q);
    setSelectedRecipient(null);
    if (q.length < 3) { setRecipients([]); return; }
    setSearchLoading(true);
    try { setRecipients(await searchVerifiedUsers(q) ?? []); }
    catch { setRecipients([]); }
    finally { setSearchLoading(false); }
  }, []);

  const handlePreview = async () => {
    setNoteLoading(true);
    try { setNotePreview((await generateGiftNote(tone, order.variety_name ?? '', '')).note); }
    catch { Alert.alert('Could not generate note'); }
    finally { setNoteLoading(false); }
  };

  const handleConfirm = async () => {
    if (type === 'gift' && !selectedRecipient) {
      Alert.alert('Recipient required', 'Search for and select a verified member.');
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date();
      const next = new Date(today);
      if (freq === 'weekly') next.setDate(today.getDate() + 7);
      else if (freq === 'biweekly') next.setDate(today.getDate() + 14);
      else next.setMonth(today.getMonth() + 1);

      await createStandingOrder({
        sender_id: 0,
        recipient_id: type === 'gift' ? selectedRecipient?.id : undefined,
        variety_id: order.variety_id!,
        chocolate: order.chocolate!,
        finish: order.finish!,
        quantity: order.quantity,
        location_id: order.location_id!,
        time_slot_preference: timePref,
        frequency: freq,
        next_order_date: next.toISOString().split('T')[0],
        gift_tone: type === 'gift' ? tone : undefined,
      });
      Alert.alert('Standing order set.', `Your ${freq} order is confirmed.`, [
        { text: 'Done', onPress: () => { goHome(); TrueSheet.present('main-sheet', 1); } },
      ]);
    } catch (err: unknown) {
      Alert.alert('Could not set up standing order', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Standing Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Toggle */}
        <View style={styles.toggle}>
          {(['personal', 'gift'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.toggleOpt, type === t && styles.toggleOptActive]} onPress={() => setType(t)} activeOpacity={0.8}>
              <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>{t === 'personal' ? 'Myself' : 'A gift'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'gift' && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>RECIPIENT</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by member ID (MF-...)"
              placeholderTextColor={colors.muted}
              value={recipientQuery}
              onChangeText={handleSearch}
              autoCapitalize="characters"
            />
            {searchLoading && <ActivityIndicator size="small" color={colors.green} style={{ marginTop: 8 }} />}
            {recipients.map(r => (
              <TouchableOpacity key={r.id} style={styles.resultRow} onPress={() => { setSelectedRecipient(r); setRecipientQuery(r.user_id); setRecipients([]); }}>
                <Text style={styles.resultText}>{r.user_id}</Text>
              </TouchableOpacity>
            ))}
            {selectedRecipient && (
              <View style={styles.selectedRow}>
                <Text style={styles.selectedText}>{selectedRecipient.user_id}</Text>
                <TouchableOpacity onPress={() => { setSelectedRecipient(null); setRecipientQuery(''); }}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Frequency */}
        <Text style={styles.sectionLabel}>FREQUENCY</Text>
        {FREQUENCIES.map(f => (
          <TouchableOpacity key={f.key} style={[styles.freqCard, freq === f.key && styles.freqCardActive]} onPress={() => setFreq(f.key)} activeOpacity={0.8}>
            <Text style={[styles.freqLabel, freq === f.key && styles.freqLabelActive]}>{f.label}</Text>
            <Text style={[styles.freqDesc, freq === f.key && styles.freqDescActive]}>{f.desc}</Text>
          </TouchableOpacity>
        ))}

        {/* Time */}
        <Text style={styles.sectionLabel}>PREFERRED TIME</Text>
        <View style={styles.timeRow}>
          {TIME_PREFS.map(t => (
            <TouchableOpacity key={t} style={[styles.timeChip, timePref === t && styles.timeChipActive]} onPress={() => setTimePref(t)} activeOpacity={0.8}>
              <Text style={[styles.timeText, timePref === t && styles.timeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'gift' && (
          <>
            <Text style={styles.sectionLabel}>NOTE TONE</Text>
            <View style={styles.toneRow}>
              {TONES.map(t => (
                <TouchableOpacity key={t} style={[styles.toneChip, tone === t && styles.toneChipActive]} onPress={() => { setTone(t); setNotePreview(''); }} activeOpacity={0.8}>
                  <Text style={[styles.toneText, tone === t && styles.toneTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.previewBtn} onPress={handlePreview} disabled={noteLoading} activeOpacity={0.8}>
              {noteLoading ? <ActivityIndicator size="small" color={colors.green} /> : <Text style={styles.previewBtnText}>Preview note</Text>}
            </TouchableOpacity>
            {notePreview !== '' && (
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>SAMPLE NOTE</Text>
                <Text style={styles.noteText}>{notePreview}</Text>
              </View>
            )}
          </>
        )}

        {/* Total */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>TOTAL PREPAYMENT</Text>
            <Text style={styles.totalSub}>{selectedFreq.cycles} orders × CA${((order.price_cents ?? 0) * order.quantity / 100).toFixed(2)}</Text>
          </View>
          <Text style={styles.totalAmount}>CA${(totalCents / 100).toFixed(2)}</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={submitting} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>{submitting ? 'Setting up...' : 'Confirm & Pay →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: colors.green, paddingHorizontal: SPACING.md, paddingTop: 16, paddingBottom: 24, gap: 4 },
  back: { paddingVertical: 4, marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: fonts.dmSans },
  title: { color: colors.cream, fontSize: 28, fontFamily: fonts.playfair },
  body: { padding: SPACING.md, gap: SPACING.md },
  sectionLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 1.8 },
  toggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, gap: 4 },
  toggleOpt: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleOptActive: { backgroundColor: colors.green },
  toggleText: { fontSize: 14, color: colors.muted, fontFamily: fonts.dmSans, fontWeight: '600' },
  toggleTextActive: { color: colors.cream },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, gap: 8 },
  searchInput: { fontSize: 14, color: colors.text, fontFamily: fonts.dmSans, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)', paddingVertical: 6 },
  resultRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  resultText: { fontSize: 14, color: colors.text, fontFamily: fonts.dmMono, letterSpacing: 1 },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#D4EDD4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  selectedText: { fontSize: 13, color: '#2D5A2D', fontFamily: fonts.dmMono, fontWeight: '600' },
  clearText: { color: colors.muted, fontSize: 14 },
  freqCard: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  freqCardActive: { borderColor: colors.green, backgroundColor: 'rgba(28,58,42,0.06)' },
  freqLabel: { fontSize: 16, color: colors.text, fontFamily: fonts.playfair },
  freqLabelActive: { color: colors.green },
  freqDesc: { fontSize: 13, color: colors.muted, fontFamily: fonts.dmSans },
  freqDescActive: { color: colors.green },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1.5, borderColor: 'transparent' },
  timeChipActive: { borderColor: colors.green, backgroundColor: 'rgba(28,58,42,0.06)' },
  timeText: { fontSize: 13, color: colors.text, fontFamily: fonts.dmSans },
  timeTextActive: { color: colors.green, fontWeight: '600' },
  toneRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toneChip: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: 'transparent' },
  toneChipActive: { borderColor: colors.green, backgroundColor: 'rgba(28,58,42,0.06)' },
  toneText: { fontSize: 13, color: colors.text, fontFamily: fonts.dmSans },
  toneTextActive: { color: colors.green, fontWeight: '600' },
  previewBtn: { backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  previewBtnText: { fontSize: 14, color: colors.green, fontFamily: fonts.playfair },
  noteCard: { backgroundColor: colors.card, borderRadius: 14, padding: SPACING.md, gap: 8, borderWidth: 1, borderColor: 'rgba(196,151,58,0.3)' },
  noteLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.dmMono, letterSpacing: 2 },
  noteText: { fontSize: 14, color: colors.text, fontFamily: fonts.dmSans, lineHeight: 22, fontStyle: 'italic' },
  totalCard: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(232,224,208,0.6)', fontSize: 11, fontFamily: fonts.dmMono, letterSpacing: 1.8, marginBottom: 3 },
  totalSub: { color: 'rgba(232,224,208,0.45)', fontSize: 12, fontFamily: fonts.dmSans },
  totalAmount: { color: colors.cream, fontSize: 24, fontFamily: fonts.playfair },
  footer: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  confirmBtn: { backgroundColor: colors.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: colors.cream, fontSize: 14, fontFamily: fonts.dmSans, fontWeight: '700', letterSpacing: 1 },
});
