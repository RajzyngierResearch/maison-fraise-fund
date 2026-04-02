import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { usePanel } from '../../context/PanelContext';
import { fetchContractOffer, acceptContract, declineContract } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function ContractOfferPanel() {
  const { goHome } = usePanel();
  const c = useColors();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user_db_id').then(id => {
      if (!id) { setLoading(false); return; }
      fetchContractOffer(parseInt(id, 10))
        .then(setOffer)
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const handleAccept = async () => {
    if (!offer || acting) return;
    const userId = await AsyncStorage.getItem('user_db_id');
    if (!userId) return;
    setActing(true);
    try {
      await acceptContract(offer.id, parseInt(userId, 10));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to the team',
        `You're now placed at ${offer.business_name}. Your followers have been notified.`,
        [{ text: 'OK', onPress: goHome }]
      );
    } catch (err: any) {
      Alert.alert('Could not accept', err.message ?? 'Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleDecline = () => {
    if (!offer || acting) return;
    Alert.alert(
      'Decline this offer?',
      'This contract will be removed. This cannot be undone.',
      [
        { text: 'Keep offer', style: 'cancel' },
        {
          text: 'Decline', style: 'destructive', onPress: async () => {
            const userId = await AsyncStorage.getItem('user_db_id');
            if (!userId) return;
            setActing(true);
            try {
              await declineContract(offer.id, parseInt(userId, 10));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              goHome();
            } catch {
              Alert.alert('Could not decline', 'Please try again.');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goHome} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Placement offer</Text>
          <Text style={[styles.headerSub, { color: c.muted }]}>MAISON FRAISE</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : !offer ? (
          <Text style={[styles.emptyText, { color: c.muted }]}>No pending offer.</Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.businessName, { color: c.text }]}>{offer.business_name}</Text>
              {offer.business_neighbourhood && (
                <Text style={[styles.neighbourhood, { color: c.muted }]}>{offer.business_neighbourhood}</Text>
              )}
              <Text style={[styles.address, { color: c.muted }]}>{offer.business_address}</Text>

              <View style={[styles.divider, { backgroundColor: c.border }]} />

              <View style={styles.datesRow}>
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateLabel, { color: c.muted }]}>STARTS</Text>
                  <Text style={[styles.dateValue, { color: c.text }]}>{formatDate(offer.starts_at)}</Text>
                </View>
                <View style={[styles.dateSep, { backgroundColor: c.border }]} />
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateLabel, { color: c.muted }]}>ENDS</Text>
                  <Text style={[styles.dateValue, { color: c.text }]}>{formatDate(offer.ends_at)}</Text>
                </View>
              </View>
            </View>

            {offer.note && (
              <View style={[styles.noteCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.noteLabel, { color: c.muted }]}>NOTE FROM MAISON FRAISE</Text>
                <Text style={[styles.noteText, { color: c.text }]}>{offer.note}</Text>
              </View>
            )}

            <View style={[styles.infoCard, { borderColor: c.border }]}>
              <Text style={[styles.infoText, { color: c.muted }]}>
                Accepting places you at this location for the contract period. Members who follow you will be notified. You can log member visits from your home screen.
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: c.accent }, acting && { opacity: 0.6 }]}
                onPress={handleAccept}
                activeOpacity={0.8}
                disabled={acting}
              >
                {acting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.acceptBtnText}>Accept placement</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.declineBtn, { borderColor: c.border }]}
                onPress={handleDecline}
                activeOpacity={0.7}
                disabled={acting}
              >
                <Text style={[styles.declineBtnText, { color: c.muted }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 18,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { paddingVertical: 4, flexShrink: 0 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 17, fontFamily: fonts.playfair },
  headerSub: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  headerSpacer: { width: 32 },
  body: { padding: SPACING.md, gap: 12 },

  card: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  businessName: { fontSize: 22, fontFamily: fonts.playfair },
  neighbourhood: { fontSize: 12, fontFamily: fonts.dmMono, letterSpacing: 0.5 },
  address: { fontSize: 13, fontFamily: fonts.dmSans },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  datesRow: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: { flex: 1, gap: 4 },
  dateSep: { width: StyleSheet.hairlineWidth, height: 36, marginHorizontal: 16 },
  dateLabel: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  dateValue: { fontSize: 15, fontFamily: fonts.playfair },

  noteCard: {
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  noteLabel: { fontSize: 9, fontFamily: fonts.dmMono, letterSpacing: 1.5 },
  noteText: { fontSize: 14, fontFamily: fonts.dmSans, lineHeight: 21 },

  infoCard: {
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { fontSize: 12, fontFamily: fonts.dmSans, lineHeight: 19, fontStyle: 'italic' },

  actions: { gap: 10, marginTop: 8 },
  acceptBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptBtnText: { fontSize: 16, fontFamily: fonts.playfair, color: '#fff' },
  declineBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  declineBtnText: { fontSize: 14, fontFamily: fonts.dmSans },

  emptyText: { fontSize: 15, fontFamily: fonts.dmSans, textAlign: 'center', marginTop: 60, fontStyle: 'italic' },
});
