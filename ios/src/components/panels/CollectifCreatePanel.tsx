import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePanel } from '../../context/PanelContext';
import { createCollectif } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

export default function CollectifCreatePanel() {
  const { goBack, showPanel } = usePanel();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountStr, setDiscountStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [deadlineStr, setDeadlineStr] = useState(''); // YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = businessName.trim() && title.trim() && discountStr && priceStr && targetStr && deadlineStr && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const discount = parseInt(discountStr, 10);
    const price = Math.round(parseFloat(priceStr) * 100);
    const target = parseInt(targetStr, 10);
    const deadline = new Date(deadlineStr);

    if (isNaN(discount) || discount < 1 || discount > 80) {
      Alert.alert('Invalid discount', 'Discount must be between 1% and 80%.'); return;
    }
    if (isNaN(price) || price < 100) {
      Alert.alert('Invalid price', 'Price must be at least CA$1.00.'); return;
    }
    if (isNaN(target) || target < 2) {
      Alert.alert('Invalid target', 'Target must be at least 2 commitments.'); return;
    }
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      Alert.alert('Invalid deadline', 'Deadline must be a future date (YYYY-MM-DD).'); return;
    }

    setSubmitting(true);
    try {
      await createCollectif({
        business_name: businessName.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        proposed_discount_pct: discount,
        price_cents: price,
        target_quantity: target,
        deadline: deadline.toISOString(),
      });
      Alert.alert(
        'Collectif posted.',
        'Your proposal is live. Share it with others to build momentum.',
        [{ text: 'OK', onPress: () => { goBack(); showPanel('collectif-list'); } }],
      );
    } catch (e: any) {
      Alert.alert('Could not post', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({
    label, value, onChange, placeholder, keyboardType = 'default', hint,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: any;
    hint?: string;
  }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={keyboardType}
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
        autoCorrect={false}
      />
      {hint && <Text style={[styles.hint, { color: c.muted }]}>{hint}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Propose a Collectif</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, gap: 4, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subheading, { color: c.muted }]}>
          Name the business, describe what you want, set a discount and target. If enough members commit, the business gets a formal request with the full amount pooled.
        </Text>

        <Field
          label="BUSINESS NAME"
          value={businessName}
          onChange={setBusinessName}
          placeholder="e.g. Valrhona, Chocolaterie Bernard"
          hint="Must be a business on the Maison platform."
        />
        <Field
          label="TITLE"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Bulk order — 10 boxes Guanaja 70%"
        />
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.muted }]}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What you're asking for, any specific details…"
            placeholderTextColor={c.muted}
            multiline
            numberOfLines={3}
            style={[styles.textarea, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          />
        </View>
        <Field
          label="PROPOSED DISCOUNT (%)"
          value={discountStr}
          onChange={setDiscountStr}
          placeholder="e.g. 15"
          keyboardType="numeric"
          hint="1–80%. This is what you're asking the business to offer."
        />
        <Field
          label="PRICE PER UNIT AT DISCOUNT (CA$)"
          value={priceStr}
          onChange={setPriceStr}
          placeholder="e.g. 42.50"
          keyboardType="decimal-pad"
          hint="What each member pays. This is held immediately."
        />
        <Field
          label="TARGET (# OF COMMITMENTS)"
          value={targetStr}
          onChange={setTargetStr}
          placeholder="e.g. 20"
          keyboardType="numeric"
          hint="Minimum 2. The business sees the full pooled amount once this is reached."
        />
        <Field
          label="DEADLINE (YYYY-MM-DD)"
          value={deadlineStr}
          onChange={setDeadlineStr}
          placeholder="e.g. 2026-06-01"
          hint="If the target isn't met by this date, everyone is refunded."
        />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: c.accent }, !canSubmit && { opacity: 0.4 }]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitBtnText, { color: c.panelBg }]}>
            {submitting ? 'Posting…' : 'Post Collectif'}
          </Text>
        </TouchableOpacity>
      </View>
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
  backBtn: { width: 40, paddingVertical: 4 },
  backArrow: { fontSize: 28, lineHeight: 34 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: fonts.playfair },
  subheading: { fontFamily: fonts.dmSans, fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 20 },
  field: { gap: 6, marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.dmMono, fontSize: 9, letterSpacing: 1.5 },
  input: {
    fontFamily: fonts.dmMono, fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
  },
  textarea: {
    fontFamily: fonts.dmMono, fontSize: 13,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    minHeight: 80, textAlignVertical: 'top',
  },
  hint: { fontFamily: fonts.dmSans, fontSize: 11, fontStyle: 'italic' },
  footer: {
    padding: SPACING.md, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontFamily: fonts.dmMono, fontSize: 13, letterSpacing: 1 },
});
