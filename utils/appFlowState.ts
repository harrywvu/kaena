import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_RECOMMENDATION_KEY = "hasCompletedFirstRecommendation";
const RESULT_ACTIONS_UNLOCKED_KEY = "hasUnlockedResultActions";

type FlowFlags = {
  hasCompletedFirstRecommendation: boolean;
  hasUnlockedResultActions: boolean;
};

async function readBoolean(key: string) {
  try {
    return (await AsyncStorage.getItem(key)) === "true";
  } catch {
    return false;
  }
}

async function writeBoolean(key: string, value: boolean) {
  try {
    await AsyncStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Best-effort persistence only.
  }
}

export async function getFlowFlags(): Promise<FlowFlags> {
  const [hasCompletedFirstRecommendation, hasUnlockedResultActions] = await Promise.all([
    readBoolean(FIRST_RECOMMENDATION_KEY),
    readBoolean(RESULT_ACTIONS_UNLOCKED_KEY),
  ]);

  return {
    hasCompletedFirstRecommendation,
    hasUnlockedResultActions,
  };
}

export async function markFirstRecommendationComplete() {
  await writeBoolean(FIRST_RECOMMENDATION_KEY, true);
}

export async function markResultActionsUnlocked() {
  await writeBoolean(RESULT_ACTIONS_UNLOCKED_KEY, true);
}
