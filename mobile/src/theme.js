// Système de design partagé par tous les écrans. Centraliser les couleurs/espacements
// ici évite le "chacun sa couleur de gris" et permet de changer le style de l'appli
// en un seul endroit plus tard (ex: thème sombre).

export const colors = {
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  border: "#E8EAF0",
  textPrimary: "#14161F",
  textSecondary: "#666B78",
  textMuted: "#9AA0AC",

  primary: "#2F6FED",
  primaryDark: "#204FBB",
  primarySoft: "#EAF1FF",
  onPrimary: "#FFFFFF",

  success: "#15924B",
  successBg: "#E7F8EE",
  warning: "#C2760C",
  warningBg: "#FFF3E1",
  danger: "#D3392E",
  dangerBg: "#FDECEA",
  neutralBg: "#EEF0F4",
};

export const urgencyTheme = {
  aucune_action: { emoji: "🟢", label: "Aucune action nécessaire", fg: colors.success, bg: colors.successBg },
  a_surveiller: { emoji: "🟠", label: "À surveiller", fg: colors.warning, bg: colors.warningBg },
  action_necessaire: { emoji: "🔴", label: "Action nécessaire", fg: colors.danger, bg: colors.dangerBg },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const shadow = {
  card: {
    shadowColor: "#0F1730",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  button: {
    shadowColor: "#2F6FED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
};

export const type = {
  h1: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  h2: { fontSize: 21, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.2 },
  body: { fontSize: 15.5, color: colors.textPrimary, lineHeight: 22 },
  bodyMuted: { fontSize: 14.5, color: colors.textSecondary, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.4, textTransform: "uppercase" },
};
