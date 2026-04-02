import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { fonts } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const BG = '#F7F5F2';
const TEXT = '#1C1C1E';
const MUTED = '#8E8E93';
const ACCENT = '#8B4513';

const PAGES = [
  {
    kanji: '旬',
    title: 'Maison Fraise.',
    body: 'Seasonal strawberries, sourced and curated with precision. Available while the season lasts.',
  },
  {
    kanji: '所',
    title: 'Find. Order. Collect.',
    body: 'Select a collection point on the map, choose your variety, and collect the same day. Nothing is kept overnight.',
  },
  {
    kanji: '縁',
    title: 'A deeper layer.',
    body: 'Verify your membership by tapping the NFC chip inside your box lid. Unlock popups, standing orders, and a community built around the season.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const isLast = page === PAGES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(newPage);
  };

  const handleNext = () => {
    if (isLast) {
      handleEnter();
    } else {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }
  };

  const handleEnter = async () => {
    await AsyncStorage.setItem('has_onboarded', 'true');
    navigation.replace('Main');
  };

  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <Text style={styles.kanji}>{p.kanji}</Text>
            <View style={styles.pageContent}>
              <Text style={styles.pageTitle}>{p.title}</Text>
              <Text style={styles.pageBody}>{p.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === page ? ACCENT : MUTED, opacity: i === page ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: isLast ? ACCENT : 'transparent', borderColor: isLast ? 'transparent' : MUTED }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaText, { color: isLast ? '#fff' : MUTED }]}>
            {isLast ? 'Enter' : 'Next'}
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleEnter} activeOpacity={0.6} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: MUTED }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  kanji: {
    fontSize: 120,
    color: 'rgba(0,0,0,0.04)',
    fontFamily: fonts.playfair,
    position: 'absolute',
    top: '20%',
  },
  pageContent: { alignItems: 'center', gap: 20 },
  pageTitle: {
    fontSize: 32,
    fontFamily: fonts.playfair,
    color: TEXT,
    textAlign: 'center',
  },
  pageBody: {
    fontSize: 16,
    fontFamily: fonts.dmSans,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 12,
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  ctaText: { fontSize: 16, fontFamily: fonts.dmSans, fontWeight: '700' },
  skipBtn: { paddingVertical: 4 },
  skipText: { fontSize: 14, fontFamily: fonts.dmSans },
});
