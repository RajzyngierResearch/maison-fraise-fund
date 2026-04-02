import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { fetchChocolateLocations } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

function fmtCents(cents: number): string {
  return `CA$${(cents / 100).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
}

function locationDisplayName(loc: any): string {
  if (loc.location_type === 'collab_chocolate' && loc.partner_name) {
    return `MAISON FRAISE × ${(loc.partner_name as string).toUpperCase()}`;
  }
  return (loc.name as string ?? 'UNNAMED').toUpperCase();
}

export default function ChocolateLocationsPanel() {
  const { goBack, showPanel } = usePanel();
  const c = useColors();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchChocolateLocations();
      setLocations(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const houseLocations = locations.filter(l => l.location_type === 'house_chocolate');
  const collabLocations = locations.filter(l => l.location_type === 'collab_chocolate');

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.accent, fontFamily: fonts.dmMono }]}>
          {'> chocolate shops'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
        >
          <Text style={[styles.separator, { color: c.border }]}>
            {'────────────────────────────────'}
          </Text>

          {locations.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.accent, fontFamily: fonts.dmMono }]}>
              {'> no chocolate locations yet._'}
            </Text>
          ) : (
            <>
              {/* House locations */}
              {houseLocations.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, { color: c.muted, fontFamily: fonts.dmMono }]}>
                    {'MAISON FRAISE LOCATIONS'}
                  </Text>
                  <Text style={[styles.separator, { color: c.border }]}>
                    {'────────────────────────────────'}
                  </Text>
                  {houseLocations.map(loc => {
                    const hasPatron = !!loc.founding_patron_id;
                    const isInaugurated = hasPatron || !!loc.inaugurated_at;
                    const operatingCents: number = loc.operating_cost_cents ?? 0;
                    return (
                      <View key={loc.id} style={styles.locationBlock}>
                        <Text style={[styles.locationName, { color: c.text, fontFamily: fonts.dmMono }]}>
                          {locationDisplayName(loc)}
                        </Text>
                        {!isInaugurated && operatingCents > 0 && (
                          <Text style={[styles.locationMeta, { color: c.muted, fontFamily: fonts.dmMono }]}>
                            {`10-year founding · ${fmtCents(operatingCents)}`}
                          </Text>
                        )}
                        {!isInaugurated ? (
                          <TouchableOpacity
                            onPress={() =>
                              showPanel('chocolate-location-detail', {
                                businessId: loc.id,
                                mode: 'fund',
                              })
                            }
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.actionLink, { color: c.accent, fontFamily: fonts.dmMono }]}>
                              {'> fund this location_'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              showPanel('chocolate-location-detail', { businessId: loc.id })
                            }
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.actionLink, { color: c.accent, fontFamily: fonts.dmMono }]}>
                              {'> view_'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </>
              )}

              {/* Collab locations */}
              {collabLocations.length > 0 && (
                <>
                  <Text style={[styles.separator, { color: c.border }]}>
                    {'────────────────────────────────'}
                  </Text>
                  <Text style={[styles.sectionHeader, { color: c.muted, fontFamily: fonts.dmMono }]}>
                    {'COLLABORATIONS'}
                  </Text>
                  <Text style={[styles.separator, { color: c.border }]}>
                    {'────────────────────────────────'}
                  </Text>
                  {collabLocations.map(loc => (
                    <View key={loc.id} style={styles.locationBlock}>
                      <Text style={[styles.locationName, { color: c.text, fontFamily: fonts.dmMono }]}>
                        {locationDisplayName(loc)}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          showPanel('chocolate-location-detail', { businessId: loc.id })
                        }
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.actionLink, { color: c.accent, fontFamily: fonts.dmMono }]}>
                          {'> view_'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <Text style={[styles.separator, { color: c.border }]}>
            {'────────────────────────────────'}
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  title: { flex: 1, textAlign: 'center', fontSize: 13, letterSpacing: 0.5 },
  headerSpacer: { width: 40 },
  body: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: 6,
  },
  separator: { fontFamily: fonts.dmMono, fontSize: 11, marginVertical: 4 },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  locationBlock: {
    gap: 2,
    marginBottom: 10,
  },
  locationName: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  locationMeta: {
    fontSize: 11,
  },
  actionLink: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginTop: 8,
  },
});
