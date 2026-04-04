import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchRecentCustomers, fetchVarieties, fetchTimeSlots, sendOffer } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

const CHOC = [
  { key: 'guanaja_70', label: 'guanaja 70%' },
  { key: 'caraibe_66', label: 'caraïbe 66%' },
  { key: 'jivara_40', label: 'jivara 40%' },
  { key: 'ivoire_blanc', label: 'ivoire blanc' },
];
const FIN = [
  { key: 'plain', label: 'plain' },
  { key: 'fleur_de_sel', label: 'fleur de sel' },
  { key: 'or_fin', label: 'or fin' },
];
const QTY = [1, 2, 4, 6, 8, 12];
const TODAY = new Date().toISOString().split('T')[0];

export default function OfferComposerPanel() {
  const { goBack, businesses } = usePanel();
  const c = useColors();

  const [customers, setCustomers] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingVarieties, setLoadingVarieties] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sending, setSending] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVariety, setSelectedVariety] = useState<any>(null);
  const [selectedChoc, setSelectedChoc] = useState('guanaja_70');
  const [selectedFinish, setSelectedFinish] = useState('plain');
  const [selectedQty, setSelectedQty] = useState(4);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [note, setNote] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const location = businesses.find(b => b.type === 'collection');

  useEffect(() => {
    fetchRecentCustomers()
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
    fetchVarieties()
      .then(setVarieties)
      .catch(() => {})
      .finally(() => setLoadingVarieties(false));
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetchTimeSlots(location.id, TODAY)
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [location?.id]);

  const filteredCustomers = customerSearch.trim()
    ? customers.filter(c =>
        (c.display_name ?? '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.user_code ?? '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers;

  const canSend = selectedCustomer && selectedVariety && selectedSlot && location;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await sendOffer({
        recipient_id: selectedCustomer.user_id,
        variety_id: selectedVariety.id,
        chocolate: selectedChoc,
        finish: selectedFinish,
        quantity: selectedQty,
        time_slot_id: selectedSlot.id,
        location_id: location!.id,
        note: note.trim() || undefined,
      });
      Alert.alert('Sent', `Offer sent to ${selectedCustomer.display_name ?? selectedCustomer.user_code}.`);
      setSelectedCustomer(null);
      setSelectedVariety(null);
      setSelectedSlot(null);
      setNote('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not send offer.');
    } finally {
      setSending(false);
    }
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={[styles.sectionLabel, { color: c.muted }]}>{label}</Text>
  );

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, { borderColor: selected ? c.accent : c.border, backgroundColor: selected ? 'rgba(201,151,58,0.1)' : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: selected ? c.accent : c.muted }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: c.text }]}>send offer</Text>
          <Text style={[styles.subtitle, { color: c.accent }]}>fraise.chat</Text>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { borderColor: canSend ? c.accent : c.border, opacity: canSend ? 1 : 0.4 }]}
          onPress={handleSend}
          disabled={!canSend || sending}
          activeOpacity={0.7}
        >
          {sending
            ? <ActivityIndicator size="small" color={c.accent} />
            : <Text style={[styles.sendBtnText, { color: c.accent }]}>send →</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Customer */}
        <SectionLabel label="to" />
        <TextInput
          style={[styles.searchInput, { color: c.text, borderColor: c.border }]}
          placeholder="search customers..."
          placeholderTextColor={c.muted}
          value={customerSearch}
          onChangeText={setCustomerSearch}
        />
        {loadingCustomers ? (
          <ActivityIndicator color={c.accent} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.customerList}>
            {filteredCustomers.slice(0, 8).map(cust => (
              <TouchableOpacity
                key={cust.user_id}
                style={[styles.customerRow, { borderColor: selectedCustomer?.user_id === cust.user_id ? c.accent : c.border, backgroundColor: selectedCustomer?.user_id === cust.user_id ? 'rgba(201,151,58,0.08)' : 'transparent' }]}
                onPress={() => setSelectedCustomer(cust)}
                activeOpacity={0.7}
              >
                <Text style={[styles.customerName, { color: c.text }]}>{cust.display_name ?? cust.user_code ?? cust.email}</Text>
                <Text style={[styles.customerMeta, { color: c.muted }]}>{cust.order_count} orders</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Variety */}
        <SectionLabel label="variety" />
        {loadingVarieties ? (
          <ActivityIndicator color={c.accent} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.chipRow}>
            {varieties.filter(v => v.stock_remaining > 0).map(v => (
              <Chip key={v.id} label={v.name} selected={selectedVariety?.id === v.id} onPress={() => setSelectedVariety(v)} />
            ))}
          </View>
        )}

        {/* Chocolate */}
        <SectionLabel label="chocolate" />
        <View style={styles.chipRow}>
          {CHOC.map(ch => (
            <Chip key={ch.key} label={ch.label} selected={selectedChoc === ch.key} onPress={() => setSelectedChoc(ch.key)} />
          ))}
        </View>

        {/* Finish */}
        <SectionLabel label="finish" />
        <View style={styles.chipRow}>
          {FIN.map(f => (
            <Chip key={f.key} label={f.label} selected={selectedFinish === f.key} onPress={() => setSelectedFinish(f.key)} />
          ))}
        </View>

        {/* Quantity */}
        <SectionLabel label="quantity" />
        <View style={styles.chipRow}>
          {QTY.map(q => (
            <Chip key={q} label={String(q)} selected={selectedQty === q} onPress={() => setSelectedQty(q)} />
          ))}
        </View>

        {/* Time slot */}
        <SectionLabel label="time slot" />
        {loadingSlots ? (
          <ActivityIndicator color={c.accent} style={{ marginVertical: 12 }} />
        ) : slots.length === 0 ? (
          <Text style={[styles.emptyNote, { color: c.muted }]}>no slots available today</Text>
        ) : (
          <View style={styles.chipRow}>
            {slots.map(s => (
              <Chip
                key={s.id}
                label={s.time}
                selected={selectedSlot?.id === s.id}
                onPress={() => setSelectedSlot(s)}
              />
            ))}
          </View>
        )}

        {/* Note */}
        <SectionLabel label="note (optional)" />
        <TextInput
          style={[styles.noteInput, { color: c.text, borderColor: c.border }]}
          placeholder="add a personal note..."
          placeholderTextColor={c.muted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {/* Summary */}
        {canSend && selectedVariety && (
          <View style={[styles.summary, { borderColor: c.border }]}>
            <Text style={[styles.summaryLine, { color: c.text }]}>{selectedVariety.name}  ×{selectedQty}</Text>
            <Text style={[styles.summaryMeta, { color: c.muted }]}>
              {CHOC.find(c => c.key === selectedChoc)?.label}  ·  {FIN.find(f => f.key === selectedFinish)?.label}
            </Text>
            <Text style={[styles.summaryMeta, { color: c.muted }]}>{selectedSlot?.time}  ·  {location?.name}</Text>
            <Text style={[styles.summaryPrice, { color: c.accent }]}>
              CA${((selectedVariety.price_cents * selectedQty) / 100).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: 18, paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { paddingVertical: 4 },
  backArrow: { fontSize: 28, lineHeight: 34 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  title: { textAlign: 'center', fontSize: 17, fontFamily: fonts.playfair },
  subtitle: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1 },
  sendBtn: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  sendBtnText: { fontSize: 11, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },
  sectionLabel: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  searchInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: fonts.dmMono, marginBottom: 8 },
  customerList: { gap: 6 },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  customerName: { fontSize: 14, fontFamily: fonts.playfair },
  customerMeta: { fontSize: 10, fontFamily: fonts.dmMono },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 11, fontFamily: fonts.dmMono, letterSpacing: 0.3 },
  emptyNote: { fontSize: 12, fontFamily: fonts.dmSans, fontStyle: 'italic', marginVertical: 8 },
  noteInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: fonts.dmMono, minHeight: 70 },
  summary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: SPACING.md, marginTop: 20, gap: 4 },
  summaryLine: { fontSize: 18, fontFamily: fonts.playfair },
  summaryMeta: { fontSize: 10, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
  summaryPrice: { fontSize: 15, fontFamily: fonts.dmMono, marginTop: 4 },
});
