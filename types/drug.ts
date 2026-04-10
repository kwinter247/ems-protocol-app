export type Scope = 'EMT' | 'Paramedic' | 'Both';

export interface Drug {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  class: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  adultDose: string;
  pedsDose?: string;
  routes: string[];
  onset: string;
  duration: string;
  notes: string;
  scope: Scope;
}

export interface WeightDrug {
  id: string;
  name: string;
  indication: string;
  dosePerKg: number;
  unit: string;
  maxDose: number;
  maxDoseUnit?: string;
  route: string;
  concentration?: string;
  notes?: string;
  scope: Scope;
  pediatricOnly?: boolean;
  pediatricMaxDose?: number;
  pediatricMaxDoseUnit?: string;
  pediatricNote?: string;
}
