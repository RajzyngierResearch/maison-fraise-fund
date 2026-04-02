import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePanel } from '../../context/PanelContext';
import { submitPopupRequest } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function PopupRequestPanel() {
  const { goBack, goHome, businesses } = usePanel();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [userDbId, setUserDbId] = useState<number | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const venues = businesses.filter(b => b.type === 'collection' || b.type === 'partner');

  useEffect(() => {
    AsyncStorage.getItem('user_db_id').then(stored => {
      if (stored) setUserDbId(parseInt(stored, 10));
    });
  }, []);

  const validate = (): string | null => {
    if (!selectedVenueId) return 'Select a venue.';
    if (!date.trim()) return 'Enter a date.';
    if (!time.trim()) return 'Enter a time.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert('Almost there', err); return; }
    if (!userDbId) { Alert.alert('Sign in required', 'Sign in with Apple in your profile first.'); return; }
    setSubmitting(true);
    try {
      const { client_secret } = await submitPopupRequest({
        user_id: userDbId,
        venue_id: selectedVenueId!,
        date: date.trim(),
        time: time.trim(),
        notes: notes.trim() || undefined,
      });
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Maison Fraise',
        paymentIntentClientSecret: client_secret,
        appearance: { colors: { primary: '#8B4513' } },
      });
      if (initError) throw new Error(initError.message);
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment failed', payError.message);
        }
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Could not submit', e.message ?? 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: c.panelBg }]}>
        <View style={styles.successBody}>
          <Text style={[styles.successKanji, { color: c.border }]}>祭</Text>
          <Text style={[styles.successTitle, { color: c.text }]}>Request received.</Text>
          <Text style={[styles.successSub, { color: c.muted }]}>
            We'll review your popup and reach out to DJs. You'll hear from us soon.
          </Text>
          <TouchableOpacity
            style={[styles.successBtn, { borderColor: c.border }]}
            onPress={goHome}
            activeOpacity={0.75}
          >
            <Text style={[styles.successBtnText, { color: c.accent }]}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.panelBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Host a popup.</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Venue */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: c.muted }]}>VENUE</Text>
          {venues.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.muted }]}>No partner venues available.</Text>
          ) : (
            <View style={[styles.venueList, { borderColor: c.border }]}>
              {venues.map((v, i) => {
                const selected = selectedVenueId === v.id;
                const isLast = i === venues.length - 1;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.venueRow,
                      { borderBottomColor: c.border },
                      isLast && styles.venueRowLast,
                    ]}
                    onPress={() => setSelectedVenueId(v.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.venueInfo}>
                      <Text style={[styles.venueName, { color: c.text }]}>{v.name}</Text>
                      <Text style={[styles.venueAddress, { color: c.muted }]}>{v.address}</Text>
                    </View>
                    {selected && (
                      <Text style={[styles.venueCheck, { color: c.accent }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: c.muted }]}>DATE</Text>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border }]}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. Jun 14, 2026"
            placeholderTextColor={c.muted}
            returnKeyType="next"
          />
        </View>

        {/* Time */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: c.muted }]}>TIME</Text>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border }]}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 8:00 PM"
            placeholderTextColor={c.muted}
            returnKeyType="next"
          />
        </View>

        {/* DJ notes */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: c.muted }]}>NOTES FOR THE DJ</Text>
          <TextInput
            style={[styles.textarea, { color: c.text, borderColor: c.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the vibe, the crowd, the space…"
            placeholderTextColor={c.muted}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, paddingBottom: insets.bottom || SPACING.md }]}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: selectedVenueId && date.trim() && time.trim() ? c.accent : c.card, borderWidth: selectedVenueId && date.trim() && time.trim() ? 0 : StyleSheet.hairlineWidth, borderColor: c.border }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.ctaText, { color: selectedVenueId && date.trim() && time.trim() ? '#fff' : c.muted }]}>
                Submit request
              </Text>
          }
        </TouchableOpacity>
        <Text style={[styles.ctaHint, { color: c.muted }]}>
          A small submission fee applies. Non-refundable.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.playfair },
  headerSpacer: { width: 40 },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.md, gap: 24 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontFamily: fonts.dmMono, letterSpacing: 1.5 },

  venueList: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  venueRowLast: { borderBottomWidth: 0 },
  venueInfo: { flex: 1, gap: 2 },
  venueName: { fontSize: 15, fontFamily: fonts.playfair },
  venueAddress: { fontSize: 12, fontFamily: fonts.dmSans },
  venueCheck: { fontSize: 16, fontFamily: fonts.dmSans },

  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: fonts.dmSans,
  },
  textarea: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: fonts.dmSans,
    lineHeight: 22,
    minHeight: 100,
  },

  emptyText: { fontSize: 14, fontFamily: fonts.dmSans, fontStyle: 'italic' },

  footer: {
    padding: SPACING.md,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  cta: { borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: fonts.dmSans, fontWeight: '700' },
  ctaHint: { fontSize: 11, fontFamily: fonts.dmSans, textAlign: 'center' },

  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.md },
  successKanji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontFamily: fonts.playfair, textAlign: 'center' },
  successSub: { fontSize: 14, fontFamily: fonts.dmSans, lineHeight: 22, textAlign: 'center' },
  successBtn: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  successBtnText: { fontSize: 14, fontFamily: fonts.dmSans },
});
