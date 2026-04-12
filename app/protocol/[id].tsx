import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import SeizureFlowchart from '@/components/protocols/SeizureFlowchart';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const FLOWCHART_W = 700;
const FLOWCHART_H = 3800;
const MIN_SCALE = 0.35;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.25;

const PROTOCOL_META: Record<string, { title: string; subtitle: string }> = {
  seizures: {
    title: 'Seizures',
    subtitle: 'Adult & Pediatric',
  },
};

const { width: SCREEN_W } = Dimensions.get('window');
const INITIAL_SCALE = (SCREEN_W) / FLOWCHART_W;

export default function ProtocolViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const meta = PROTOCOL_META[id ?? ''];

  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  useEffect(() => {
    const offset = (FLOWCHART_W * (1 - INITIAL_SCALE)) / 2;
    translateX.value = -offset + (SCREEN_W * (1 - INITIAL_SCALE)) / 2;
    savedX.value = translateX.value;
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
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
    const offset = (FLOWCHART_W * (1 - INITIAL_SCALE)) / 2;
    const tx = -offset + (SCREEN_W * (1 - INITIAL_SCALE)) / 2;
    scale.value = withTiming(INITIAL_SCALE, { duration: 250 });
    savedScale.value = INITIAL_SCALE;
    translateX.value = withTiming(tx, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });
    savedX.value = tx;
    savedY.value = 0;
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
        <Text style={styles.hintText}>Pinch to zoom · Drag to pan · Use buttons to reset</Text>
      </View>

      {/* Canvas */}
      <View style={styles.canvas}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.svgWrapper, animStyle]}>
            <SeizureFlowchart />
          </Animated.View>
        </GestureDetector>
      </View>
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
  canvas: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  svgWrapper: {
    width: FLOWCHART_W,
    height: FLOWCHART_H,
    transformOrigin: 'top left',
  },
});
