import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Image,
  StyleSheet, Alert,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { initiateNfcPairing, confirmNfcPairing } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
}

type Phase = 'loading' | 'waiting' | 'confirming' | 'success' | 'error';

export default function NfcTapPanel() {
  const { goBack } = usePanel();
  const c = useColors();

  const [phase, setPhase] = useState<Phase>('loading');
  const [myToken, setMyToken] = useState<string>('');
  const [theirCode, setTheirCode] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [connectedUser, setConnectedUser] = useState<{
    id: number;
    display_name: string;
    membership_tier: string;
    portrait_url?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const closingRef = useRef(false);

  useEffect(() => {
    initiateNfcPairing()
      .then(({ token }) => {
        // Show first 6 chars as display code
        setMyToken(token.slice(0, 6).toUpperCase());
        setPhase('waiting');
      })
      .catch(() => {
        setErrorMsg('ERR: could not initiate pairing');
        setPhase('error');
      });
  }, []);

  const handleConfirm = async () => {
    if (!theirCode.trim() || confirming) return;
    setConfirming(true);
    try {
      const result = await confirmNfcPairing(theirCode.trim().toUpperCase());
      setConnectedUser(result.user);
      setPhase('confirming');
    } catch (e: any) {
      Alert.alert('ERR: pairing failed', e.message ?? 'Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleConnect = () => {
    setPhase('success');
    closingRef.current = true;
    setTimeout(() => {
      if (closingRef.current) goBack();
    }, 1500);
  };

  const handleDecline = () => {
    goBack();
  };

  useEffect(() => {
    return () => { closingRef.current = false; };
  }, []);

  const getInitials = (name: string) => name.slice(0, 1).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>{'nfc pairing'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {phase === 'loading' && (
          <View style={styles.centered}>
            <Text style={[styles.bodyText, { color: c.muted }]}>{'initializing'}</Text>
            <BlinkingCursor />
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: '#FF3B30' }]}>{errorMsg}</Text>
          </View>
        )}

        {phase === 'waiting' && (
          <View style={styles.waitingContainer}>
            <Text style={[styles.bodyText, { color: c.muted }]}>{'hold devices together'}</Text>
            <Text style={[styles.bodyText, { color: c.muted }]}>{'to exchange contact'}</Text>

            <View style={styles.codeBlock}>
              <Text style={[styles.codeLabel, { color: c.muted }]}>{'> your code:'}</Text>
              <Text style={[styles.codeValue, { color: c.text }]}>{myToken}</Text>
            </View>

            <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

            <Text style={[styles.inputLabel, { color: c.muted }]}>{'> enter their code:'}</Text>
            <TextInput
              style={[styles.codeInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={theirCode}
              onChangeText={t => setTheirCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="XXXXXX"
              placeholderTextColor={c.muted}
            />

            <TouchableOpacity
              style={[styles.connectBtn, { borderColor: c.accent }, (!theirCode.trim() || confirming) && { opacity: 0.4 }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={!theirCode.trim() || confirming}
            >
              <Text style={[styles.connectBtnText, { color: c.accent }]}>
                {confirming ? '> connecting_' : '> PAIR_'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'confirming' && connectedUser && (
          <View style={styles.confirmContainer}>
            <Text style={[styles.bodyText, { color: c.muted }]}>{'> connecting...'}</Text>

            <View style={[styles.profileCard, { borderColor: c.border }]}>
              {connectedUser.portrait_url ? (
                <Image source={{ uri: connectedUser.portrait_url }} style={styles.portrait} />
              ) : (
                <View style={[styles.initialsCircle, { backgroundColor: c.accent }]}>
                  <Text style={styles.initialsText}>{getInitials(connectedUser.display_name)}</Text>
                </View>
              )}
              <Text style={[styles.connectedName, { color: c.text }]}>{connectedUser.display_name}</Text>
              <Text style={[styles.connectedTier, { color: c.muted }]}>{`Maison · ${connectedUser.membership_tier}`}</Text>

              <View style={[styles.separator2, { borderColor: c.border }]} />

              <View style={styles.decisionRow}>
                <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: c.accent }]} onPress={handleConnect} activeOpacity={0.8}>
                  <Text style={[styles.decisionBtnText, { color: '#fff' }]}>CONNECT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: 'transparent', borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]} onPress={handleDecline} activeOpacity={0.8}>
                  <Text style={[styles.decisionBtnText, { color: c.muted }]}>DECLINE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centered}>
            <Text style={[styles.successText, { color: '#4CAF50' }]}>{'OK: connection established'}</Text>
          </View>
        )}
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
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { fontSize: 28, lineHeight: 34 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerPrompt: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 1 },
  headerTitle: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  headerSpacer: { width: 40 },

  body: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  bodyText: { fontFamily: fonts.dmMono, fontSize: 13 },
  errorText: { fontFamily: fonts.dmMono, fontSize: 13 },
  successText: { fontFamily: fonts.dmMono, fontSize: 13 },

  waitingContainer: { gap: 16 },
  codeBlock: { gap: 4 },
  codeLabel: { fontFamily: fonts.dmMono, fontSize: 12 },
  codeValue: { fontFamily: fonts.dmMono, fontSize: 32, letterSpacing: 8 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11 },
  inputLabel: { fontFamily: fonts.dmMono, fontSize: 12 },
  codeInput: {
    fontFamily: fonts.dmMono,
    fontSize: 24,
    letterSpacing: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  connectBtn: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  connectBtnText: { fontFamily: fonts.dmMono, fontSize: 13 },

  confirmContainer: { gap: 20 },
  profileCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 10,
  },
  portrait: { width: 72, height: 72, borderRadius: 36 },
  initialsCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontFamily: fonts.dmMono, fontSize: 28, color: '#fff' },
  connectedName: { fontFamily: fonts.dmMono, fontSize: 16, letterSpacing: 1 },
  connectedTier: { fontFamily: fonts.dmMono, fontSize: 12 },
  separator2: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 4 },
  decisionRow: { flexDirection: 'row', gap: 12 },
  decisionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  decisionBtnText: { fontFamily: fonts.dmMono, fontSize: 12, letterSpacing: 2 },
});
