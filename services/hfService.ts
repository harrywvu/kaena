import axios from "axios";
import { HUGGINGFACE_API_KEY } from "@env";
import { Preferences, RankedRestaurant } from "../types";

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

type HfTextResponse = Array<{ generated_text?: string }>;

function buildPrompt(preferences: Preferences, candidates: RankedRestaurant[]) {
  const lines = candidates.map((candidate, index) => {
    if (candidate.distanceFromUser == null) {
      console.warn("[hf] candidate missing distance:", candidate.name);
    }
    const distance = candidate.distanceFromUser?.toFixed(2) ?? "unknown";
    const price = candidate.priceLevel ?? "unknown";
    return `${index + 1}. ${candidate.name} | rating ${candidate.rating.toFixed(1)} | distance ${distance} km | price ${price}`;
  });

  return [
    "You are selecting the best restaurant.",
    "",
    "User preferences:",
    `- group size: ${preferences.groupSize}`,
    `- vibe: ${preferences.vibe}`,
    `- budget: ${preferences.budgetConcern}`,
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
  candidates: RankedRestaurant[]
): Promise<number | null> {
  if (!HUGGINGFACE_API_KEY || candidates.length === 0) {
    return null;
  }

  const prompt = buildPrompt(preferences, candidates);

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
    return parseIndex(raw, candidates.length);
  } catch {
    return null;
  }
}
