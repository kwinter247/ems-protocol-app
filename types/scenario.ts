import { Scope } from './drug';

export interface TreatmentStep {
  step: number;
  action: string;
  scope: Scope;
}

export interface DrugRecommendation {
  name: string;
  indication: string;
  adultDose: string;
  pedsDose?: string;
  route: string;
  notes?: string;
}

export interface ScenarioResponse {
  protocols: string[];
  redFlags: string[];
  assessmentQuestions: string[];
  treatmentSteps: TreatmentStep[];
  drugs: DrugRecommendation[];
  pedsConsiderations: string[];
  timeAlerts: string[];
}

export interface ScenarioRequest {
  presentation: string;
  age?: string;
  weight?: string;
}

export interface ExampleChip {
  id: string;
  label: string;
  presentation: string;
}
