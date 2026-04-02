import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePanel } from '../../context/PanelContext';
import { fetchPopupAttendees, fetchNominationStatus, submitNomination } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function NominationPanel() {
  const { goHome, activeLocation } = usePanel();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [userDbId, setUserDbId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<{ user_id: number; display_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasNominated, setHasNominated] = useState(false);

  const biz = activeLocation;

  useEffect(() => {
    if (!biz) { setLoading(false); return; }
    AsyncStorage.getItem('user_db_id').then(async stored => {
      if (!stored) { setLoading(false); return; }
      const uid = parseInt(stored, 10);
      setUserDbId(uid);
      try {
        const [people, status] = await Promise.all([
          fetchPopupAttendees(biz.id),
          fetchNominationStatus(biz.id, uid),
        ]);
        // Exclude self from the list
        setAttendees(people.filter(p => p.user_id !== uid));
        setHasNominated(status.has_nominated);
      } catch {
        // non-fatal — show empty state
      } finally {
        setLoading(false);
      }
    });
  }, [biz?.id]);

  const handleSubmit = async () => {
    if (!biz || !userDbId || !selectedId) return;
    setSubmitting(true);
    try {
      await submitNomination(biz.id, userDbId, selectedId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasNominated(true);
    } catch (err: any) {
      Alert.alert('Could not submit', err.message ?? 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!biz) return null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.panelBg }]}>
        <ActivityIndicator color={c.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (hasNominated) {
    return (
      <View style={[styles.container, { backgroundColor: c.panelBg }]}>
        <View style={styles.centeredBody}>
          <Text style={[styles.doneKanji, { color: c.border }]}>人</Text>
          <Text style={[styles.doneTitle, { color: c.text }]}>Nomination received.</Text>
          <Text style={[styles.doneSub, { color: c.muted }]}>
            Your voice is part of the record.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: c.border }]}
            onPress={goHome}
            activeOpacity={0.75}
          >
            <Text style={[styles.doneBtnText, { color: c.accent }]}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: c.text }]}>From last night.</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>{biz.name}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.prompt, { borderBottomColor: c.border }]}>
        <Text style={[styles.promptText, { color: c.muted }]}>
          Who did you notice? Nominate one person whose presence stood out.
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {attendees.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.muted }]}>
            No other attendees found for this event.
          </Text>
        ) : (
          attendees.map((person, i) => {
            const selected = selectedId === person.user_id;
            const isLast = i === attendees.length - 1;
            return (
              <TouchableOpacity
                key={person.user_id}
                style={[
                  styles.personRow,
                  { borderBottomColor: c.border },
                  isLast && styles.personRowLast,
                  selected && { backgroundColor: `${c.accent}08` },
                ]}
                onPress={() => setSelectedId(selected ? null : person.user_id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.personName, { color: c.text }]}>{person.display_name}</Text>
                {selected && (
                  <Text style={[styles.personCheck, { color: c.accent }]}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, paddingBottom: insets.bottom || SPACING.md }]}>
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: selectedId ? c.accent : c.card,
              borderWidth: selectedId ? 0 : StyleSheet.hairlineWidth,
              borderColor: c.border,
            },
          ]}
          onPress={handleSubmit}
          disabled={!selectedId || submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.ctaText, { color: selectedId ? '#fff' : c.muted }]}>
                Nominate
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  title: { fontSize: 20, fontFamily: fonts.playfair, textAlign: 'center' },
  subtitle: { fontSize: 12, fontFamily: fonts.dmMono, textAlign: 'center' },
  prompt: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  promptText: { fontSize: 14, fontFamily: fonts.dmSans, lineHeight: 22, fontStyle: 'italic' },
  list: { flex: 1 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  personRowLast: { borderBottomWidth: 0 },
  personName: { flex: 1, fontSize: 17, fontFamily: fonts.playfair },
  personCheck: { fontSize: 16 },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.dmSans,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    padding: SPACING.md,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: { borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: fonts.dmSans, fontWeight: '700' },
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  doneKanji: { fontSize: 64 },
  doneTitle: { fontSize: 24, fontFamily: fonts.playfair, textAlign: 'center' },
  doneSub: { fontSize: 14, fontFamily: fonts.dmSans, lineHeight: 22, textAlign: 'center' },
  doneBtn: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  doneBtnText: { fontSize: 14, fontFamily: fonts.dmSans },
});
