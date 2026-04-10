import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  TSpan,
  Line,
  Path,
  Polygon,
  Defs,
  Marker,
  G,
} from 'react-native-svg';

const W = 680;
const H = 1280;

const C = {
  bg: '#0d1117',
  surface: '#21262d',
  surfaceBorder: '#484f58',
  mutedBorder: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  faint: '#484f58',

  emtFill: '#1c2128',
  emtBorder: '#484f58',
  emtText: '#e6edf3',
  emtSub: '#8b949e',

  paraFill: '#1b3a2d',
  paraBorder: '#0F6E56',
  paraText: '#56d364',
  paraSub: '#9fe1cb',

  decFill: '#1f3a5f',
  decBorder: '#185FA5',
  decText: '#79c0ff',

  critFill: '#2a1a0a',
  critBorder: '#f0883e',
  critText: '#f0883e',
  critSub: '#fac775',

  obFill: '#3a1a2a',
  obBorder: '#993556',
  obText: '#f0b8d0',
  obSub: '#f4c0d1',

  drugFill: '#1a2a3a',
  drugBorder: '#185FA5',
  drugText: '#79c0ff',

  redFill: '#3a1010',
  redBorder: '#d62828',
  redText: '#f85149',

  arrow: '#484f58',
  arrowGreen: '#0F6E56',
  arrowRed: '#d62828',
};

function Arrow({
  x1, y1, x2, y2,
  color = C.arrow,
}: {
  x1: number; y1: number; x2: number; y2: number; color?: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const tip = { x: x2, y: y2 };
  const l1 = { x: x2 - ux * 9 - uy * 5, y: y2 - uy * 9 + ux * 5 };
  const l2 = { x: x2 - ux * 9 + uy * 5, y: y2 - uy * 9 - ux * 5 };
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} />
      <Polygon
        points={`${tip.x},${tip.y} ${l1.x},${l1.y} ${l2.x},${l2.y}`}
        fill={color}
      />
    </G>
  );
}

function ArrowLine({
  x1, y1, x2, y2, color = C.arrow,
}: {
  x1: number; y1: number; x2: number; y2: number; color?: string;
}) {
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} />;
}

function Label({
  x, y, text, color = C.muted,
}: {
  x: number; y: number; text: string; color?: string;
}) {
  return (
    <SvgText x={x} y={y} fontSize={11} fill={color} fontFamily="System">
      {text}
    </SvgText>
  );
}

function Box({
  x, y, w, h,
  fill, stroke,
  rx = 8,
  titleText,
  titleColor,
  titleSize = 13,
  subLines = [],
  subColor,
  subSize = 11,
  dividerY,
  extraLines = [],
}: {
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string; rx?: number;
  titleText?: string; titleColor?: string; titleSize?: number;
  subLines?: string[]; subColor?: string; subSize?: number;
  dividerY?: number;
  extraLines?: Array<{ text: string; y: number; color: string; size?: number; weight?: string }>;
}) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1} rx={rx} />
      {titleText && (
        <SvgText
          x={x + w / 2}
          y={y + (subLines.length > 0 ? titleSize + 8 : h / 2 + titleSize * 0.35)}
          textAnchor="middle"
          fontSize={titleSize}
          fill={titleColor}
          fontWeight="500"
          fontFamily="System"
        >
          {titleText}
        </SvgText>
      )}
      {subLines.map((line, i) => (
        <SvgText
          key={i}
          x={x + w / 2}
          y={y + (titleText ? titleSize + 10 : 0) + (subSize + 4) * (i + 1) + 4}
          textAnchor="middle"
          fontSize={subSize}
          fill={subColor}
          fontFamily="System"
        >
          {line}
        </SvgText>
      ))}
      {dividerY !== undefined && (
        <Line x1={x + 8} y1={dividerY} x2={x + w - 8} y2={dividerY} stroke={stroke} strokeWidth={0.5} />
      )}
      {extraLines.map((el, i) => (
        <SvgText
          key={i}
          x={x + w / 2}
          y={el.y}
          textAnchor="middle"
          fontSize={el.size ?? 11}
          fill={el.color}
          fontWeight={el.weight ?? 'normal'}
          fontFamily="System"
        >
          {el.text}
        </SvgText>
      ))}
    </G>
  );
}

