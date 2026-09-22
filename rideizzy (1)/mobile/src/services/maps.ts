import { api } from "./api";

export interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
}

export async function searchPlaces(input: string): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 2) return [];
  const { data } = await api.get("/maps/autocomplete", { params: { input } });
  return data;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const { data } = await api.get(`/maps/place-details/${placeId}`);
  return data;
}