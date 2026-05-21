import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import {
  BudgetConcern,
  GroupSize,
  LoadingFailure,
  Preferences,
  RankedRestaurant,
  Vibe,
} from "../types";
import { buildRecommendation, mapRecommendationError } from "../utils/recommendation";

export type FlowState = "permission" | "questionnaire" | "loading" | "result";
export type QuestionStep = 0 | 1 | 2;

export function useKaenaFlow() {
  const [flowState, setFlowState] = useState<FlowState>("permission");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [groupSize, setGroupSize] = useState<GroupSize | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [budgetConcern, setBudgetConcern] = useState<BudgetConcern | null>(null);
  const [questionStep, setQuestionStep] = useState<QuestionStep>(0);
  const [result, setResult] = useState<RankedRestaurant | null>(null);
  const [llmUsed, setLlmUsed] = useState(false);
  const [failure, setFailure] = useState<LoadingFailure | null>(null);

  useEffect(() => {
    void requestPermission();
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

  async function requestPermission() {
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
    setFlowState("questionnaire");
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
      const recommendation = await buildRecommendation(locationCoords.lat, locationCoords.lng, preferences);
      setResult(recommendation.result);
      setLlmUsed(recommendation.llmUsed);
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
  }

  return {
    flowState,
    permissionGranted,
    locationCoords,
    preferences,
    questionStep,
    result,
    llmUsed,
    failure,
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
      handleRecommend,
      resetQuestionnaire,
    },
  };
}
