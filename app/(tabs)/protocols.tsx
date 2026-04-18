import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GitBranch, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';

const PROTOCOLS = [
  {
    id: 'seizures',
    title: 'Seizures',
    subtitle: 'Adult & Pediatric',
    category: 'Neurological',
    scope: 'Both',
  },
  {
    id: 'chest-pain',
    title: 'Chest Pain',
    subtitle: 'Adult',
    category: 'Cardiovascular',
    scope: 'Both',
  },
  {
    id: 'stroke-tia',
    title: 'Stroke / TIA',
    subtitle: 'Adult & Pediatric',
    category: 'Neurological',
    scope: 'Both',
  },
  {
    id: 'rsi',
    title: 'RSI',
    subtitle: 'Age ≥ 15 · Special Training Required',
    category: 'Airway',
    scope: 'Paramedic',
  },
  {
    id: 'airway-management',
    title: 'Airway Management',
    subtitle: 'Adult & Pediatric',
    category: 'Airway',
    scope: 'Both',
  },
  {
    id: 'cardiac-arrest-shockable',
    title: 'Cardiac Arrest — Shockable (VF/VT)',
    subtitle: 'Adult & Pediatric',
    category: 'Cardiac Arrest',
    scope: 'Both',
  },
];

const CATEGORIES = ['Cardiac Arrest', 'Airway', 'Cardiovascular', 'Neurological'];

const SCOPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EMT: {
    bg: 'rgba(35, 134, 54, 0.15)',
    text: '#3fb950',
    border: 'rgba(35, 134, 54, 0.35)',
  },
  Paramedic: {
    bg: 'rgba(214, 40, 40, 0.15)',
    text: '#f85149',
    border: 'rgba(214, 40, 40, 0.35)',
  },
  Both: {
    bg: 'rgba(88, 166, 255, 0.12)',
    text: '#58a6ff',
    border: 'rgba(88, 166, 255, 0.3)',
  },
};

export default function ProtocolsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <GitBranch size={20} color={colors.accent} />
            <Text style={styles.title}>Protocols</Text>
          </View>
          <Text style={styles.subtitle}>Central Arizona Red Book 2026</Text>
        </View>

        {CATEGORIES.map((category) => {
          const group = PROTOCOLS.filter((p) => p.category === category);
          if (group.length === 0) return null;
          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionLabel}>{category}</Text>
              {group.map((protocol) => {
                const scopeStyle = SCOPE_COLORS[protocol.scope];
                return (
                  <TouchableOpacity
                    key={protocol.id}
                    style={styles.card}
                    onPress={() => router.push(`/protocol/${protocol.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardLeft}>
                      <View style={styles.iconBox}>
                        <GitBranch size={18} color={colors.accent} />
                      </View>
                      <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{protocol.title}</Text>
                        <Text style={styles.cardSubtitle}>{protocol.subtitle}</Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.scopeBadge, { backgroundColor: scopeStyle.bg, borderColor: scopeStyle.border }]}>
                        <Text style={[styles.scopeText, { color: scopeStyle.text }]}>{protocol.scope}</Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.footer}>
          Tap a protocol to view the full flowchart. Pinch to zoom, drag to pan.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});