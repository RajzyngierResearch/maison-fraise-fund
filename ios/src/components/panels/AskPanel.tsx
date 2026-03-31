import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { askClaude } from '../../lib/api';
import { colors, fonts } from '../../theme';
import { SPACING } from '../../theme';

interface Message {
  role: 'user' | 'claude';
  text: string;
}

export default function AskPanel() {
  const { goBack, order, varieties, businesses, setOrder, showPanel } = usePanel();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<any>(null);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const typewriterReveal = (text: string) => {
    let i = 0;
    setDisplayedResponse('');
    const interval = setInterval(() => {
      i++;
      setDisplayedResponse(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setDisplayedResponse('');
    setAction(null);

    try {
      const result = await askClaude(q, varieties, businesses);
      typewriterReveal(result.response);
      if (result.action?.type === 'order' && result.action.variety_id) {
        setAction(result.action);
      }
      setMessages(prev => [...prev, { role: 'claude', text: result.response }]);
    } catch {
      typewriterReveal('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = () => {
    if (!action) return;
    setOrder({
      variety_id: action.variety_id,
      chocolate: action.chocolate,
      finish: action.finish,
      quantity: action.quantity ?? 4,
    });
    goBack();
    showPanel('chocolate');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => { goBack(); TrueSheet.present('main-sheet', 1); }}>
        <Text style={styles.backText}>← back</Text>
      </TouchableOpacity>

      {/* History */}
      <ScrollView style={styles.history} contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.slice(0, -1).map((m, i) => (
          <Text
            key={i}
            style={[
              styles.historyText,
              m.role === 'user' ? styles.historyUser : styles.historyClaude,
            ]}
          >
            {m.text}
          </Text>
        ))}

        {/* Current response typewriter */}
        {displayedResponse !== '' && (
          <Text style={styles.claudeResponse}>{displayedResponse}</Text>
        )}
        {loading && displayedResponse === '' && (
          <Text style={styles.claudeResponse}>_</Text>
        )}

        {/* Action card */}
        {action && (
          <TouchableOpacity style={styles.actionCard} onPress={handleOrderAction} activeOpacity={0.9}>
            <Text style={styles.actionVariety}>{varieties.find(v => v.id === action.variety_id)?.name ?? 'Recommendation'}</Text>
            <Text style={styles.actionDetail}>{action.chocolate} · {action.finish}</Text>
            <View style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Order this →</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          placeholderTextColor="transparent"
          selectionColor={colors.terminalText}
          cursorColor={colors.terminalText}
        />
        {input === '' && (
          <Animated.View style={[styles.fakeCursor, { opacity: cursorAnim }]} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.terminal },
  back: { paddingHorizontal: SPACING.md, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: fonts.dmMono },
  history: { flex: 1, paddingHorizontal: SPACING.md },
  historyText: { fontSize: 14, fontFamily: fonts.dmMono, marginBottom: 12, lineHeight: 22 },
  historyUser: { color: 'rgba(255,255,255,0.4)' },
  historyClaude: { color: 'rgba(245,166,35,0.4)' },
  claudeResponse: { fontSize: 14, fontFamily: fonts.dmMono, color: colors.terminalClaude, lineHeight: 22, marginBottom: 12 },
  actionCard: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: 16,
    gap: 6,
  },
  actionVariety: { fontSize: 18, color: colors.text, fontFamily: fonts.playfair },
  actionDetail: { fontSize: 13, color: colors.muted, fontFamily: fonts.dmSans },
  actionBtn: {
    marginTop: 8,
    backgroundColor: colors.green,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  actionBtnText: { color: colors.cream, fontSize: 13, fontFamily: fonts.dmSans, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.dmMono,
    color: colors.terminalText,
    paddingVertical: 4,
  },
  fakeCursor: {
    position: 'absolute',
    left: SPACING.md,
    top: 18,
    width: 2,
    height: 16,
    backgroundColor: colors.terminalText,
    borderRadius: 1,
  },
});
