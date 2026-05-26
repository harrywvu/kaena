import axios from "axios";
import { HUGGINGFACE_API_KEY } from "@env";
import { Preferences, RankedRestaurant } from "../types";

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

type HfTextResponse = Array<{ generated_text?: string }>;

function buildPrompt(preferences: Preferences, candidates: RankedRestaurant[], recentRecommendations: string[]) {
  const lines = candidates.map((candidate, index) => {
    if (candidate.distanceFromUser == null) {
      console.warn("[hf] candidate missing distance:", candidate.name);
    }
    const distance = candidate.distanceFromUser?.toFixed(2) ?? "unknown";
    const price = candidate.priceLevel ?? "unknown";
    const busyNote =
      (candidate.userRatingsTotal ?? 0) > 100 ? " | popular spot, may have a wait." : "";
    return `${index + 1}. ${candidate.name} | rating ${candidate.rating.toFixed(1)} | distance ${distance} km | price ${price}${busyNote}`;
  });

  return [
    "You are selecting the best restaurant.",
    "",
    "User preferences:",
    `- group size: ${preferences.groupSize}`,
    `- vibe: ${preferences.vibe}`,
    `- budget: ${preferences.budgetConcern}`,
    "",
    ...(recentRecommendations.length > 0
      ? [
          "For variety:",
          "You must NOT always recommend the same places.",
          "Deliberately vary your picks across different sessions.",
          `The following places were recently recommended — do NOT suggest them again: ${recentRecommendations.join(", ")}.`,
          "",
        ]
      : []),
    "For busyness awareness:",
    'If a place has more than 100 user ratings, treat it as potentially busy and factor in the note "popular spot, may have a wait."',
    "",
    "For candidate ordering:",
    "The candidates are presented in random order.",
    "Do not assume the first result is the best — evaluate all of them equally.",
    "",
    "Candidates:",
    ...lines,
    "",
    "Return ONLY the index number of the best option.",
  ].join("\n");
}

function parseIndex(rawText: string, max: number): number | null {
  const match = rawText.trim().match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    return null;
  }
  return value - 1;
}

export async function chooseBestRestaurantWithHf(
  preferences: Preferences,
  candidates: RankedRestaurant[],
  recentRecommendations: string[]
): Promise<number | null> {
  if (!HUGGINGFACE_API_KEY || candidates.length === 0) {
    return null;
  }

  const shuffledCandidates = [...candidates]
    .map((candidate, index) => ({
      candidate,
      originalIndex: index,
      sortKey: Math.random(),
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
  const prompt = buildPrompt(
    preferences,
    shuffledCandidates.map((item) => item.candidate),
    recentRecommendations
  );

  try {
    const response = await axios.post<HfTextResponse>(
      HF_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 8,
          temperature: 0.1,
          return_full_text: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    const raw = response.data?.[0]?.generated_text ?? "";
    const shuffledIndex = parseIndex(raw, shuffledCandidates.length);
    if (shuffledIndex == null) {
      return null;
    }
    return shuffledCandidates[shuffledIndex]?.originalIndex ?? null;
  } catch {
    return null;
  }
}