function Diamond({
  cx, cy, w, h,
  fill, stroke,
  line1, line2,
  textColor,
}: {
  cx: number; cy: number; w: number; h: number;
  fill: string; stroke: string;
  line1: string; line2?: string;
  textColor: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
  return (
    <G>
      <Polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1} />
      <SvgText
        x={cx} y={line2 ? cy - 6 : cy + 4}
        textAnchor="middle" fontSize={13}
        fill={textColor} fontWeight="500" fontFamily="System"
      >
        {line1}
      </SvgText>
      {line2 && (
        <SvgText
          x={cx} y={cy + 11}
          textAnchor="middle" fontSize={13}
          fill={textColor} fontWeight="500" fontFamily="System"
        >
          {line2}
        </SvgText>
      )}
    </G>
  );
}

function SeizureSvg() {
  const cx = W / 2;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={C.bg} />

      {/* ── HEADER NOTE ── */}
      <Rect x={90} y={20} width={500} height={54} rx={8} fill="#1c2128" stroke={C.mutedBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={40} textAnchor="middle" fontSize={13} fill={C.text} fontWeight="500" fontFamily="System">
        Includes: ongoing seizure on arrival, seizure &gt;5 min,
      </SvgText>
      <SvgText x={cx} y={56} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily="System">
        {'>'}2 seizures/hr (status epilepticus)
      </SvgText>

      <Arrow x1={cx} y1={74} x2={cx} y2={98} />

      {/* ── STEP 1 ── */}
      <Rect x={120} y={98} width={440} height={44} rx={8} fill={C.surface} stroke={C.surfaceBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={116} textAnchor="middle" fontSize={13} fill={C.text} fontWeight="500" fontFamily="System">
        1. Initiate Universal Care
      </SvgText>
      <SvgText x={cx} y={132} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily="System">
        EMT — airway support, AVPU/GCS, O2 as needed
      </SvgText>

      <Arrow x1={cx} y1={142} x2={cx} y2={166} />

      {/* ── STEP 2 ── */}
      <Rect x={120} y={166} width={440} height={44} rx={8} fill={C.surface} stroke={C.surfaceBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={184} textAnchor="middle" fontSize={13} fill={C.text} fontWeight="500" fontFamily="System">
        2. Check blood glucose
      </SvgText>
      <SvgText x={cx} y={200} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily="System">
        EMT — fingerstick BGL. If pregnant → left lateral recumbent position
      </SvgText>

      <Arrow x1={cx} y1={210} x2={cx} y2={234} />

      {/* ── BGL DIAMOND ── */}
      <Diamond cx={cx} cy={262} w={300} h={56} fill="#1f3a5f" stroke="#185FA5"
        line1="BGL < 60 mg/dL?" textColor={C.decText} />

      {/* YES → left */}
      <ArrowLine x1={190} y1={262} x2={108} y2={262} color="#185FA5" />
      <Arrow x1={108} y1={262} x2={106} y2={262} color="#185FA5" />
      <Label x={138} y={252} text="Yes" color={C.decText} />

      <Rect x={18} y={236} width={88} height={52} rx={6} fill="#1a2a3a" stroke="#185FA5" strokeWidth={0.5} />
      <SvgText x={62} y={255} textAnchor="middle" fontSize={12} fill={C.decText} fontWeight="500" fontFamily="System">Refer to</SvgText>
      <SvgText x={62} y={269} textAnchor="middle" fontSize={11} fill={C.decText} fontFamily="System">Hypoglycemia</SvgText>
      <SvgText x={62} y={282} textAnchor="middle" fontSize={11} fill={C.decText} fontFamily="System">protocol</SvgText>

      <Arrow x1={cx} y1={290} x2={cx} y2={314} />
      <Label x={354} y={306} text="No" />

      {/* ── STEP 3 ── */}
      <Rect x={120} y={314} width={440} height={44} rx={8} fill={C.paraFill} stroke={C.paraBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={332} textAnchor="middle" fontSize={13} fill={C.paraText} fontWeight="500" fontFamily="System">
        3. IV/IO access + cardiac &amp; EtCO2 monitoring
      </SvgText>
      <SvgText x={cx} y={348} textAnchor="middle" fontSize={11} fill={C.paraSub} fontFamily="System">
        Paramedic — establish access, continuous monitoring
      </SvgText>

      <Arrow x1={cx} y1={358} x2={cx} y2={382} />

      {/* ── PREGNANT DIAMOND ── */}
      <Diamond cx={cx} cy={414} w={380} h={64} fill="#3a1a2a" stroke="#993556"
        line1="Pregnant >20 wk or" line2="postpartum <6 wk?" textColor={C.obText} />

      {/* YES → left */}
      <ArrowLine x1={150} y1={414} x2={60} y2={414} color="#993556" />
      <ArrowLine x1={60} y1={414} x2={60} y2={466} color="#993556" />
      <Arrow x1={60} y1={466} x2={60} y2={464} color="#993556" />
      <Label x={95} y={404} text="Yes" color={C.obText} />

      <Rect x={14} y={466} width={92} height={96} rx={6} fill="#2a1020" stroke="#993556" strokeWidth={1} />
      <SvgText x={60} y={484} textAnchor="middle" fontSize={12} fill={C.obText} fontWeight="500" fontFamily="System">Mag Sulfate</SvgText>
      <SvgText x={60} y={498} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">4 g IV/IO</SvgText>
      <SvgText x={60} y={511} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">over 20 min</SvgText>
      <SvgText x={60} y={524} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">slow push</SvgText>
      <SvgText x={60} y={537} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">→ OB</SvgText>
      <SvgText x={60} y={550} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">protocol</SvgText>

      <Arrow x1={cx} y1={446} x2={cx} y2={470} />
      <Label x={354} y={462} text="No" />

      {/* ── STEP 4: BENZO ── */}
      <Rect x={160} y={470} width={506} height={196} rx={8} fill="#2a1a0a" stroke={C.critBorder} strokeWidth={1} />
      <SvgText x={413} y={490} textAnchor="middle" fontSize={13} fill={C.critText} fontWeight="500" fontFamily="System">
        4. Administer benzodiazepine — Paramedic
      </SvgText>

      {/* Adult column */}
      <Rect x={168} y={500} width={232} height={154} rx={6} fill="#1c1208" stroke="#7a4a0a" strokeWidth={0.5} />
      <SvgText x={284} y={516} textAnchor="middle" fontSize={12} fill={C.critText} fontWeight="500" fontFamily="System">Adult (age ≥ 15)</SvgText>
      <SvgText x={284} y={536} textAnchor="middle" fontSize={12} fill={C.text} fontWeight="500" fontFamily="System">Midazolam</SvgText>
      <SvgText x={284} y={550} textAnchor="middle" fontSize={11} fill={C.critSub} fontFamily="System">IM/IN: 0.2 mg/kg, max 10 mg</SvgText>
      <Line x1={188} y1={563} x2={380} y2={563} stroke="#3a2a10" strokeWidth={0.5} />
      <SvgText x={284} y={578} textAnchor="middle" fontSize={12} fill={C.text} fontWeight="500" fontFamily="System">Midazolam or Lorazepam</SvgText>
      <SvgText x={284} y={592} textAnchor="middle" fontSize={11} fill={C.critSub} fontFamily="System">IV/IO: 0.1 mg/kg, max 4 mg</SvgText>
      <Line x1={188} y1={605} x2={380} y2={605} stroke="#3a2a10" strokeWidth={0.5} />
      <SvgText x={284} y={620} textAnchor="middle" fontSize={11} fill={C.critText} fontWeight="500" fontFamily="System">Age &gt;60: reduce dose by half</SvgText>
      <SvgText x={284} y={644} textAnchor="middle" fontSize={10} fill="#7a4a0a" fontFamily="System">Administer IV/IO slowly over 2 min</SvgText>

      {/* Pediatric column */}
      <Rect x={412} y={500} width={246} height={154} rx={6} fill="#0a1a2a" stroke="#185FA5" strokeWidth={0.5} />
      <SvgText x={535} y={516} textAnchor="middle" fontSize={12} fill={C.decText} fontWeight="500" fontFamily="System">Pediatric (age &lt; 15)</SvgText>
      <SvgText x={535} y={536} textAnchor="middle" fontSize={12} fill={C.text} fontWeight="500" fontFamily="System">Midazolam</SvgText>
      <SvgText x={535} y={550} textAnchor="middle" fontSize={11} fill="#b5d4f4" fontFamily="System">IM/IN: 0.2 mg/kg, max 10 mg</SvgText>
      <Line x1={428} y1={563} x2={648} y2={563} stroke="#0a2a4a" strokeWidth={0.5} />
      <SvgText x={535} y={578} textAnchor="middle" fontSize={12} fill={C.text} fontWeight="500" fontFamily="System">Midazolam or Lorazepam</SvgText>
      <SvgText x={535} y={592} textAnchor="middle" fontSize={11} fill="#b5d4f4" fontFamily="System">IV/IO: 0.1 mg/kg, max 4 mg</SvgText>
      <Line x1={428} y1={605} x2={648} y2={605} stroke="#0a2a4a" strokeWidth={0.5} />
      <SvgText x={535} y={620} textAnchor="middle" fontSize={11} fill={C.decText} fontWeight="500" fontFamily="System">Slow over 2 min via IV/IO</SvgText>
      <SvgText x={535} y={644} textAnchor="middle" fontSize={10} fill="#185FA5" fontFamily="System">Max 2 total doses regardless of route</SvgText>

      {/* connector from benzo box to arrow */}
      <ArrowLine x1={413} y1={666} x2={413} y2={682} />
      <ArrowLine x1={413} y1={682} x2={cx} y2={682} />
      <Arrow x1={cx} y1={682} x2={cx} y2={696} />

      {/* ── SEIZURE STOPPED? (1) ── */}
      <Diamond cx={cx} cy={724} w={320} h={56} fill={C.decFill} stroke={C.decBorder}
        line1="Seizure stopped?" textColor={C.decText} />

      {/* YES → right */}
      <Arrow x1={500} y1={724} x2={574} y2={724} color={C.arrowGreen} />
      <Label x={520} y={714} text="Yes" color={C.paraText} />
      <Rect x={574} y={702} width={88} height={44} rx={6} fill={C.paraFill} stroke={C.paraBorder} strokeWidth={0.5} />
      <SvgText x={618} y={719} textAnchor="middle" fontSize={11} fill={C.paraText} fontWeight="500" fontFamily="System">Postictal</SvgText>
      <SvgText x={618} y={733} textAnchor="middle" fontSize={11} fill={C.paraSub} fontFamily="System">→ step 6</SvgText>

      <Arrow x1={cx} y1={752} x2={cx} y2={776} />
      <Label x={354} y={768} text="No" />

      {/* ── STEP 5: REPEAT ── */}
      <Rect x={120} y={776} width={440} height={54} rx={8} fill={C.critFill} stroke={C.critBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={794} textAnchor="middle" fontSize={13} fill={C.critText} fontWeight="500" fontFamily="System">
        5. Repeat benzodiazepine — 1 repeat dose max
      </SvgText>
      <SvgText x={cx} y={809} textAnchor="middle" fontSize={11} fill={C.critSub} fontFamily="System">
        Same drug and dose. Max 2 total doses regardless of route.
      </SvgText>
      <SvgText x={cx} y={822} textAnchor="middle" fontSize={11} fill={C.critSub} fontFamily="System">
        Ketamine NOT indicated for postictal agitation.
      </SvgText>

      <Arrow x1={cx} y1={830} x2={cx} y2={854} />

      {/* ── SEIZURE STOPPED? (2) ── */}
      <Diamond cx={cx} cy={882} w={320} h={56} fill={C.decFill} stroke={C.decBorder}
        line1="Seizure stopped?" textColor={C.decText} />

      {/* NO → left → Medical Direction */}
      <Arrow x1={180} y1={882} x2={100} y2={882} color={C.arrowRed} />
      <Label x={128} y={872} text="No" color={C.redText} />
      <Rect x={14} y={858} width={84} height={48} rx={6} fill={C.redFill} stroke={C.redBorder} strokeWidth={0.5} />
      <SvgText x={56} y={876} textAnchor="middle" fontSize={12} fill={C.redText} fontWeight="500" fontFamily="System">Medical</SvgText>
      <SvgText x={56} y={891} textAnchor="middle" fontSize={12} fill={C.redText} fontWeight="500" fontFamily="System">Direction</SvgText>

      <Arrow x1={cx} y1={910} x2={cx} y2={940} color={C.arrowGreen} />
      <Label x={354} y={929} text="Yes" color={C.paraText} />

      {/* ── STEP 6: POSTICTAL ── */}
      <Rect x={80} y={940} width={520} height={76} rx={8} fill={C.paraFill} stroke={C.paraBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={960} textAnchor="middle" fontSize={13} fill={C.paraText} fontWeight="500" fontFamily="System">
        6. Postictal care — Paramedic
      </SvgText>
      <SvgText x={cx} y={976} textAnchor="middle" fontSize={11} fill={C.paraSub} fontFamily="System">
        Maintain airway, positioning, continuous monitoring
      </SvgText>
      <SvgText x={cx} y={990} textAnchor="middle" fontSize={11} fill={C.paraSub} fontFamily="System">
        If agitation: refer to Agitated/Violent Patient protocol
      </SvgText>
      <SvgText x={cx} y={1004} textAnchor="middle" fontSize={11} fill={C.paraSub} fontFamily="System">
        Ketamine NOT indicated postictal. Medical direction available at any time.
      </SvgText>

      <Arrow x1={cx} y1={1016} x2={cx} y2={1040} />

      {/* ── STEP 7: TRANSPORT ── */}
      <Rect x={160} y={1040} width={360} height={44} rx={8} fill={C.surface} stroke={C.surfaceBorder} strokeWidth={0.5} />
      <SvgText x={cx} y={1058} textAnchor="middle" fontSize={13} fill={C.text} fontWeight="500" fontFamily="System">
        7. Transport — notify receiving facility
      </SvgText>
      <SvgText x={cx} y={1074} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily="System">
        ALS intercept if not already on scene
      </SvgText>

      {/* ── PREGNANCY NOTE ── */}
      <Rect x={80} y={1106} width={520} height={52} rx={8} fill="#2a1020" stroke="#993556" strokeWidth={0.5} />
      <SvgText x={cx} y={1126} textAnchor="middle" fontSize={12} fill={C.obText} fontWeight="500" fontFamily="System">
        Pregnancy: Mag sulfate is first-line for eclamptic seizure
      </SvgText>
      <SvgText x={cx} y={1142} textAnchor="middle" fontSize={11} fill={C.obSub} fontFamily="System">
        If unclear etiology, may give benzo simultaneously with mag. Refer to OB/Eclampsia protocol.
      </SvgText>

      {/* ── FOOTER ── */}
      <SvgText x={cx} y={1210} textAnchor="middle" fontSize={11} fill={C.faint} fontFamily="System">
        Reference aid only — not a substitute for clinical judgment or online medical direction
      </SvgText>
      <SvgText x={cx} y={1224} textAnchor="middle" fontSize={11} fill={C.faint} fontFamily="System">
        Central AZ Red Book 2026 p.23
      </SvgText>
    </Svg>
  );
}

const LEGEND = [
  { color: C.surfaceBorder, label: 'EMT' },
  { color: C.paraText, label: 'Paramedic' },
  { color: C.decText, label: 'Decision' },
  { color: C.critText, label: 'Critical' },
  { color: C.redBorder, label: 'Special' },
];

interface SeizureProtocolProps {
  onBack?: () => void;
}

export default function SeizureProtocol({ onBack }: SeizureProtocolProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Seizures</Text>
          <Text style={styles.headerSub}>Adult &amp; Pediatric · Red Book 2026 p.23</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {LEGEND.map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Canvas */}
      <ScrollView
        style={styles.canvas}
        contentContainerStyle={styles.canvasContent}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        maximumZoomScale={4}
        minimumZoomScale={0.5}
        bouncesZoom
        scrollEventThrottle={16}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.svgWrapper}
        >
          <SeizureSvg />
        </ScrollView>
      </ScrollView>

      {/* Footer hint */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>Pinch to zoom · Drag to pan</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: '#8b949e',
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#e6edf3',
  },
  headerSub: {
    fontSize: 11,
    color: '#484f58',
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: '#8b949e',
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    flexGrow: 1,
  },
  svgWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  hint: {
    paddingVertical: 6,
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderTopColor: '#21262d',
  },
  hintText: {
    fontSize: 11,
    color: '#484f58',
    textAlign: 'center',
  },
});
