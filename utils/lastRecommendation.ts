import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_RECOMMENDATION_KEY = "lastRecommendation";

export type LastRecommendation = {
  name: string;
  photo?: string;
};

export async function getLastRecommendation(): Promise<LastRecommendation | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_RECOMMENDATION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LastRecommendation> | null;
    if (!parsed || typeof parsed.name !== "string") {
      return null;
    }

    return {
      name: parsed.name,
      photo: typeof parsed.photo === "string" ? parsed.photo : undefined,
    };
  } catch {
    return null;
  }
}

export async function saveLastRecommendation(recommendation: LastRecommendation): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_RECOMMENDATION_KEY, JSON.stringify(recommendation));
  } catch {
    // Best-effort persistence only.
  }
}
