import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getUserId } from '../lib/userId';
import { useColors, colors, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { isDark, toggleTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserId()
      .then(setUserId)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = userId ? userId.substring(3, 7) : '—';

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: c.green }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={c.green} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.avatarHollow, { borderColor: c.muted }]} />
              </View>
              <Text style={[styles.userId, { color: c.muted }]}>{userId}</Text>
            </View>

            {/* Appearance */}
            <View style={[styles.card, { backgroundColor: c.card }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.toggleLabel, { color: c.text }]}>Dark mode</Text>
                  <Text style={[styles.toggleDesc, { color: c.muted }]}>Switch between light and dark appearance.</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ true: c.green }}
                  thumbColor={c.cream}
                />
              </View>
            </View>

            {/* How to get verified */}
            <View style={[styles.instructionCard, { backgroundColor: c.card }]}>
              <Text style={[styles.instructionTitle, { color: c.text }]}>How to get verified</Text>
              <Text style={[styles.instructionText, { color: c.muted }]}>
                Place an order. When you pick it up, open the box and tap your phone to the NFC chip inside the lid.
              </Text>
              <Text style={[styles.instructionText, { color: c.muted }]}>
                Verification links your order to your account and unlocks standing orders and campaign access.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 24,
  },
  backBtn: { paddingVertical: 6, marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 0.5, fontFamily: fonts.dmSans },
  headerTitle: { color: colors.cream, fontSize: 34, fontFamily: fonts.playfair },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.lg, gap: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHollow: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  userId: { fontSize: 13, letterSpacing: 1.5, fontFamily: fonts.dmMono },
  card: { borderRadius: 14, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: 12,
  },
  toggleLabel: { fontSize: 15, fontFamily: fonts.playfair },
  toggleDesc: { fontSize: 13, lineHeight: 19, fontFamily: fonts.dmSans },
  instructionCard: { borderRadius: 14, padding: SPACING.md, gap: 12 },
  instructionTitle: { fontSize: 16, fontFamily: fonts.playfair },
  instructionText: { fontSize: 14, lineHeight: 22, fontFamily: fonts.dmSans },
});
