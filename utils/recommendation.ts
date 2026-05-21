import { chooseBestRestaurantWithHf } from "../services/hfService";
import { fetchNearbyRestaurants } from "../services/placesService";
import { LoadingFailure, Preferences, RankedRestaurant } from "../types";
import { preRankRestaurants } from "./ranking";

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

  const llmIndex = await chooseBestRestaurantWithHf(preferences, candidates);
  if (llmIndex == null) {
    return {
      result: candidates[0],
      candidates,
      llmUsed: false,
    };
  }

  return {
    result: candidates[llmIndex],
    candidates,
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
