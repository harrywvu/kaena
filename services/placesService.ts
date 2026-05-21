import axios from "axios";
import { GOOGLE_PLACES_API_KEY } from "@env";
import { Restaurant } from "../types";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo";
const MAX_RESULTS = 20;

type PlaceSearchResponse = {
  status?: string;
  error_message?: string;
  results: Array<{
    place_id: string;
    name: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    rating?: number;
    price_level?: number;
    user_ratings_total?: number;
    photos?: Array<{ photo_reference: string }>;
    types?: string[];
    business_status?: string;
  }>;
  next_page_token?: string;
};

type GeocodeResponse = {
  status?: string;
  error_message?: string;
  results: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
};

const toPhotoUrl = (photoReference: string) =>
  `${PHOTO_URL}?maxwidth=800&photo_reference=${encodeURIComponent(photoReference)}&key=${encodeURIComponent(
    GOOGLE_PLACES_API_KEY
  )}`;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function getAddressPart(
  components: GeocodeResponse["results"][number]["address_components"] | undefined,
  type: string
) {
  return components?.find((component) => component.types.includes(type))?.long_name;
}

async function reverseGeocode(lat: number, lng: number) {
  const response = await axios.get<GeocodeResponse>(GEOCODE_URL, {
    params: {
      key: GOOGLE_PLACES_API_KEY,
      latlng: `${lat},${lng}`,
    },
  });

  console.log("[places] reverse geocode response", {
    status: response.data.status,
    errorMessage: response.data.error_message,
    resultCount: response.data.results?.length ?? 0,
    formattedAddress: response.data.results?.[0]?.formatted_address,
  });

  if (response.data.status && response.data.status !== "OK") {
    const error = new Error(response.data.error_message || `Google Geocoding error: ${response.data.status}`);
    error.name = "places-error";
    throw error;
  }

  const components = response.data.results?.[0]?.address_components;
  const municipality =
    getAddressPart(components, "locality") ??
    getAddressPart(components, "postal_town") ??
    getAddressPart(components, "administrative_area_level_3") ??
    getAddressPart(components, "administrative_area_level_2");
  const province =
    getAddressPart(components, "administrative_area_level_1") ??
    getAddressPart(components, "administrative_area_level_2");

  if (!municipality && !province) {
    const error = new Error("Could not determine municipality from coordinates");
    error.name = "places-error";
    throw error;
  }

  return {
    municipality,
    province,
  };
}

async function runTextSearch(query: string, lat: number, lng: number) {
  const params = {
    key: GOOGLE_PLACES_API_KEY,
    query,
    location: `${lat},${lng}`,
  };

  console.log("[places] text search params", {
    query: params.query,
    location: params.location,
  });

  const response = await axios.get<PlaceSearchResponse>(TEXT_SEARCH_URL, {
    params,
  });

  console.log("[places] text search raw response", {
    query,
    status: response.data.status,
    errorMessage: response.data.error_message,
    resultCount: response.data.results?.length ?? 0,
    sampleTypes: (response.data.results ?? []).slice(0, 5).map((item) => ({
      name: item.name,
      types: item.types,
      businessStatus: item.business_status,
    })),
  });

  if (response.data.status && response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
    const error = new Error(response.data.error_message || `Google Places error: ${response.data.status}`);
    error.name = "places-error";
    throw error;
  }

  const rawResults = response.data.results ?? [];
  const afterBusinessStatus = rawResults.filter((item) => item.business_status !== "CLOSED_TEMPORARILY");
  const finalCandidates = afterBusinessStatus
    .map((item) => {
      const candidateLat = item.geometry?.location?.lat;
      const candidateLng = item.geometry?.location?.lng;

      if (candidateLat == null || candidateLng == null) {
        return null;
      }

      return {
        id: item.place_id,
        name: item.name,
        lat: candidateLat,
        lng: candidateLng,
        rating: item.rating ?? 0,
        priceLevel: item.price_level,
        photos: item.photos?.map((photo) => toPhotoUrl(photo.photo_reference)),
        userRatingsTotal: item.user_ratings_total,
        distanceFromUser: haversineKm(lat, lng, candidateLat, candidateLng),
        raw: item,
      } satisfies Restaurant;
    })
    .filter((item): item is Restaurant => Boolean(item))
    .sort((a, b) => (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity))
    .slice(0, MAX_RESULTS);

  console.log(
    "[places] candidate distances",
    finalCandidates.map((candidate) => ({
      name: candidate.name,
      distanceKm: candidate.distanceFromUser,
    }))
  );

  console.log("[places] filter counts", {
    query,
    rawResults: rawResults.length,
    afterBusinessStatus: afterBusinessStatus.length,
    finalCandidates: finalCandidates.length,
  });

  return finalCandidates;
}

export async function fetchNearbyRestaurants(lat: number, lng: number): Promise<Restaurant[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const area = await reverseGeocode(lat, lng);
  const municipalityQuery = `restaurant in ${[area.municipality, area.province].filter(Boolean).join(", ")}`;
  console.log("[places] resolved search area", {
    municipality: area.municipality,
    province: area.province,
  });

  const municipalResults = await runTextSearch(municipalityQuery, lat, lng);
  if (municipalResults.length > 0) {
    return municipalResults;
  }

  if (area.province) {
    const provinceQuery = `restaurant in ${area.province}`;
    console.log("[places] municipality search empty, retrying broader area", {
      municipality: area.municipality,
      province: area.province,
    });
    const provinceResults = await runTextSearch(provinceQuery, lat, lng);
    if (provinceResults.length > 0) {
      return provinceResults;
    }
  }

  const error = new Error(
    `No restaurants found in ${area.municipality ?? area.province}. Try a nearby town?`
  );
  error.name = "no-results";
  throw error;
}
