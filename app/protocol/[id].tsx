import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import SeizureFlowchart from '@/components/protocols/SeizureFlowchart';
import ChestPainFlowchart from '@/components/protocols/ChestPainFlowchart';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const MIN_SCALE = 0.35;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.25;

const PROTOCOL_META: Record<string, { title: string; subtitle: string }> = {
  seizures: {
    title: 'Seizures',
    subtitle: 'Adult & Pediatric',
  },
  'chest-pain': {
    title: 'Chest Pain',
    subtitle: 'Adult',
  },
};

const { width: SCREEN_W } = Dimensions.get('window');
const FLOWCHART_W = 470;
const INITIAL_SCALE = (SCREEN_W) / FLOWCHART_W;

export default function ProtocolViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const meta = PROTOCOL_META[id ?? ''];

  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const zoomIn = () => {
    const next = Math.min(MAX_SCALE, savedScale.value + ZOOM_STEP);
    scale.value = withTiming(next, { duration: 200 });
    savedScale.value = next;
  };

  const zoomOut = () => {
    const next = Math.max(MIN_SCALE, savedScale.value - ZOOM_STEP);
    scale.value = withTiming(next, { duration: 200 });
    savedScale.value = next;
  };

  const resetZoom = () => {
    scale.value = withTiming(INITIAL_SCALE, { duration: 250 });
    savedScale.value = INITIAL_SCALE;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{meta?.title ?? 'Protocol'}</Text>
          {meta?.subtitle ? <Text style={styles.headerSubtitle}>{meta.subtitle}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={zoomOut} activeOpacity={0.7}>
            <ZoomOut size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={zoomIn} activeOpacity={0.7}>
            <ZoomIn size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={resetZoom} activeOpacity={0.7}>
            <Maximize2 size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hint */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>Scroll to navigate · Pinch to zoom</Text>
      </View>

      {/* Canvas */}
      <GestureDetector gesture={pinchGesture}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Animated.View style={[styles.svgWrapper, animStyle]}>
            {id === 'chest-pain' ? <ChestPainFlowchart /> : <SeizureFlowchart />}
          </Animated.View>
        </ScrollView>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  hintText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignItems: 'center',
  },
  svgWrapper: {
    width: FLOWCHART_W,
    transformOrigin: 'top center',
  },
});
