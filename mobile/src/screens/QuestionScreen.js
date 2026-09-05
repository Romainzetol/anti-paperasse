import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from "react-native";
import { askAboutDocument } from "../api";
import { colors, spacing, radius, shadow, type } from "../theme";

const TOP_INSET = (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44) + spacing.md;

export default function QuestionScreen({ imageUri, analysis, onBack }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  async function handleAsk() {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setLoading(true);
    try {
      const { answer } = await askAboutDocument(imageUri, q, analysis);
      setExchanges((prev) => [...prev, { question: q, answer }]);
    } catch (err) {
      setExchanges((prev) => [...prev, { question: q, answer: `Erreur : ${err.message}`, isError: true }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backLink}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{analysis.document_type}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {exchanges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Pose une question sur ce document</Text>
            <Text style={styles.emptySubtext}>ex. "Est-ce que je dois payer ?" ou "C'est urgent ?"</Text>
          </View>
        ) : null}
        {exchanges.map((ex, i) => (
          <View key={i} style={styles.exchange}>
            <View style={styles.questionBubbleWrap}>
              <View style={styles.questionBubble}>
                <Text style={styles.questionText}>{ex.question}</Text>
              </View>
            </View>
            <View style={[styles.answerBubble, ex.isError && styles.answerBubbleError]}>
              <Text style={[styles.answerText, ex.isError && styles.answerTextError]}>{ex.answer}</Text>
            </View>
          </View>
        ))}
        {loading ? (
          <View style={styles.answerBubble}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ta question…"
          placeholderTextColor={colors.textMuted}
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={handleAsk}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity style={[styles.sendButton, (!question.trim() || loading) && styles.sendButtonDisabled]} onPress={handleAsk} disabled={!question.trim() || loading} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: TOP_INSET },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  backLink: { color: colors.textSecondary, fontSize: 14.5, fontWeight: "600" },
  headerTitle: { ...type.h2, fontSize: 17, flexShrink: 1 },

  thread: { flex: 1, paddingHorizontal: spacing.lg },
  threadContent: { paddingBottom: spacing.md, flexGrow: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing.xxl },
  emptyEmoji: { fontSize: 34, marginBottom: spacing.sm },
  emptyText: { ...type.body, fontWeight: "600" },
  emptySubtext: { ...type.bodyMuted, marginTop: 4, textAlign: "center" },

  exchange: { marginBottom: spacing.md },
  questionBubbleWrap: { alignItems: "flex-end", marginBottom: spacing.sm },
  questionBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "85%",
  },
  questionText: { color: colors.onPrimary, fontSize: 15, fontWeight: "500" },
  answerBubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: "90%",
    alignSelf: "flex-start",
    ...shadow.card,
  },
  answerBubbleError: { backgroundColor: colors.dangerBg },
  answerText: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  answerTextError: { color: colors.danger },

  inputRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: colors.neutralBg },
  sendButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: "700" },
});
