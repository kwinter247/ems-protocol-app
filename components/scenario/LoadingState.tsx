import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export function LoadingState() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, { opacity: pulse }]}>
        <Activity size={28} color={colors.accent} />
      </Animated.View>
      <Text style={styles.title}>Analyzing Scenario</Text>
      <Text style={styles.subtitle}>
        Querying Central Arizona Red Book 2026 protocols...
      </Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <DotPulse key={i} delay={i * 300} />
        ))}
      </View>
    </View>
  );
}

function DotPulse({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  }, [scale, delay]);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ scale }] }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
