import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
  titleColor?: string;
  accent?: boolean;
}

export function SectionCard({
  title,
  children,
  style,
  titleColor,
  accent,
}: SectionCardProps) {
  return (
    <View style={[styles.card, accent && styles.accentCard, style]}>
      <View style={[styles.header, accent && styles.accentHeader]}>
        <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  accentCard: {
    borderColor: colors.accent,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  accentHeader: {
    backgroundColor: colors.accentLight,
    borderBottomColor: colors.accent,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
  },
});
