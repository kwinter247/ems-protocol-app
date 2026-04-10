import { View, Text, StyleSheet } from 'react-native';
import { TriangleAlert as AlertTriangle, Clock, ClipboardList, Activity, Pill, Baby, Circle as HelpCircle, BookOpen } from 'lucide-react-native';
import { ScenarioResponse, TreatmentStep, DrugRecommendation } from '@/types/scenario';
import { SectionCard } from '@/components/ui/SectionCard';
import { colors } from '@/constants/colors';

interface ResultCardsProps {
  result: ScenarioResponse;
}

export function ResultCards({ result }: ResultCardsProps) {
  return (
    <View style={styles.container}>
      {result.timeAlerts && result.timeAlerts.length > 0 && (
        <TimeAlertsCard alerts={result.timeAlerts} />
      )}

      {result.redFlags && result.redFlags.length > 0 && (
        <RedFlagsCard flags={result.redFlags} />
      )}

      {result.protocols && result.protocols.length > 0 && (
        <ProtocolsCard protocols={result.protocols} />
      )}

      {result.assessmentQuestions && result.assessmentQuestions.length > 0 && (
        <AssessmentCard questions={result.assessmentQuestions} />
      )}

      {result.treatmentSteps && result.treatmentSteps.length > 0 && (
        <TreatmentCard steps={result.treatmentSteps} />
      )}

      {result.drugs && result.drugs.length > 0 && (
        <DrugsCard drugs={result.drugs} />
      )}

      {result.pedsConsiderations && result.pedsConsiderations.length > 0 && (
        <PedsCard considerations={result.pedsConsiderations} />
      )}
    </View>
  );
}

function TimeAlertsCard({ alerts }: { alerts: string[] }) {
  return (
    <View style={styles.timeAlertsCard}>
      <View style={styles.timeAlertsHeader}>
        <Clock size={16} color={colors.warningText} />
        <Text style={styles.timeAlertsTitle}>TIME-CRITICAL ALERTS</Text>
      </View>
      {alerts.map((alert, idx) => (
        <View key={idx} style={styles.timeAlertRow}>
          <Text style={styles.timeAlertText}>{alert}</Text>
        </View>
      ))}
    </View>
  );
}

function RedFlagsCard({ flags }: { flags: string[] }) {
  return (
    <SectionCard
      title="Red Flags"
      accent
      titleColor={colors.accent}
    >
      {flags.map((flag, idx) => (
        <View key={idx} style={styles.flagRow}>
          <AlertTriangle size={13} color={colors.accent} />
          <Text style={styles.flagText}>{flag}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

function ProtocolsCard({ protocols }: { protocols: string[] }) {
  return (
    <SectionCard title="Applicable Protocols" titleColor={colors.infoText}>
      <View style={styles.protocolsWrap}>
        {protocols.map((protocol, idx) => (
          <View key={idx} style={styles.protocolBadge}>
            <BookOpen size={11} color={colors.infoText} />
            <Text style={styles.protocolText}>{protocol}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function AssessmentCard({ questions }: { questions: string[] }) {
  return (
    <SectionCard title="Assessment Questions" titleColor={colors.textSecondary}>
      {questions.map((q, idx) => (
        <View key={idx} style={styles.questionRow}>
          <View style={styles.qNumber}>
            <Text style={styles.qNumberText}>{idx + 1}</Text>
          </View>
          <Text style={styles.questionText}>{q}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

const scopeStyles: Record<string, { color: string; bg: string; label: string }> = {
  EMT: { color: colors.successText, bg: colors.successLight, label: 'EMT' },
  Paramedic: { color: colors.infoText, bg: colors.infoLight, label: 'ALS' },
  Both: { color: colors.textSecondary, bg: 'rgba(139,148,158,0.12)', label: 'ALL' },
};

function TreatmentCard({ steps }: { steps: TreatmentStep[] }) {
  return (
    <SectionCard title="Treatment Steps" titleColor={colors.successText}>
      {steps.map((step, idx) => {
        const scope = scopeStyles[step.scope] || scopeStyles.Both;
        return (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{step.step}</Text>
              </View>
              {idx < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepAction}>{step.action}</Text>
              <View style={[styles.scopeBadge, { backgroundColor: scope.bg }]}>
                <Text style={[styles.scopeText, { color: scope.color }]}>{scope.label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </SectionCard>
  );
}

function DrugsCard({ drugs }: { drugs: DrugRecommendation[] }) {
  return (
    <SectionCard title="Medications" titleColor={colors.warningText}>
      {drugs.map((drug, idx) => (
        <View key={idx} style={[styles.drugCard, idx < drugs.length - 1 && styles.drugCardBorder]}>
          <View style={styles.drugHeader}>
            <Text style={styles.drugName}>{drug.name}</Text>
            <Text style={styles.drugRoute}>{drug.route}</Text>
          </View>
          <Text style={styles.drugIndication}>{drug.indication}</Text>
          <View style={styles.drugDoses}>
            <View style={styles.doseBlock}>
              <Text style={styles.doseLabel}>ADULT</Text>
              <Text style={styles.doseValue}>{drug.adultDose}</Text>
            </View>
            {drug.pedsDose && (
              <View style={styles.doseBlock}>
                <Text style={[styles.doseLabel, { color: colors.warningText }]}>PEDS</Text>
                <Text style={styles.doseValue}>{drug.pedsDose}</Text>
              </View>
            )}
          </View>
          {drug.notes && (
            <Text style={styles.drugNotes}>{drug.notes}</Text>
          )}
        </View>
      ))}
    </SectionCard>
  );
}

function PedsCard({ considerations }: { considerations: string[] }) {
  return (
    <SectionCard title="Pediatric Considerations" titleColor={colors.warningText}>
      {considerations.map((item, idx) => (
        <View key={idx} style={styles.pedsRow}>
          <Baby size={13} color={colors.warningText} />
          <Text style={styles.pedsText}>{item}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  timeAlertsCard: {
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.warningText,
    padding: 14,
    marginBottom: 12,
  },
  timeAlertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timeAlertsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warningText,
    letterSpacing: 0.8,
  },
  timeAlertRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.warningText,
    paddingLeft: 10,
    marginBottom: 6,
  },
  timeAlertText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  flagText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  protocolsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.infoLight,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  protocolText: {
    fontSize: 12,
    color: colors.infoText,
    fontWeight: '500',
  },
  questionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  qNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    paddingTop: 2,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
    flexShrink: 0,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 3,
    minHeight: 12,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  stepAction: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 5,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  drugCard: {
    paddingBottom: 12,
    marginBottom: 12,
  },
  drugCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  drugName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  drugRoute: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  drugIndication: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  drugDoses: {
    gap: 6,
    marginBottom: 6,
  },
  doseBlock: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
  },
  doseLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.successText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  doseValue: {
    fontSize: 13,
    color: colors.text,
  },
  drugNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  pedsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  pedsText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
