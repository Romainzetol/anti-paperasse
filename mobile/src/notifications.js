import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function parseFrenchDate(dateStr) {
  if (!dateStr) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 9, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function ensureNotificationPermission() {
  const { granted } = await Notifications.getPermissionsAsync();
  if (granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

// Programme un rappel `daysBefore` jours avant l'échéance (ou le jour même si trop tard).
export async function scheduleDeadlineReminder({ documentType, deadline, daysBefore = 3 }) {
  const deadlineDate = parseFrenchDate(deadline);
  if (!deadlineDate) return null;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return null;

  const reminderDate = new Date(deadlineDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
  const triggerDate = reminderDate.getTime() > Date.now() ? reminderDate : deadlineDate;
  if (triggerDate.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Échéance à venir : ${documentType}`,
      body: `Date limite : ${deadline}. Ouvre l'app pour voir le détail.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}
