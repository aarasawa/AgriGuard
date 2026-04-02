export interface PesticideApplication {
  id: string;
  applicationDate: any; // Firestore Timestamp
  pesticideName: string;
  cropName: string;
  amountApplied: number;
  unit: string;
  latitude: number;
  longitude: number;
  county: string;
  siteCode: string;
  applicatorName?: string;
}

export interface SearchFilters {
  pesticideName?: string;
  cropName?: string;
  county?: string;
  startDate?: Date;
  endDate?: Date;
}
