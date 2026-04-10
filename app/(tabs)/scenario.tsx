import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Brain, Send, RotateCcw, User, Weight, Baby } from 'lucide-react-native';
import { ScenarioChips } from '@/components/scenario/ScenarioChips';
import { ResultCards } from '@/components/scenario/ResultCards';
import { LoadingState } from '@/components/scenario/LoadingState';
import { exampleChips } from '@/constants/scenarios';
import { ScenarioResponse, ExampleChip } from '@/types/scenario';
import { colors } from '@/constants/colors';

const PEDIATRIC_WEIGHT_KG = 40;
const PEDIATRIC_AGE_YEARS = 15;
const PEDS_BLUE = '#2563eb';
const PEDS_BLUE_LIGHT = 'rgba(37, 99, 235, 0.15)';
const PEDS_BLUE_BORDER = 'rgba(37, 99, 235, 0.35)';

export default function ScenarioScreen() {
  const [presentation, setPresentation] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [useLbs, setUseLbs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleChipSelect = (chip: ExampleChip) => {
    setPresentation(chip.presentation);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!presentation.trim() || presentation.trim().length < 10) {
      setError('Please describe the patient presentation in more detail.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Apikey': supabaseAnonKey ?? '',
        },
        body: JSON.stringify({
          presentation: presentation.trim(),
          age: age.trim() || undefined,
          weight: weightKg !== null ? String(weightKg.toFixed(1)) : (weight.trim() || undefined),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to analyze scenario. Please try again.');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPresentation('');
    setAge('');
    setWeight('');
    setResult(null);
    setError(null);
  };

  const canSubmit = presentation.trim().length >= 10 && !loading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Brain size={20} color={colors.accent} />
              <Text style={styles.title}>Scenario AI</Text>
            </View>
            <Text style={styles.subtitle}>Powered by Central Arizona Red Book 2026</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.chipsSection}>
              <ScenarioChips chips={exampleChips} onSelect={handleChipSelect} />
            </View>

            <View style={styles.divider} />

            <View style={styles.presentationSection}>
              <Text style={styles.fieldLabel}>Patient Presentation</Text>
              <TextInput
                style={styles.presentationInput}
                value={presentation}
                onChangeText={(t) => {
                  setPresentation(t);
                  setError(null);
                }}
                placeholder="Describe the patient's chief complaint, vitals, history, and current presentation..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{presentation.length} chars</Text>
            </View>

            <View style={styles.vitalsRow}>
              <View style={styles.vitalField}>
                <View style={styles.vitalLabelRow}>
                  <User size={12} color={colors.textMuted} />
                  <Text style={styles.fieldLabel}>Age</Text>
                </View>
                <TextInput
                  style={styles.vitalInput}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 45"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                />
              </View>
              <View style={styles.vitalField}>
                <View style={styles.vitalLabelRowWeight}>
                  <View style={styles.weightLabelLeft}>
                    <Weight size={12} color={colors.textMuted} />
                    <Text style={styles.fieldLabel}>Weight</Text>
                  </View>
                  <View style={styles.unitToggle}>
                    <Text style={[styles.unitLabel, !useLbs && styles.unitActive]}>kg</Text>
                    <Switch
                      value={useLbs}
                      onValueChange={setUseLbs}
                      thumbColor={colors.text}
                      trackColor={{ false: colors.border, true: colors.accent }}
                      style={styles.unitSwitch}
                    />
                    <Text style={[styles.unitLabel, useLbs && styles.unitActive]}>lbs</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.vitalInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={useLbs ? 'e.g. 176' : 'e.g. 80'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              {(result || presentation.length > 0) && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.8}
              >
                <Send size={16} color={canSubmit ? '#fff' : colors.textMuted} />
                <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                  Analyze Scenario
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading && <LoadingState />}

          {result && !loading && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsBanner}>
                <View style={styles.resultsBannerTop}>
                  <Text style={styles.resultsBannerText}>AI Protocol Guidance</Text>
                  {isPediatric && (
                    <View style={styles.pediatricBadge}>
                      <Baby size={12} color={PEDS_BLUE} />
                      <Text style={styles.pediatricBadgeText}>PEDIATRIC</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.resultsBannerSub}>
                  Based on Central Arizona Red Book 2026 · Not a substitute for medical direction
                </Text>
                {isPediatric && (
                  <Text style={styles.pediatricSubtext}>
                    Pediatric dosing thresholds applied — weight &lt; 40 kg or age &lt; 15 yrs
                  </Text>
                )}
              </View>
              <ResultCards result={result} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
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
  formCard: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 16,
  },
  chipsSection: {
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  presentationSection: {
    padding: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  presentationInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 110,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  vitalField: {
    flex: 1,
  },
  vitalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  vitalLabelRowWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weightLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  unitSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  unitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  unitActive: {
    color: colors.accent,
  },
  vitalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  errorBox: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingTop: 4,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  submitTextDisabled: {
    color: colors.textMuted,
  },
  resultsSection: {
    paddingHorizontal: 16,
  },
  resultsBanner: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  resultsBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultsBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  resultsBannerSub: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
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
    marginTop: 5,
    opacity: 0.9,
  },
});
