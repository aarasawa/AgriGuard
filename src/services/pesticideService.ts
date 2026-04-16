import type { PesticideFeatureCollection, SearchParams, SearchResult } from '../types/pesticide';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const pesticideService = {
  async getRecords(params: {
    lat: number;
    lon: number;
    radius_km: number;
  }): Promise<PesticideFeatureCollection> {
    const url = new URL(`${API_BASE_URL}/records`);
    url.searchParams.set('lat', String(params.lat));
    url.searchParams.set('lon', String(params.lon));
    url.searchParams.set('radius_km', String(params.radius_km));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async getChemicals(county_cd?: number): Promise<number[]> {
    const url = new URL(`${API_BASE_URL}/chemicals`);
    if (county_cd !== undefined) {
      url.searchParams.set('county_cd', String(county_cd));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.chemicals;
  },

  async search(params: SearchParams): Promise<{ results: SearchResult[]; count: number }> {
    const url = new URL(`${API_BASE_URL}/search`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },
};