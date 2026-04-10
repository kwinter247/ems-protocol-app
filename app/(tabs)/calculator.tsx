import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Calculator, ChevronDown, ChevronUp, TriangleAlert as AlertTriangle, Baby } from 'lucide-react-native';
import { weightDrugs } from '@/constants/weightDrugs';
import { WeightDrug } from '@/types/drug';
import { colors } from '@/constants/colors';

const PEDIATRIC_WEIGHT_KG = 40;
const PEDIATRIC_AGE_YEARS = 15;

const PEDS_BLUE = '#2563eb';
const PEDS_BLUE_LIGHT = 'rgba(37, 99, 235, 0.15)';
const PEDS_BLUE_BORDER = 'rgba(37, 99, 235, 0.35)';

const scopeConfig = {
  EMT: { color: colors.successText, bg: colors.successLight },
  Paramedic: { color: colors.infoText, bg: colors.infoLight },
  Both: { color: colors.textSecondary, bg: 'rgba(139,148,158,0.12)' },
};

export default function CalculatorScreen() {
  const [weight, setWeight] = useState('');
  const [useLbs, setUseLbs] = useState(false);
  const [age, setAge] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const weightKg = useMemo(() => {
    const raw = parseFloat(weight);
    if (isNaN(raw) || raw <= 0) return null;
    return useLbs ? raw * 0.453592 : raw;
  }, [weight, useLbs]);

  const ageYears = useMemo(() => {
    const raw = parseFloat(age);
    if (isNaN(raw) || raw < 0) return null;
    return raw;
  }, [age]);

  const isPediatric = useMemo(() => {
    if (weightKg !== null && weightKg < PEDIATRIC_WEIGHT_KG) return true;
    if (ageYears !== null && ageYears < PEDIATRIC_AGE_YEARS) return true;
    return false;
  }, [weightKg, ageYears]);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Calculator size={20} color={colors.accent} />
            <Text style={styles.title}>Dose Calculator</Text>
          </View>
          <Text style={styles.subtitle}>Weight-based drug dosing</Text>
        </View>

        <View style={styles.weightCard}>
          <View style={styles.weightLabelRow}>
            <Text style={styles.fieldLabel}>Patient Weight</Text>
            <View style={styles.unitToggle}>
              <Text style={[styles.unitLabel, !useLbs && styles.unitActive]}>kg</Text>
              <Switch
                value={useLbs}
                onValueChange={setUseLbs}
                thumbColor={colors.text}
                trackColor={{ false: colors.border, true: colors.accent }}
              />
              <Text style={[styles.unitLabel, useLbs && styles.unitActive]}>lbs</Text>
            </View>
          </View>
          <TextInput
            style={styles.weightInput}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          <View style={styles.ageRow}>
            <Text style={styles.fieldLabel}>Age (years)</Text>
            <Text style={styles.ageOptional}>optional</Text>
          </View>
          <TextInput
            style={styles.ageInput}
            value={age}
            onChangeText={setAge}
            placeholder="e.g. 8"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          {weightKg !== null && (
            <View style={styles.weightResult}>
              <Text style={styles.weightResultText}>
                {weightKg.toFixed(1)} kg
              </Text>
              {useLbs && (
                <Text style={styles.weightResultSub}>
                  ({parseFloat(weight).toFixed(1)} lbs)
                </Text>
              )}
            </View>
          )}

          {!weightKg && (
            <Text style={styles.weightHint}>
              Enter patient weight to calculate doses
            </Text>
          )}
        </View>

        {weightKg !== null && weightKg > 0 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Calculated Doses</Text>
              {isPediatric && (
                <View style={styles.pediatricBadge}>
                  <Baby size={12} color={PEDS_BLUE} />
                  <Text style={styles.pediatricBadgeText}>PEDIATRIC</Text>
                </View>
              )}
            </View>
            {isPediatric && (
              <Text style={styles.pediatricSubtext}>
                Blue dose ceilings apply — pediatric max doses per CAZRB
              </Text>
            )}
            {weightDrugs.map((drug) => (
              <DrugDoseCard
                key={drug.id}
                drug={drug}
                weightKg={weightKg}
                isPediatric={isPediatric}
                expanded={expandedId === drug.id}
                onToggle={() => toggle(drug.id)}
              />
            ))}
          </View>
        )}

        {!weightKg && (
          <View style={styles.placeholder}>
            <Calculator size={40} color={colors.border} />
            <Text style={styles.placeholderTitle}>Enter Patient Weight</Text>
            <Text style={styles.placeholderText}>
              Input weight above to see weight-based drug doses for{' '}
              {weightDrugs.length} common EMS medications
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface DrugDoseCardProps {
  drug: WeightDrug;
  weightKg: number;
  isPediatric: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function DrugDoseCard({ drug, weightKg, isPediatric, expanded, onToggle }: DrugDoseCardProps) {
  const effectiveMaxDose = isPediatric && drug.pediatricMaxDose !== undefined
    ? drug.pediatricMaxDose
    : drug.maxDose;

  const rawDose = drug.dosePerKg > 0 ? drug.dosePerKg * weightKg : drug.maxDose;
  const clampedDose = Math.min(rawDose, effectiveMaxDose);
  const isMaxed = drug.dosePerKg > 0 && rawDose >= effectiveMaxDose;
  const isPedsCapped = isPediatric && drug.pediatricMaxDose !== undefined && rawDose >= drug.pediatricMaxDose;

  const scope = scopeConfig[drug.scope];

  const accentColor = isPediatric ? PEDS_BLUE : colors.accent;
  const accentLightColor = isPediatric ? PEDS_BLUE_LIGHT : colors.accentLight;
  const accentBorderColor = isPediatric ? PEDS_BLUE_BORDER : 'rgba(214,40,40,0.2)';

  const formatDose = (dose: number): string => {
    if (dose >= 1000 && drug.unit === 'mcg') {
      return `${(dose / 1000).toFixed(2)} mg`;
    }
    if (dose >= 100) return `${Math.round(dose)} ${drug.unit}`;
    if (dose >= 10) return `${dose.toFixed(1)} ${drug.unit}`;
    return `${dose.toFixed(2)} ${drug.unit}`;
  };

  return (
    <View style={[styles.doseCard, isPediatric && styles.doseCardPeds]}>
      <TouchableOpacity style={styles.doseCardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.doseCardLeft}>
          <Text style={styles.drugName}>{drug.name}</Text>
          <Text style={styles.drugIndication}>{drug.indication}</Text>
        </View>
        <View style={styles.doseCardRight}>
          <View style={[styles.scopeBadge, { backgroundColor: scope.bg }]}>
            <Text style={[styles.scopeText, { color: scope.color }]}>
              {drug.scope === 'Both' ? 'ALL' : drug.scope.toUpperCase()}
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color={colors.textMuted} />
          ) : (
            <ChevronDown size={16} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      <View style={[styles.doseHighlight, { backgroundColor: accentLightColor, borderTopColor: accentBorderColor }]}>
        <View style={styles.doseValueRow}>
          <Text style={[styles.doseValue, { color: accentColor }]}>{formatDose(clampedDose)}</Text>
          <Text style={styles.doseRoute}>{drug.route}</Text>
        </View>
        <View style={styles.doseBadgeGroup}>
          {isMaxed && !isPedsCapped && (
            <View style={styles.maxDoseBadge}>
              <AlertTriangle size={11} color={colors.warningText} />
              <Text style={styles.maxDoseText}>MAX DOSE</Text>
            </View>
          )}
          {isPedsCapped && (
            <View style={styles.pedsCappedBadge}>
              <Baby size={10} color={PEDS_BLUE} />
              <Text style={styles.pedsCappedText}>PEDS MAX</Text>
            </View>
          )}
        </View>
      </View>

      {isPediatric && drug.pediatricNote && (
        <View style={styles.pedsNoteBar}>
          <Baby size={11} color={PEDS_BLUE} />
          <Text style={styles.pedsNoteText}>{drug.pediatricNote}</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.doseDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dose/kg</Text>
            <Text style={styles.detailValue}>
              {drug.dosePerKg > 0 ? `${drug.dosePerKg} ${drug.unit}/kg` : 'Fixed dose'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{weightKg.toFixed(1)} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Max Dose</Text>
            <Text style={styles.detailValue}>
              {isPediatric && drug.pediatricMaxDose !== undefined
                ? `${drug.pediatricMaxDose} ${drug.pediatricMaxDoseUnit || drug.unit} (peds)`
                : `${drug.maxDose} ${drug.maxDoseUnit || drug.unit}`}
            </Text>
          </View>
          {drug.concentration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Concentration</Text>
              <Text style={styles.detailValue}>{drug.concentration}</Text>
            </View>
          )}
          {drug.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{drug.notes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginLeft: 28,
  },
  weightCard: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  weightLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  weightInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  ageOptional: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  ageInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  unitActive: {
    color: colors.accent,
  },
  weightResult: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 12,
  },
  weightResultText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  weightResultSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weightHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pediatricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PEDS_BLUE_LIGHT,
    borderWidth: 1,
    borderColor: PEDS_BLUE_BORDER,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pediatricBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PEDS_BLUE,
    letterSpacing: 0.6,
  },
  pediatricSubtext: {
    fontSize: 11,
    color: PEDS_BLUE,
    paddingHorizontal: 16,
    marginBottom: 12,
    opacity: 0.85,
  },
  doseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  doseCardPeds: {
    borderColor: PEDS_BLUE_BORDER,
  },
  doseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  doseCardLeft: {
    flex: 1,
    gap: 2,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  drugIndication: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  doseCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scopeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  doseHighlight: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doseValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  doseValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  doseRoute: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  doseBadgeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  maxDoseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  maxDoseText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warningText,
    letterSpacing: 0.5,
  },
  pedsCappedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PEDS_BLUE_LIGHT,
    borderWidth: 1,
    borderColor: PEDS_BLUE_BORDER,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  pedsCappedText: {
    fontSize: 9,
    fontWeight: '700',
    color: PEDS_BLUE,
    letterSpacing: 0.5,
  },
  pedsNoteBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: PEDS_BLUE_LIGHT,
    borderTopWidth: 1,
    borderTopColor: PEDS_BLUE_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pedsNoteText: {
    flex: 1,
    fontSize: 11,
    color: PEDS_BLUE,
    lineHeight: 16,
    fontWeight: '500',
  },
  doseDetails: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
