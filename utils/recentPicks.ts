import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_PICKS_KEY = "recentPicks";
const MAX_RECENT_PICKS = 5;

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export async function getRecentPicks(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_PICKS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export async function saveRecentPick(placeName: string): Promise<void> {
  try {
    const recent = await getRecentPicks();
    const next = recent
      .filter((item) => normalizeName(item) !== normalizeName(placeName))
      .concat(placeName)
      .slice(-MAX_RECENT_PICKS);

    await AsyncStorage.setItem(RECENT_PICKS_KEY, JSON.stringify(next));
  } catch {
    // Best-effort persistence only.
  }
}
