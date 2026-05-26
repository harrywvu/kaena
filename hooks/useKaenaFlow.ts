import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { resolveUserArea } from "../services/placesService";
import {
  BudgetConcern,
  GroupSize,
  LoadingFailure,
  Preferences,
  RankedRestaurant,
  Vibe,
} from "../types";
import { getFlowFlags, markFirstRecommendationComplete, markResultActionsUnlocked } from "../utils/appFlowState";
import { getLastRecommendation, saveLastRecommendation } from "../utils/lastRecommendation";
import { saveRecentPick } from "../utils/recentPicks";
import { buildRecommendation, mapRecommendationError } from "../utils/recommendation";

export type FlowState = "booting" | "permission" | "home" | "questionnaire" | "loading" | "result";
export type QuestionStep = 0 | 1 | 2;

export function useKaenaFlow() {
  const [flowState, setFlowState] = useState<FlowState>("booting");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [groupSize, setGroupSize] = useState<GroupSize | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [budgetConcern, setBudgetConcern] = useState<BudgetConcern | null>(null);
  const [questionStep, setQuestionStep] = useState<QuestionStep>(0);
  const [result, setResult] = useState<RankedRestaurant | null>(null);
  const [llmUsed, setLlmUsed] = useState(false);
  const [failure, setFailure] = useState<LoadingFailure | null>(null);
  const [hasCompletedFirstRecommendation, setHasCompletedFirstRecommendation] = useState(false);
  const [hasUnlockedResultActions, setHasUnlockedResultActions] = useState(false);
  const [showBackToHomeOnly, setShowBackToHomeOnly] = useState(false);
  const [startedFromHome, setStartedFromHome] = useState(false);
  const [lastRecommendation, setLastRecommendation] = useState<{ name: string; photo?: string } | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  const preferences = useMemo<Preferences | null>(() => {
    if (!groupSize || !vibe || !budgetConcern) {
      return null;
    }

    return {
      groupSize,
      vibe,
      budgetConcern,
    };
  }, [budgetConcern, groupSize, vibe]);

  async function bootstrap() {
    const flags = await getFlowFlags();
    const savedLastRecommendation = await getLastRecommendation();
    setHasCompletedFirstRecommendation(flags.hasCompletedFirstRecommendation);
    setHasUnlockedResultActions(flags.hasUnlockedResultActions);
    setLastRecommendation(savedLastRecommendation);

    await requestPermission(flags.hasCompletedFirstRecommendation);
  }

  async function requestPermission(hasCompletedFirstRecommendationOverride = hasCompletedFirstRecommendation) {
    const permission = await Location.requestForegroundPermissionsAsync();
    const granted = permission.status === "granted";
    setPermissionGranted(granted);

    if (!granted) {
      setFlowState("permission");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    console.log("[location] current position", {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      accuracy: currentLocation.coords.accuracy,
      timestamp: currentLocation.timestamp,
    });
    setLocationCoords({
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
    });
    setLocationLabel(await resolveLocationLabel(currentLocation.coords.latitude, currentLocation.coords.longitude));
    setFlowState(hasCompletedFirstRecommendationOverride ? "home" : "questionnaire");
  }

  async function resolveLocationLabel(lat: number, lng: number) {
    try {
      const area = await resolveUserArea(lat, lng);
      if (area.municipality && area.province) {
        return `${area.municipality}, ${area.province}`;
      }
      return area.municipality ?? area.province ?? "Current area";
    } catch {
      try {
        const fallback = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        const first = fallback[0];
        const city = first?.city ?? first?.subregion ?? first?.district ?? first?.name;
        const province = first?.region ?? first?.subregion;

        if (city && province) {
          return `${city}, ${province}`;
        }
        return city ?? province ?? "Current area";
      } catch {
        return "Current area";
      }
    }
  }

  function selectGroupSize(value: GroupSize) {
    setGroupSize(value);
    setQuestionStep(1);
  }

  function selectVibe(value: Vibe) {
    setVibe(value);
    setQuestionStep(2);
  }

  function selectBudgetConcern(value: BudgetConcern) {
    setBudgetConcern(value);
  }

  function goBackQuestion() {
    setQuestionStep((current) => Math.max(0, current - 1) as QuestionStep);
  }

  async function handleRecommend() {
    await runRecommendation();
  }

  async function redecideCurrent() {
    await runRecommendation();
  }

  async function runRecommendation() {
    if (!locationCoords || !preferences) {
      return;
    }

    console.log("[recommendation] starting fetch", {
      latitude: locationCoords.lat,
      longitude: locationCoords.lng,
      preferences,
    });

    setFlowState("loading");
    setFailure(null);

    try {
      const isFirstCompletedRecommendation = !hasCompletedFirstRecommendation;
      const recommendation = await buildRecommendation(locationCoords.lat, locationCoords.lng, preferences);
      setResult(recommendation.result);
      setLlmUsed(recommendation.llmUsed);
      await saveRecentPick(recommendation.result.name);
      const savedRecommendation = {
        name: recommendation.result.name,
        photo: recommendation.result.photos?.[0],
      };
      await saveLastRecommendation(savedRecommendation);
      setLastRecommendation(savedRecommendation);

      if (isFirstCompletedRecommendation) {
        await markFirstRecommendationComplete();
        setHasCompletedFirstRecommendation(true);
        setShowBackToHomeOnly(true);
      } else if (startedFromHome && !hasUnlockedResultActions) {
        await markResultActionsUnlocked();
        setHasUnlockedResultActions(true);
        setShowBackToHomeOnly(false);
      } else {
        setShowBackToHomeOnly(false);
      }

      setStartedFromHome(false);
      setFlowState("result");
    } catch (error) {
      setFailure(mapRecommendationError(error));
      setFlowState("loading");
    }
  }

  function resetQuestionnaire() {
    setGroupSize(null);
    setVibe(null);
    setBudgetConcern(null);
    setQuestionStep(0);
    setFlowState("questionnaire");
    setResult(null);
    setLlmUsed(false);
    setFailure(null);
    setShowBackToHomeOnly(false);
  }

  function startFromHome() {
    setStartedFromHome(true);
    setGroupSize(null);
    setVibe(null);
    setBudgetConcern(null);
    setQuestionStep(0);
    setResult(null);
    setLlmUsed(false);
    setFailure(null);
    setShowBackToHomeOnly(false);
    setFlowState("questionnaire");
  }

  function goHome() {
    setResult(null);
    setFailure(null);
    setShowBackToHomeOnly(false);
    setFlowState("home");
  }

  function pickAgain() {
    setStartedFromHome(false);
    resetQuestionnaire();
  }

  return {
    flowState,
    permissionGranted,
    locationCoords,
    locationLabel,
    lastRecommendation,
    preferences,
    questionStep,
    result,
    llmUsed,
    failure,
    hasUnlockedResultActions,
    showBackToHomeOnly,
    answers: {
      groupSize,
      vibe,
      budgetConcern,
    },
    actions: {
      requestPermission,
      selectGroupSize,
      selectVibe,
      selectBudgetConcern,
      goBackQuestion,
      startFromHome,
      goHome,
      pickAgain,
      redecideCurrent,
      handleRecommend,
      resetQuestionnaire,
    },
  };
}
