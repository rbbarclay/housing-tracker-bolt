export type CriterionType = 'must-have' | 'nice-to-have';

export interface Criterion {
  id: string;
  name: string;
  type: CriterionType;
  definition?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  date_viewed?: string;
  listing_url?: string;
  notes?: string;
  archived: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  property_id: string;
  criterion_id: string;
  score: 1 | 2 | 3;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithRatings extends Property {
  ratings: Rating[];
}

export interface PropertyScore {
  property: Property;
  mustHaveScore: number;
  niceToHaveScore: number;
  totalScore: number;
  meetsAllMustHaves: boolean;
  ratings: Rating[];
}

export interface RatingFormData {
  criterion_id: string;
  score: 1 | 2 | 3;
  notes?: string;
}
