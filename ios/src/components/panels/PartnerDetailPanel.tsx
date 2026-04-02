import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchBusinessPortraits } from '../../lib/api';
import { useColors, fonts } from '../../theme';
import { SPACING } from '../../theme';

export default function PartnerDetailPanel() {
  const { goBack, activeLocation } = usePanel();
  const c = useColors();
  const [portraits, setPortraits] = useState<{ id: number; url: string; season: string; subject_name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const biz = activeLocation;

  useEffect(() => {
    if (!biz) { setLoading(false); return; }
    fetchBusinessPortraits(biz.id)
      .then(setPortraits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [biz?.id]);

  const handleInstagram = (handle: string) => {
    Linking.openURL(`https://instagram.com/${handle.replace('@', '')}`);
  };

  if (!biz) return null;

  // Group portraits by season/campaign
  const campaigns = portraits.reduce<Record<string, typeof portraits>>((acc, p) => {
    if (!acc[p.season]) acc[p.season] = [];
    acc[p.season].push(p);
    return acc;
  }, {});
  const campaignKeys = Object.keys(campaigns);

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{biz.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Business info */}
        <View style={[styles.infoBlock, { borderBottomColor: c.border }]}>
          {!!biz.description && (
            <Text style={[styles.description, { color: c.muted }]}>{biz.description}</Text>
          )}
          <View style={styles.metaRow}>
            {!!biz.neighbourhood && (
              <Text style={[styles.metaText, { color: c.muted }]}>{biz.neighbourhood}</Text>
            )}
            {!!biz.instagram_handle && (
              <TouchableOpacity onPress={() => handleInstagram(biz.instagram_handle!)} activeOpacity={0.7}>
                <Text style={[styles.metaText, { color: c.accent }]}>
                  @{biz.instagram_handle.replace('@', '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {!!biz.address && (
            <Text style={[styles.addressText, { color: c.muted }]}>{biz.address}</Text>
          )}
        </View>

        {/* Portrait rail */}
        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : campaignKeys.length === 0 ? null : (
          <View style={styles.portraitsSection}>
            <Text style={[styles.portraitsLabel, { color: c.muted }]}>CAMPAIGNS</Text>
            {campaignKeys.map(season => (
              <View key={season} style={styles.campaign}>
                <Text style={[styles.campaignSeason, { color: c.muted }]}>{season}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.portraitRail}
                >
                  {campaigns[season].map(p => (
                    <View key={p.id} style={styles.portraitItem}>
                      <Image
                        source={{ uri: p.url }}
                        style={[styles.portraitImage, { backgroundColor: c.card }]}
                        resizeMode="cover"
                      />
                      {!!p.subject_name && (
                        <Text style={[styles.portraitName, { color: c.muted }]}>{p.subject_name}</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
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
  infoBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  description: { fontSize: 14, fontFamily: fonts.dmSans, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 14 },
  metaText: { fontSize: 12, fontFamily: fonts.dmMono },
  addressText: { fontSize: 12, fontFamily: fonts.dmSans },
  portraitsSection: {
    paddingTop: SPACING.md,
    gap: 20,
  },
  portraitsLabel: {
    fontSize: 10,
    fontFamily: fonts.dmMono,
    letterSpacing: 1.5,
    paddingHorizontal: SPACING.md,
  },
  campaign: { gap: 10 },
  campaignSeason: {
    fontSize: 12,
    fontFamily: fonts.dmMono,
    paddingHorizontal: SPACING.md,
  },
  portraitRail: {
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  portraitItem: { gap: 5 },
  portraitImage: {
    width: 160,
    height: 200,
    borderRadius: 4,
  },
  portraitName: {
    fontSize: 11,
    fontFamily: fonts.dmMono,
    textAlign: 'center',
    width: 160,
  },
});
