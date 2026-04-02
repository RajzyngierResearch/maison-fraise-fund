import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  StyleSheet, Dimensions, ActivityIndicator, StatusBar,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchBusinessPortraits } from '../../lib/api';
import { useColors, fonts } from '../../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function LookbookPanel() {
  const { goBack, activeLocation, panelData } = usePanel();
  const c = useColors();
  const [portraits, setPortraits] = useState<{ id: number; url: string; season: string | null; subject_name?: string; campaign_title?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(panelData?.initialIndex ?? 0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!activeLocation) { setLoading(false); return; }
    fetchBusinessPortraits(activeLocation.id)
      .then(p => {
        setPortraits(p as any[]);
        const idx = panelData?.initialIndex ?? 0;
        if (idx > 0) {
          setTimeout(() => listRef.current?.scrollToIndex({ index: idx, animated: false }), 100);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeLocation?.id]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  if (!activeLocation) return null;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={goBack} activeOpacity={0.7}>
        <Text style={styles.closeBtnText}>←</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ flex: 1 }} />
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={portraits}
            keyExtractor={p => String(p.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
                <View style={styles.overlay}>
                  {!!item.subject_name && (
                    <Text style={styles.subjectName}>{item.subject_name}</Text>
                  )}
                  {!!item.season && (
                    <Text style={styles.season}>{item.season}</Text>
                  )}
                </View>
              </View>
            )}
          />
          <View style={styles.footer}>
            <Text style={styles.counter}>{currentIndex + 1} / {portraits.length}</Text>
            <Text style={styles.venueName}>{activeLocation.name}</Text>
          </View>
          <View style={styles.dots}>
            {portraits.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute', top: 52, left: 20, zIndex: 10,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 28, color: '#fff', lineHeight: 34 },
  slide: { width: SCREEN_W, height: SCREEN_H },
  image: { width: SCREEN_W, height: SCREEN_H },
  overlay: {
    position: 'absolute', bottom: 120, left: 24, right: 24, gap: 4,
  },
  subjectName: { fontSize: 28, fontFamily: 'PlayfairDisplay_400Regular_Italic', color: '#fff' },
  season: { fontSize: 12, fontFamily: 'DMMono_400Regular', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  footer: {
    position: 'absolute', bottom: 48, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  counter: { fontSize: 11, fontFamily: 'DMMono_400Regular', color: 'rgba(255,255,255,0.6)' },
  venueName: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)' },
  dots: {
    position: 'absolute', bottom: 88, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
