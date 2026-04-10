import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Shield, User } from 'lucide-react-native';
import { Drug } from '@/types/drug';
import { colors } from '@/constants/colors';
import { useState } from 'react';

interface DrugCardProps {
  drug: Drug;
}

const scopeConfig = {
  EMT: { color: colors.successText, bg: colors.successLight, label: 'EMT' },
  Paramedic: { color: colors.infoText, bg: colors.infoLight, label: 'Paramedic' },
  Both: { color: colors.textSecondary, bg: 'rgba(139, 148, 158, 0.12)', label: 'EMT + Medic' },
};

export function DrugCard({ drug }: DrugCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scope = scopeConfig[drug.scope];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.drugName}>{drug.name}</Text>
          {drug.genericName && (
            <Text style={styles.genericName}>{drug.genericName}</Text>
          )}
          <Text style={styles.drugClass}>{drug.class}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scopeBadge, { backgroundColor: scope.bg }]}>
            <Text style={[styles.scopeText, { color: scope.color }]}>{scope.label}</Text>
          </View>
          {expanded ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{drug.category}</Text>
          </View>

          <DetailSection title="Indications">
            {drug.indications.map((item, idx) => (
              <BulletItem key={idx} text={item} color={colors.successText} />
            ))}
          </DetailSection>

          <DetailSection title="Contraindications">
            {drug.contraindications.map((item, idx) => (
              <BulletItem key={idx} text={item} color={colors.dangerText} />
            ))}
          </DetailSection>

          <View style={styles.doseRow}>
            <View style={styles.doseBox}>
              <Text style={styles.doseLabel}>ADULT DOSE</Text>
              <Text style={styles.doseText}>{drug.adultDose}</Text>
            </View>
            {drug.pedsDose && (
              <View style={[styles.doseBox, styles.pedsDoseBox]}>
                <Text style={[styles.doseLabel, { color: colors.warningText }]}>PEDS DOSE</Text>
                <Text style={styles.doseText}>{drug.pedsDose}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <MetaItem label="Routes" value={drug.routes.join(', ')} />
            <MetaItem label="Onset" value={drug.onset} />
            <MetaItem label="Duration" value={drug.duration} />
          </View>

          <DetailSection title="Side Effects">
            <Text style={styles.sideEffectsText}>{drug.sideEffects.join(' · ')}</Text>
          </DetailSection>

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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bullet, { backgroundColor: color }]} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  genericName: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  drugClass: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  doseRow: {
    gap: 8,
    marginBottom: 12,
  },
  doseBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pedsDoseBox: {
    borderColor: colors.warningText,
  },
  doseLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  doseText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 8,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sideEffectsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notesBox: {
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
