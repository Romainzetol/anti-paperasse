// Depuis Expo SDK 53, `expo-notifications` ne peut plus être importé au chargement
// dans Expo Go sur Android : les fonctions de notifications push ont été retirées
// et le simple `import` du module lève une erreur qui empêche l'app de démarrer
// ("Use a development build instead of Expo Go").
//
// On charge donc le module dynamiquement, uniquement au moment où l'utilisateur
// programme un rappel, et on échoue proprement (retour `null`) si ce n'est pas
// disponible dans cet environnement. Dans un build de développement ou de
// production (EAS build / `expo run:android` / `expo run:ios`), tout fonctionne
// normalement, rappels locaux compris.

let notificationsModulePromise;

async function getNotifications() {
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").then((mod) => {
      const Notifications = mod.default ?? mod;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    });
  }
  return notificationsModulePromise;
}

function parseFrenchDate(dateStr) {
  if (!dateStr) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 9, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Programme un rappel `daysBefore` jours avant l'échéance (ou le jour même si trop
// tard). Retourne l'identifiant de la notification, ou `null` si le rappel n'a pas
// pu être programmé : date invalide ou déjà passée, permission refusée, ou
// notifications indisponibles dans cet environnement (cas d'Expo Go sur Android).
export async function scheduleDeadlineReminder({ documentType, deadline, daysBefore = 3 }) {
  const deadlineDate = parseFrenchDate(deadline);
  if (!deadlineDate) return null;

  try {
    const Notifications = await getNotifications();

    const { granted } = await Notifications.getPermissionsAsync();
    const hasPermission = granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!hasPermission) return null;

    const reminderDate = new Date(deadlineDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    const triggerDate = reminderDate.getTime() > Date.now() ? reminderDate : deadlineDate;
    if (triggerDate.getTime() <= Date.now()) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `Échéance à venir : ${documentType}`,
        body: `Date limite : ${deadline}. Ouvre l'app pour voir le détail.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (err) {
    console.warn("Rappel non programmé (notifications indisponibles) :", err?.message);
    return null;
  }
}
