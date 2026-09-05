import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, StatusBar } from "react-native";
import * as Clipboard from "expo-clipboard";
import { draftReply } from "../api";
import { scheduleDeadlineReminder } from "../notifications";
import { colors, spacing, radius, shadow, type, urgencyTheme } from "../theme";

const TOP_INSET = (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44) + spacing.lg;

export default function ResultScreen({ imageUri, analysis, onAskQuestion, onBackHome }) {
  const [reply, setReply] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = urgencyTheme[analysis.urgency] || { emoji: "⚪", label: "Statut inconnu", fg: colors.textMuted, bg: colors.neutralBg };

  async function handleReminder() {
    if (!analysis.deadline) {
      Alert.alert("Pas d'échéance", "Ce document n'a pas de date limite détectée.");
      return;
    }
    const scheduled = await scheduleDeadlineReminder({
      documentType: analysis.document_type,
      deadline: analysis.deadline,
    });
    if (scheduled) {
      setReminderSet(true);
    } else {
      Alert.alert("Rappel non programmé", "Vérifie que les notifications sont autorisées, ou que la date n'est pas déjà passée.");
    }
  }

  async function handleDraftReply() {
    setDraftLoading(true);
    try {
      const { reply: text } = await draftReply("", analysis);
      setReply(text);
    } catch (err) {
      Alert.alert("Erreur", err.message);
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleCopyReply() {
    await Clipboard.setStringAsync(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backLink} onPress={onBackHome}>
        <Text style={styles.backLinkText}>← Accueil</Text>
      </TouchableOpacity>

      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.emoji}  {meta.label}</Text>
      </View>

      <Text style={styles.type}>{analysis.document_type}</Text>
      {analysis.sender ? <Text style={styles.sender}>{analysis.sender}</Text> : null}

      {(analysis.deadline || analysis.amount_eur != null || analysis.recommended_action) ? (
        <View style={styles.infoBlock}>
          {analysis.deadline ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Échéance</Text>
              <Text style={styles.infoValue}>{analysis.deadline}</Text>
            </View>
          ) : null}
          {analysis.amount_eur != null ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={styles.infoLabel}>Montant</Text>
              <Text style={styles.infoValue}>{analysis.amount_eur} €</Text>
            </View>
          ) : null}
          {analysis.recommended_action ? (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoIcon}>👉</Text>
              <Text style={styles.infoValue} numberOfLines={4}>{analysis.recommended_action}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.summaryLabel}>En résumé</Text>
      <Text style={styles.summary}>{analysis.summary}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleDraftReply} disabled={draftLoading} activeOpacity={0.85}>
          {draftLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>✍️  Rédiger une réponse</Text>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReminder} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>{reminderSet ? "✅ Rappel programmé" : "📅 Ajouter un rappel"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => onAskQuestion({ imageUri, analysis })} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>❓ Poser une question</Text>
          </TouchableOpacity>
        </View>
      </View>

      {reply ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Réponse suggérée</Text>
          <Text style={styles.replyText}>{reply}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyReply} activeOpacity={0.7}>
            <Text style={styles.copyButtonText}>{copied ? "✅ Copié" : "📋 Copier le texte"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: TOP_INSET, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  backLink: { alignSelf: "flex-start", marginBottom: spacing.md },
  backLinkText: { color: colors.textSecondary, fontSize: 14.5, fontWeight: "600" },

  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14, marginBottom: spacing.md },
  badgeText: { fontSize: 13.5, fontWeight: "700" },
  type: { ...type.h1, fontSize: 24 },
  sender: { ...type.bodyMuted, marginTop: 4 },

  infoBlock: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { fontSize: 16, width: 22 },
  infoLabel: { ...type.bodyMuted, width: 76 },
  infoValue: { ...type.body, fontWeight: "600", flexShrink: 1 },

  summaryLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  summary: { ...type.body, color: colors.textSecondary },

  actions: { marginTop: spacing.xl, gap: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.button,
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: 15.5, fontWeight: "700" },
  secondaryRow: { flexDirection: "row", gap: spacing.sm },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 13.5, fontWeight: "600", color: colors.textPrimary },

  replyBox: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary, ...shadow.card },
  replyLabel: { ...type.label, marginBottom: spacing.sm },
  replyText: { ...type.body, lineHeight: 22 },
  copyButton: { marginTop: spacing.md, alignSelf: "flex-start", backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  copyButtonText: { fontWeight: "700", color: colors.primaryDark, fontSize: 13.5 },
});
