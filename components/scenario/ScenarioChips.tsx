import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ExampleChip } from '@/types/scenario';
import { colors } from '@/constants/colors';

interface ScenarioChipsProps {
  chips: ExampleChip[];
  onSelect: (chip: ExampleChip) => void;
}

export function ScenarioChips({ chips, onSelect }: ScenarioChipsProps) {
  return (
    <View>
      <Text style={styles.label}>Quick Scenarios</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={styles.chip}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
