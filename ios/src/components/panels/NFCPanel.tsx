import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { usePanel } from '../../context/PanelContext';
import * as Haptics from 'expo-haptics';
import { setVerified } from '../../lib/userId';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function NFCPanel() {
  const { goBack, showPanel } = usePanel();
  const c = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const handleContinue = async () => {
    await setVerified();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showPanel('verified');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Your box.</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.pulseContainer}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulse }], backgroundColor: `${c.accent}18` }]} />
          <View style={[styles.pulseInner, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.boxIcon, { color: c.accent }]}>⬡</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: c.text }]}>
          We're working toward full chip verification as we grow.
        </Text>
        <Text style={[styles.body2, { color: c.muted }]}>
          For now, collecting your order in person is all it takes.
        </Text>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: c.accent }]}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { color: c.accent }]}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 18, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  headerSpacer: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: fonts.playfair },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.lg },
  pulseContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  pulseOuter: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  pulseInner: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  boxIcon: { fontSize: 38 },
  subtitle: { fontSize: 15, fontFamily: fonts.dmSans, textAlign: 'center', lineHeight: 24 },
  actionBtn: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingVertical: 10 },
  actionBtnText: { fontSize: 14, fontFamily: fonts.dmSans },
  fallbackText: { fontSize: 13, fontFamily: fonts.dmSans, textAlign: 'center', lineHeight: 20 },
});
