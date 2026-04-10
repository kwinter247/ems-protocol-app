import { ExampleChip } from '../types/scenario';

export const exampleChips: ExampleChip[] = [
  {
    id: 'stemi',
    label: 'Chest Pain / STEMI',
    presentation:
      '58-year-old male with crushing substernal chest pain 9/10 radiating to left arm, diaphoresis, nausea. 12-lead showing ST elevation in leads II, III, aVF. History of HTN and hypercholesterolemia. BP 140/90, HR 82, SpO2 96%.',
  },
  {
    id: 'cardiac-arrest',
    label: 'Cardiac Arrest',
    presentation:
      '65-year-old male found unresponsive by wife. CPR initiated by bystander. Patient is pulseless and apneic. Initial rhythm on monitor shows ventricular fibrillation. Down time unknown, possibly 5-8 minutes.',
  },
  {
    id: 'stroke',
    label: 'Stroke',
    presentation:
      '72-year-old female with sudden onset right-sided facial droop, right arm weakness, and slurred speech. Last known well approximately 45 minutes ago per husband. BP 190/110, HR 88, SpO2 97%, BGL 124.',
  },
  {
    id: 'seizure',
    label: 'Active Seizure',
    presentation:
      '24-year-old male with known seizure disorder currently in active tonic-clonic seizure. Wife states seizure has been ongoing for approximately 4 minutes. No prior history of status epilepticus. Temp 100.8°F. SpO2 88% during seizure activity.',
  },
  {
    id: 'anaphylaxis',
    label: 'Anaphylaxis',
    presentation:
      '31-year-old female stung by bee 10 minutes ago. Rapidly developing urticaria, facial angioedema, stridor, and wheezing. States throat feels like it is closing. BP 84/50, HR 124, SpO2 92%. History of bee allergy but no EpiPen available.',
  },
  {
    id: 'opioid-od',
    label: 'Opioid OD',
    presentation:
      '28-year-old male found unconscious in bathroom. Pinpoint pupils, cyanotic lips, respiratory rate 4/min, SpO2 74%. Drug paraphernalia found nearby. Agonal respirations noted. GCS 3. Track marks on arms.',
  },
  {
    id: 'hemorrhagic-shock',
    label: 'Hemorrhagic Shock',
    presentation:
      '19-year-old male with multiple stab wounds to abdomen and left chest. GCS 12, BP 70/40, HR 138, RR 28, SpO2 91%. Active bleeding from abdominal wound controlled with direct pressure. Pale, diaphoretic, altered mental status.',
  },
  {
    id: 'peds-resp',
    label: 'Peds Resp Distress',
    presentation:
      '4-year-old female (16 kg) with 2-day history of URI now with severe respiratory distress. Subcostal and intercostal retractions, nasal flaring, tripod positioning, diffuse expiratory wheezing. SpO2 84% on RA, HR 148, RR 44. History of reactive airway disease.',
  },
];
