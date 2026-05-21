export type Restaurant = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  priceLevel?: number;
  photos?: string[];
  userRatingsTotal?: number;
  distanceFromUser?: number;
  raw?: unknown;
};

export type GroupSize = "solo" | "pair" | "group";
export type Vibe = "speed" | "comfort" | "fun" | "luxury";
export type BudgetConcern = "yes" | "no";

export type Preferences = {
  groupSize: GroupSize;
  vibe: Vibe;
  budgetConcern: BudgetConcern;
};

export type RankedRestaurant = Restaurant & {
  deterministicScore: number;
  explanation: string;
};

export type LoadingFailure = "no-results" | "places-error" | "ranking-error";
