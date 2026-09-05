import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "anti-paperasse:history";

export async function getHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToHistory(entry) {
  const history = await getHistory();
  const updated = [{ ...entry, id: Date.now().toString(), scannedAt: new Date().toISOString() }, ...history];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
