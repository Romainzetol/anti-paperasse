import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, StatusBar } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getHistory } from "../storage";
import { colors, spacing, radius, shadow, type, urgencyTheme } from "../theme";

const TOP_INSET = (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44) + spacing.lg;

// `refreshKey` change à chaque retour sur cet écran (voir App.js) pour forcer
// le rechargement de l'historique sans dépendre d'une librairie de navigation.
export default function HomeScreen({ onDocumentCaptured, onOpenHistoryItem, refreshKey }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory().then(setHistory);
  }, [refreshKey]);

  async function handleScan() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled) return;

    onDocumentCaptured(result.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>📄</Text>
        </View>
        <Text style={styles.title}>Anti-paperasse</Text>
        <Text style={styles.subtitle}>Prends ton courrier en photo. On te dit quoi faire, simplement.</Text>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.85}>
        <Text style={styles.scanButtonIcon}>📸</Text>
        <Text style={styles.scanButtonText}>Scanner un document</Text>
      </TouchableOpacity>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Historique</Text>
        {history.length > 0 ? <Text style={styles.historyCount}>{history.length}</Text> : null}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={history.length === 0 ? styles.listEmptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyText}>Aucun document scanné pour l'instant.</Text>
            <Text style={styles.emptySubtext}>Ton historique apparaîtra ici après ton premier scan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = urgencyTheme[item.analysis?.urgency] || { emoji: "⚪", fg: colors.textMuted, bg: colors.neutralBg };
          return (
            <TouchableOpacity style={styles.historyItem} onPress={() => onOpenHistoryItem(item)} activeOpacity={0.7}>
              <View style={[styles.historyIconWrap, { backgroundColor: meta.bg }]}>
                <Text style={styles.historyIcon}>{meta.emoji}</Text>
              </View>
              <View style={styles.historyTextBlock}>
                <Text style={styles.historyType} numberOfLines={1}>{item.analysis?.document_type || "Document"}</Text>
                <Text style={styles.historyDate}>
                  {item.analysis?.deadline ? `Échéance : ${item.analysis.deadline}` : "Pas d'échéance"}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: TOP_INSET, paddingHorizontal: spacing.lg, backgroundColor: colors.bg },
  header: { marginBottom: spacing.lg },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 26 },
  title: { ...type.h1 },
  subtitle: { ...type.bodyMuted, marginTop: spacing.xs, maxWidth: "92%" },

  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...shadow.button,
  },
  scanButtonIcon: { fontSize: 18 },
  scanButtonText: { color: colors.onPrimary, fontSize: 16.5, fontWeight: "700" },

  historyHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.xl, marginBottom: spacing.md },
  historyTitle: { ...type.h2, fontSize: 18 },
  historyCount: {
    ...type.label,
    backgroundColor: colors.neutralBg,
    color: colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
  },

  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  listEmptyContent: { flex: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...type.body, fontWeight: "600" },
  emptySubtext: { ...type.bodyMuted, marginTop: 4, textAlign: "center" },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 4,
  },
  historyIcon: { fontSize: 18 },
  historyTextBlock: { flex: 1 },
  historyType: { fontSize: 15.5, fontWeight: "600", color: colors.textPrimary },
  historyDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing.xs },
});
