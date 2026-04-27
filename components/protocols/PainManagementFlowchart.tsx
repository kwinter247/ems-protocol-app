// PainManagementFlowchart.tsx
// Pain Management: Adult & Pediatric
// Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
// Architecture: v2 — onLayout measurements + SVG overlay

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, Line, Marker, Polygon, Rect, Text as SvgText } from 'react-native-svg';

const W = 470;
const cx = 235;
const BX = 15;
const BR = 455;
const BW = 440;
const GAP = 24;
const STEP_PADDING_V = 10;
const DCX = 135;

const NARROW_W = 240;
const CALLOUT_X = 265;
const CALLOUT_W = 190;

const C = {
  bg: '#0d1117',
  emtBg: '#21262d',
  emtBorder: '#484f58',
  emtTitle: '#e6edf3',
  emtSub: '#8b949e',
  paraBg: '#1b3a2d',
  paraBorder: '#0F6E56',
  paraTitle: '#56d364',
  paraSub: '#8fcca0',
  critBg: '#2a1a0a',
  critBorder: '#f0883e',
  critTitle: '#f0883e',
  critSub: '#d29922',
  decBg: '#1f3a5f',
  decBorder: '#185FA5',
  decText: '#79c0ff',
  destBg: '#3a1010',
  destBorder: '#d62828',
  destText: '#f85149',
  destSub: '#e89b9b',
  warnBg: '#1a1400',
  warnBorder: '#9e6a03',
  warnText: '#d29922',
  secBg: '#161b22',
  secText: '#6e7681',
  arrow: '#6e7681',
  label: '#8b949e',
  discText: '#6e7681',
};

type LayoutMap = Record<string, { top: number; bot: number } | undefined>;

const REQUIRED_KEYS = [
  'title',
  'caution',
  'excludes',
  'emtBar',
  'step1',
  'step2',
  'step3',
  'paraBar',
  'step4',
  'sec5',
  'optA',
  'optB',
  'optC',
  'step6',
];

function Arrow({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <Line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={C.arrow}
      strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  );
}

function ConnLine({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.arrow} strokeWidth={1.5} />;
}

function ScopeBadge({
  scope,
  tone = 'default',
}: {
  scope: 'EMT' | 'PARAMEDIC';
  tone?: 'default' | 'orange';
}) {
  let color = scope === 'EMT' ? C.emtTitle : C.paraTitle;
  let borderColor = scope === 'EMT' ? C.emtBorder : C.paraBorder;
  if (tone === 'orange') {
    color = C.critTitle;
    borderColor = C.critBorder;
  }
  return (
    <View style={[styles.scopeBadge, { borderColor }]}>
      <Text style={[styles.scopeBadgeText, { color }]}>{scope}</Text>
    </View>
  );
}

function SectionBar({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.sectionBar, { marginHorizontal: BX, backgroundColor: bg }]}>
      <Text style={[styles.sectionBarText, { color }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ text }: { text: string }) {
  return (
    <View style={[styles.sectionHeader, { marginHorizontal: BX }]}>
      <Text style={styles.sectionHeaderText}>{text.toUpperCase()}</Text>
    </View>
  );
}

