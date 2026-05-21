import { Preferences, RankedRestaurant, Restaurant } from "../types";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function normalizeDistance(distanceKm = 10) {
  return clamp(1 - distanceKm / 5, 0, 1);
}

function normalizeRating(rating = 0) {
  return clamp(rating / 5, 0, 1);
}

function normalizePopularity(total = 0) {
  return clamp(total / 2000, 0, 1);
}

function budgetAlignment(priceLevel: number | undefined, budgetConcern: Preferences["budgetConcern"]) {
  if (priceLevel == null) {
    return 0.5;
  }
  if (budgetConcern === "yes") {
    return clamp(1 - priceLevel / 4, 0, 1);
  }
  return clamp(priceLevel / 4, 0, 1);
}

function vibeWeight(candidate: Restaurant, preferences: Preferences) {
  const distance = normalizeDistance(candidate.distanceFromUser);
  const rating = normalizeRating(candidate.rating);
  const popularity = normalizePopularity(candidate.userRatingsTotal);
  const budget = budgetAlignment(candidate.priceLevel, preferences.budgetConcern);
  const price = candidate.priceLevel ?? 2;

  switch (preferences.vibe) {
    case "speed":
      return distance * 0.45 + budget * 0.35 + (price <= 2 ? 0.2 : 0);
    case "comfort":
      return rating * 0.45 + distance * 0.2 + (price >= 2 && price <= 3 ? 0.2 : 0.05) + budget * 0.15;
    case "fun":
      return popularity * 0.45 + rating * 0.3 + distance * 0.15 + 0.1;
    case "luxury":
      return rating * 0.4 + (price >= 3 ? 0.35 : 0.1) + popularity * 0.15 + distance * 0.1;
    default:
      return 0;
  }
}

function groupWeight(candidate: Restaurant, preferences: Preferences) {
  const popularity = normalizePopularity(candidate.userRatingsTotal);
  const price = candidate.priceLevel ?? 2;

  switch (preferences.groupSize) {
    case "solo":
      return 0.12 + (price <= 2 ? 0.08 : 0);
    case "pair":
      return 0.12 + (candidate.rating >= 4.2 ? 0.08 : 0);
    case "group":
      return popularity * 0.18 + (price <= 3 ? 0.06 : 0);
    default:
      return 0;
  }
}

export function generateExplanation(candidate: Restaurant, preferences: Preferences) {
  const reasons: string[] = [];
  if ((candidate.rating ?? 0) >= 4.4) reasons.push("high rating");
  if ((candidate.distanceFromUser ?? Infinity) <= 1.2) reasons.push("short distance");
  if (preferences.budgetConcern === "yes" && (candidate.priceLevel ?? 2) <= 2) reasons.push("budget-friendly fit");
  if (preferences.vibe === "comfort") reasons.push("match with a relaxed comfort vibe");
  if (preferences.vibe === "speed") reasons.push("fast and convenient feel");
  if (preferences.vibe === "fun") reasons.push("strong crowd energy");
  if (preferences.vibe === "luxury") reasons.push("upscale luxury lean");

  const finalReasons = reasons.slice(0, 3);
  if (finalReasons.length === 0) {
    return "Selected as the strongest overall match for tonight.";
  }
  return `Selected due to ${finalReasons.join(", ")}.`;
}

export function preRankRestaurants(restaurants: Restaurant[], preferences: Preferences): RankedRestaurant[] {
  return restaurants
    .map((candidate) => {
      const distance = normalizeDistance(candidate.distanceFromUser);
      const rating = normalizeRating(candidate.rating);
      const budget = budgetAlignment(candidate.priceLevel, preferences.budgetConcern);
      const score =
        distance * 0.28 + rating * 0.32 + budget * 0.18 + vibeWeight(candidate, preferences) * 0.16 + groupWeight(candidate, preferences) * 0.06;

      return {
        ...candidate,
        deterministicScore: Number(score.toFixed(4)),
        explanation: generateExplanation(candidate, preferences),
      } satisfies RankedRestaurant;
    })
    .sort((a, b) => b.deterministicScore - a.deterministicScore)
    .slice(0, 12);
}
