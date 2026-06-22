export type AssetCategory = 'real_estate' | 'government_bonds' | 'equities' | 'cash';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  ticker?: string; // ticker/symbol
}

export interface Liability {
  id: string;
  name: string;
  category: string;
  currentValue: number;
}