export default function PainManagementFlowchart() {
  const [L, setL] = useState<LayoutMap>({});
  const [containerY, setContainerY] = useState(0);

  const measure = useCallback(
    (key: string) => (e: any) => {
      const { y, height } = e.nativeEvent.layout;
      setL((prev) => {
        const top = y - containerY;
        const bot = top + height;
        if (prev[key]?.top === top && prev[key]?.bot === bot) return prev;
        return { ...prev, [key]: { top, bot } };
      });
    },
    [containerY],
  );

  const ready = REQUIRED_KEYS.every((k) => L[k] !== undefined);

  function renderSVG() {
    if (REQUIRED_KEYS.some((k) => !L[k])) return null;
    const l = L as Record<string, { top: number; bot: number }>;
    const svgH = l.step6.bot + 20;
    const step2Mid = (l.step2.top + l.step2.bot) / 2;
    const ketMid = (l.optC.top + l.optC.bot) / 2;
    const painCalloutH = 118;
    const painCalloutTop = l.step2.top + 2;
    const painCalloutMid = painCalloutTop + painCalloutH / 2;

    return (
      <Svg width={W} height={svgH} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <Polygon points="0 0, 8 3, 0 6" fill={C.arrow} />
          </Marker>
        </Defs>

        <Arrow x1={DCX} y1={l.step1.bot} x2={DCX} y2={l.step2.top} />
        <Arrow x1={DCX} y1={l.step2.bot} x2={DCX} y2={l.step3.top} />
        <Arrow x1={DCX} y1={l.step3.bot} x2={DCX} y2={l.paraBar.top} />

        <Arrow x1={DCX} y1={l.step4.bot} x2={DCX} y2={l.sec5.top} />
        <Arrow x1={DCX} y1={l.optA.bot} x2={DCX} y2={l.optB.top} />
        <Arrow x1={DCX} y1={l.optB.bot} x2={DCX} y2={l.optC.top} />
        <Arrow x1={DCX} y1={l.optC.bot} x2={DCX} y2={l.step6.top} />

        <ConnLine x1={BX + NARROW_W} y1={painCalloutMid} x2={CALLOUT_X} y2={painCalloutMid} />
        <Rect
          x={CALLOUT_X}
          y={painCalloutTop}
          width={CALLOUT_W}
          height={painCalloutH}
          rx={6}
          fill={C.decBg}
          stroke={C.decBorder}
          strokeWidth={1.5}
        />
        <SvgText x={CALLOUT_X + CALLOUT_W / 2} y={painCalloutTop + 20} fontSize={11} fill={C.decText} textAnchor="middle" fontWeight="700">
          Pain Scale by Age
        </SvgText>
        <SvgText x={CALLOUT_X + 8} y={painCalloutTop + 40} fontSize={10.5} fill={C.emtTitle}>
          Age {'<'} 4 yrs: FLACC or CHEOPS
        </SvgText>
        <SvgText x={CALLOUT_X + 8} y={painCalloutTop + 57} fontSize={10.5} fill={C.emtTitle}>
          Age 4–12 yrs: Faces Pain Scale-Revised
        </SvgText>
        <SvgText x={CALLOUT_X + 8} y={painCalloutTop + 74} fontSize={10.5} fill={C.emtTitle}>
          or Wong-Baker Faces
        </SvgText>
        <SvgText x={CALLOUT_X + 8} y={painCalloutTop + 91} fontSize={10.5} fill={C.emtTitle}>
          Age {'>'} 12 yrs: Numeric Rating Scale
        </SvgText>

        <ConnLine x1={BX + NARROW_W} y1={ketMid} x2={CALLOUT_X} y2={ketMid} />
        <Rect
          x={CALLOUT_X}
          y={ketMid - 28}
          width={CALLOUT_W}
          height={56}
          rx={6}
          fill={C.destBg}
          stroke={C.destBorder}
          strokeWidth={1.5}
        />
        <SvgText x={CALLOUT_X + CALLOUT_W / 2} y={ketMid - 8} fontSize={12} fill={C.destText} textAnchor="middle" fontWeight="700">
          ADULT ONLY
        </SvgText>
        <SvgText x={CALLOUT_X + CALLOUT_W / 2} y={ketMid + 14} fontSize={12} fill={C.destText} textAnchor="middle" fontWeight="600">
          Not for pediatric use
        </SvgText>
      </Svg>
    );
  }

  return (
    <View style={styles.canvas} onLayout={(e) => setContainerY(e.nativeEvent.layout.y)}>
      <View onLayout={measure('title')} style={[styles.titleBox, { marginHorizontal: BX }]}>
        <Text style={styles.titleText}>Pain Management</Text>
        <Text style={styles.titleSub}>Adult &amp; Pediatric</Text>
      </View>

      <View style={{ height: 12 }} />

      <View onLayout={measure('caution')} style={[styles.warnBox, { marginHorizontal: BX }]}>
        <Text style={styles.warnTitle}>CAUTION</Text>
        <Text style={styles.warnBody}>Multi-system trauma patients</Text>
        <Text style={styles.warnBodySub}>
          Risk of hemodynamic compromise, respiratory depression, and masking exam findings
        </Text>
      </View>

      <View style={{ height: 10 }} />

      <View onLayout={measure('excludes')} style={[styles.destBox, { marginHorizontal: BX }]}>
        <Text style={styles.destTitle}>EXCLUDES</Text>
        <Text style={styles.destBody}>SpO2 &lt; 90% · Active labor</Text>
      </View>

      <View style={{ height: GAP }} />

      <View onLayout={measure('emtBar')} style={{ height: 20, marginHorizontal: BX }}>
        <SectionBar label="EMT" color={C.emtTitle} bg="#1c2a3a" />
      </View>

      <View
        onLayout={measure('step1')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.emtBg, borderColor: C.emtBorder }]}
      >
        <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: C.emtSub }]}>Step 1</Text>
          <ScopeBadge scope="EMT" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Initiate Universal Care</Text>
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('step2')}
        style={[styles.stepBox, { marginLeft: BX, width: NARROW_W, backgroundColor: C.emtBg, borderColor: C.emtBorder }]}
      >
        <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: C.emtSub }]}>Step 2</Text>
          <ScopeBadge scope="EMT" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Assess Pain</Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>Use an age-appropriate pain scale</Text>
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('step3')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.emtBg, borderColor: C.emtBorder }]}
      >
        <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: C.emtSub }]}>Step 3</Text>
          <ScopeBadge scope="EMT" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Non-Pharmaceutical Management</Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>• Position of comfort (within safe transport)</Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>• Ice packs and/or splints</Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>• Verbal reassurance to lower anxiety</Text>
      </View>

      <View style={{ height: GAP }} />

      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }}>
        <SectionBar label="PARAMEDIC" color={C.paraTitle} bg="#1b2e24" />
      </View>

      <View
        onLayout={measure('step4')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.paraBg, borderColor: C.paraBorder }]}
      >
        <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: C.paraSub }]}>Step 4</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.paraTitle }]}>Oxygen as Needed</Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          Apply pulse oximeter. Administer O₂ to maintain SpO₂ ≥ 94%
        </Text>
      </View>

      <View style={{ height: GAP }} />

      <View onLayout={measure('sec5')}>
        <SectionHeader text="Step 5 · Analgesic Selection · Choose ONE" />
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('optA')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.critBg, borderColor: C.critBorder }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.critSub }]}>Option A</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={[styles.stepTitle, { color: C.critTitle }]}>MORPHINE</Text>
        <Text style={[styles.drugSubtitle, { color: C.critSub }]}>0.1 mg/kg/dose IV/IO</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Max 4 mg per increment</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Max total dose 16 mg</Text>
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('optB')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.critBg, borderColor: C.critBorder }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.critSub }]}>Option B</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={[styles.stepTitle, { color: C.critTitle }]}>FENTANYL</Text>
        <Text style={[styles.drugSubtitle, { color: C.critSub }]}>1 mcg/kg/dose IN/IV/IO</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Max initial dose 100 mcg</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Max total dose 200 mcg</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Consider intranasal route if available</Text>
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('optC')}
        style={[styles.stepBox, { marginLeft: BX, width: NARROW_W, backgroundColor: C.critBg, borderColor: C.critBorder }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.critSub }]}>Option C</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={[styles.stepTitle, { color: C.critTitle }]}>KETAMINE</Text>
        <Text style={[styles.drugSubtitle, { color: C.critSub }]}>0.25 mg/kg IV/IO</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• Max 25 mg per dose · max total 100 mg</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>• May repeat every 20 minutes</Text>
        <Text style={[styles.bullet, { color: C.critSub }]}>
          • Slow IV/IO push, OR dilute in 50 mL NS as 3–5 min infusion
        </Text>
      </View>

      <View style={{ height: GAP }} />

      <View
        onLayout={measure('step6')}
        style={[styles.stepBox, { marginHorizontal: BX, backgroundColor: C.paraBg, borderColor: C.paraBorder }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.paraSub }]}>Step 6</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.paraTitle }]}>Reassess &amp; Monitor</Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Reassess pain every 5 minutes — re-dose as indicated
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Use ETCO₂ as early predictor of hypoventilation
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Consider antiemetic for nausea/vomiting as needed
        </Text>
      </View>

      <View style={{ height: 20 }} />
      <Text style={styles.footerLine}>Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026</Text>
      <Text style={styles.footerLine}>
        Reference aid only — does not replace online medical direction or clinical judgment.
      </Text>

      {ready && renderSVG()}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: W,
    backgroundColor: C.bg,
    paddingBottom: 24,
  },
  titleBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  titleText: {
    color: C.emtTitle,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  titleSub: {
    color: C.label,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  warnBox: {
    backgroundColor: C.warnBg,
    borderColor: C.warnBorder,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  warnTitle: {
    color: C.warnText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warnBody: {
    color: C.emtTitle,
    fontSize: 13,
    lineHeight: 18,
  },
  warnBodySub: {
    color: C.warnText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  destBox: {
    backgroundColor: C.destBg,
    borderColor: C.destBorder,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  destTitle: {
    color: C.destSub,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  destBody: {
    color: C.destText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  stepBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  drugSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 3,
    fontWeight: '600',
  },
  sectionBar: {
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBarText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionHeader: {
    backgroundColor: C.secBg,
    borderRadius: 4,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    color: C.secText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  scopeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footerLine: {
    color: C.discText,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
});
