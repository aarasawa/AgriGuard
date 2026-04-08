const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PesticideFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    comtrs: string;
    applic_dt: string;
    lbs_prd_used: number;
    site_code: number;
    county_cd: number;
    prodno: number;
  };
}

export interface PesticideFeatureCollection {
  type: 'FeatureCollection';
  features: PesticideFeature[];
}

export const pesticideService = {
  async getRecords(params: {
    county_cd?: number;
    year?: number;
    min_lat?: number;
    max_lat?: number;
    min_lon?: number;
    max_lon?: number;
    limit?: number;
  }): Promise<PesticideFeatureCollection> {
    const url = new URL(`${API_BASE_URL}/records`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  },

  async getChemicals(county_cd?: number): Promise<number[]> {
    const url = new URL(`${API_BASE_URL}/chemicals`);
    if (county_cd !== undefined) {
      url.searchParams.set('county_cd', String(county_cd));
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.chemicals;
  }
};