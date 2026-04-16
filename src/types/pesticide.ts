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
  product_name: string | null;
  year: number;
  cen_lat83: number;
  cen_long83: number;
  cas_number: string | null;
  chemname: string | null;
}

export interface SearchParams {
  county_cd?: number;
  prodno?: number;
  product_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}
export interface ChemInfo {
  cid: number;
  pubchem_url: string;
  signal_word: string | null;
  pictograms: string[];
  hazard_statements: string[];
  symptoms: string | null;
  exposure_routes: string | null;
  target_organs: string | null;
  short_term_effects: string | null;
  long_term_effects: string | null;
  first_aid: Record<string, string>;
}