import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { usePanel } from '../../context/PanelContext';
import { uploadPortalContent } from '../../lib/api';
import { useColors, fonts, SPACING } from '../../theme';

export default function PortalUploadPanel() {
  const { goBack } = usePanel();
  const c = useColors();

  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!mediaUrl.trim() || uploading) return;
    setUploading(true);
    try {
      await uploadPortalContent(mediaUrl.trim(), mediaType, caption.trim() || undefined);
      setSuccess(true);
      setTimeout(() => goBack(), 1500);
    } catch (e: any) {
      Alert.alert('ERR: upload failed', e.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panelBg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: c.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerPrompt, { color: c.accent }]}>{'> '}</Text>
          <Text style={[styles.headerTitle, { color: c.text }]}>{'upload content'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

        {success ? (
          <Text style={[styles.successText, { color: '#4CAF50' }]}>{'OK: content uploaded'}</Text>
        ) : (
          <>
            {/* Type selector */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, mediaType === 'photo' && { borderColor: c.accent }]}
                onPress={() => setMediaType('photo')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeBtnText, { color: mediaType === 'photo' ? c.accent : c.muted }]}>
                  {'> PHOTO_'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, mediaType === 'video' && { borderColor: c.accent }]}
                onPress={() => setMediaType('video')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeBtnText, { color: mediaType === 'video' ? c.accent : c.muted }]}>
                  {'> VIDEO_'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.muted }]}>{'media url'}</Text>
            <TextInput
              style={[styles.urlInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={mediaUrl}
              onChangeText={setMediaUrl}
              placeholder="https://..."
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={[styles.separator, { color: c.border }]}>{'────────────────────────────────'}</Text>

            <Text style={[styles.inputLabel, { color: c.muted }]}>{'caption (optional)'}</Text>
            <TextInput
              style={[styles.captionInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="add a caption..."
              placeholderTextColor={c.muted}
              multiline
              maxLength={280}
            />

            <TouchableOpacity
              style={[styles.actionLine, (!mediaUrl.trim() || uploading) && { opacity: 0.4 }]}
              onPress={handleUpload}
              activeOpacity={0.7}
              disabled={!mediaUrl.trim() || uploading}
            >
              <Text style={[styles.actionText, { color: c.accent }]}>
                {uploading ? '> uploading_' : '> UPLOAD_'}
              </Text>
            </TouchableOpacity>
          </>
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

  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: 16 },
  separator: { fontFamily: fonts.dmMono, fontSize: 11 },

  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderColor: 'transparent',
  },
  typeBtnText: { fontFamily: fonts.dmMono, fontSize: 13 },

  inputLabel: { fontFamily: fonts.dmMono, fontSize: 11, letterSpacing: 1 },
  urlInput: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  captionInput: {
    fontFamily: fonts.dmMono,
    fontSize: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionLine: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontFamily: fonts.dmMono, fontSize: 13 },
  successText: { fontFamily: fonts.dmMono, fontSize: 13 },
});
