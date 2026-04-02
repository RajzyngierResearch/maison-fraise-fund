import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TokenVisual } from './TokenVisual';
import { fonts } from '../theme';

export interface PatronTokenData {
  tokenId: number;
  locationName: string;
  year: number;
  patronHandle: string;
}

interface PatronTokenCardProps {
  data: PatronTokenData;
  onPress?: () => void;
}

export function PatronTokenCard({ data, onPress }: PatronTokenCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.visualWrapper}>
        <TokenVisual
          tokenId={data.tokenId}
          size={100}
          color="#1A237E"
          seeds={144}
          irregularity={100}
          width={120}
        />
      </View>
      <Text style={styles.label}>SEASON PATRON</Text>
      <Text style={styles.meta}>{data.locationName.toUpperCase()} · {data.year}</Text>
      <Text style={styles.handle}>@{data.patronHandle}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF8F2',
    borderWidth: 1.5,
    borderColor: '#D4A843',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
    width: 180,
  },
  visualWrapper: {
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: '#1A237E',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  meta: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  handle: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
