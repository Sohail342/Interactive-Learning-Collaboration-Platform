import { apiRequest } from "./client";
import type { City, School } from "./types";

export function listCities(): Promise<City[]> {
  return apiRequest<City[]>("/cities");
}

export function listSchools(cityId?: string): Promise<School[]> {
  const query = cityId ? `?city_id=${encodeURIComponent(cityId)}` : "";
  return apiRequest<School[]>(`/schools${query}`);
}
