export interface PesticideFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    comtrs: string;
    applic_dt: string;
    lbs_prd_used: number;
    site_code: number;
    county_cd: number;
    prodno: number;
    distance_km: number;
    product_name?: string;
    chemname?: string;
    cas_number?: string;
  };
}

export interface PesticideFeatureCollection {
  type: 'FeatureCollection';
  features: PesticideFeature[];
  meta?: {
    center: { lat: number; lon: number };
    radius_km: number;
    count: number;
    limit?: number;
  };
}

export interface SearchResult {
  comtrs: string;
  applic_dt: string;
  lbs_prd_used: number;
  site_code: number;
  county_cd: number;
  prodno: number;
  product_name?: string;
  chemname?: string;
  cas_number?: string;
  year?: number;
  cen_lat83?: number;
  cen_long83?: number;
}

export interface SearchParams {
  county_cd?: number;
  prodno?: number;
  product_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}