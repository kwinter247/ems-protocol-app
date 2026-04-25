import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react-native';
import { SearchBar } from '@/components/drugs/SearchBar';
import { DrugCard } from '@/components/drugs/DrugCard';
import { drugs, drugCategories } from '@/constants/drugs';
import { colors } from '@/constants/colors';

export default function DrugReferenceScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredDrugs = useMemo(() => {
    return drugs.filter((drug) => {
      const matchesSearch =
        search.length === 0 ||
        drug.name.toLowerCase().includes(search.toLowerCase()) ||
        (drug.genericName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        drug.class.toLowerCase().includes(search.toLowerCase()) ||
        drug.indications.some((i) => i.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || drug.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const visibleCategories = useMemo(() => {
    const used = new Set(drugs.map((d) => d.category));
    return ['All', ...drugCategories.slice(1).filter((c) => used.has(c))];
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Activity size={20} color={colors.accent} />
          <Text style={styles.title}>Drug Reference</Text>
        </View>
        <Text style={styles.subtitle}>Central Arizona Red Book 2026</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
        bounces={false}
        overScrollMode="never"
      >
        {visibleCategories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filteredDrugs.length} {filteredDrugs.length === 1 ? 'drug' : 'drugs'}
        </Text>
      </View>

      <FlatList
        data={filteredDrugs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DrugCard drug={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState search={search} />}
      />
    </SafeAreaView>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No drugs found</Text>
      <Text style={styles.emptySubtitle}>
        {search ? `No results for "${search}"` : 'Try adjusting your filters'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryScroll: {
    flexGrow: 0,
    minHeight: 40,
    marginBottom: 4,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
