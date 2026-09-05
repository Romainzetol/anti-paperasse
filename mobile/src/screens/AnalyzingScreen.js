import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { colors, spacing, radius, shadow, type } from "../theme";

const STEPS = [
  "Lecture du document…",
  "Identification du type de courrier…",
  "Recherche d'une échéance ou d'un montant…",
  "Rédaction du résumé…",
];

export default function AnalyzingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [fade]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📄</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
        <Text style={styles.title}>Analyse en cours</Text>
        <Animated.Text style={[styles.step, { opacity: fade }]}>{STEPS[stepIndex]}</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    ...shadow.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 30 },
  title: { ...type.h2, marginTop: spacing.lg },
  step: { ...type.bodyMuted, marginTop: spacing.sm, textAlign: "center" },
});
