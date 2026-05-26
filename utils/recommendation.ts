import { chooseBestRestaurantWithHf } from "../services/hfService";
import { fetchNearbyRestaurants } from "../services/placesService";
import { LoadingFailure, Preferences, RankedRestaurant } from "../types";
import { getRecentPicks } from "./recentPicks";
import { preRankRestaurants } from "./ranking";

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export async function buildRecommendation(
  lat: number,
  lng: number,
  preferences: Preferences
): Promise<{ result: RankedRestaurant; candidates: RankedRestaurant[]; llmUsed: boolean }> {
  const restaurants = await fetchNearbyRestaurants(lat, lng);
  if (restaurants.length === 0) {
    const error = new Error("No nearby restaurants found");
    error.name = "no-results";
    throw error;
  }

  const candidates = preRankRestaurants(restaurants, preferences);
  if (candidates.length === 0) {
    const error = new Error("No ranked candidates found");
    error.name = "ranking-error";
    throw error;
  }

  const recentPicks = await getRecentPicks();
  const filteredCandidates = candidates.filter(
    (candidate) => !recentPicks.some((recentPick) => normalizeName(recentPick) === normalizeName(candidate.name))
  );
  const selectableCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidates;

  const llmIndex = await chooseBestRestaurantWithHf(preferences, selectableCandidates, recentPicks);
  if (llmIndex == null) {
    return {
      result: selectableCandidates[0],
      candidates: selectableCandidates,
      llmUsed: false,
    };
  }

  return {
    result: selectableCandidates[llmIndex],
    candidates: selectableCandidates,
    llmUsed: true,
  };
}

export function mapRecommendationError(error: unknown): LoadingFailure {
  if (error instanceof Error && error.name === "no-results") {
    return "no-results";
  }

  if (error instanceof Error && error.name === "ranking-error") {
    return "ranking-error";
  }

  return "places-error";
}
