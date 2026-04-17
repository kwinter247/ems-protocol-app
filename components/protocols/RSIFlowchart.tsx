import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  Defs,
  Marker,
  Path,
} from 'react-native-svg';

// ─── Canvas constants ────────────────────────────────────────────────────────
const W = 470;
const cx = W / 2;
const BW = 440;
const BX = cx - BW / 2; // 15
const GAP = 24;
const STEP_PADDING_V = 10;

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  emtBg: '#21262d', emtBorder: '#484f58', emtTitle: '#e6edf3', emtSub: '#8b949e',
  paraBg: '#1b3a2d', paraBorder: '#0F6E56', paraTitle: '#56d364', paraSub: '#8fcca0',
  critBg: '#2a1a0a', critBorder: '#f0883e', critTitle: '#f0883e', critSub: '#d29922',
  warnBg: '#1a1400', warnBorder: '#9e6a03', warnText: '#d29922',
  secBg: '#161b22', secText: '#6e7681',
  arrow: '#6e7681', label: '#8b949e', discText: '#6e7681',
};

// ─── Required layout keys ─────────────────────────────────────────────────────
const REQUIRED_KEYS = [
  'emtBar', 'header', 'indications', 'contraindications',
  'paraBar', 'step1', 'step2', 'step3', 'step4', 'step5',
];

type Layouts = Record<string, { top: number; bot: number }>;

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <Line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={C.arrow} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
  );
}

export default function RSIFlowchart() {
  const [L, setL] = useState<Layouts>({});
  const [ready, setReady] = useState(false);

  const measure = useCallback(
    (key: string) =>
      (e: { nativeEvent: { layout: { y: number; height: number } } }) => {
        const { y, height } = e.nativeEvent.layout;
        setL(prev => {
          const next = { ...prev, [key]: { top: y, bot: y + height } };
          if (!ready && REQUIRED_KEYS.every(k => next[k] !== undefined)) setReady(true);
          return next;
        });
      },
    [ready],
  );

  function Box({ id, stepNum, title, lines, bg, border, titleColor, bodyColor, badge }: {
    id: string; stepNum: string; title: string; lines: string[];
    bg: string; border: string; titleColor: string; bodyColor: string; badge: string;
  }) {
    return (
      <View onLayout={measure(id)} style={[styles.stepBox, { backgroundColor: bg, borderColor: border }]}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: border }]}>{stepNum}</Text>
          <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.badgeText, { color: titleColor }]}>{badge}</Text>
          </View>
        </View>
        <Text style={[styles.stepTitle, { color: titleColor }]}>{title}</Text>
        {lines.map((l, i) => <Text key={i} style={[styles.stepBody, { color: bodyColor }]}>{l}</Text>)}
      </View>
    );
  }

  const E = (id: string, n: string, t: string, ls: string[]) => (
    <Box id={id} stepNum={n} title={t} lines={ls}
      bg={C.emtBg} border={C.emtBorder} titleColor={C.emtTitle} bodyColor={C.emtSub} badge="EMT" />
  );
  const P = (id: string, n: string, t: string, ls: string[]) => (
    <Box id={id} stepNum={n} title={t} lines={ls}
      bg={C.paraBg} border={C.paraBorder} titleColor={C.paraTitle} bodyColor={C.paraSub} badge="PARAMEDIC" />
  );
  const K = (id: string, n: string, t: string, ls: string[]) => (
    <Box id={id} stepNum={n} title={t} lines={ls}
      bg={C.critBg} border={C.critBorder} titleColor={C.critTitle} bodyColor={C.critSub} badge="PARAMEDIC" />
  );

  function renderSVG() {
    if (!ready) return null;
    if (REQUIRED_KEYS.some(k => !L[k])) return null;

    return (
      <Svg style={StyleSheet.absoluteFill} width={W}>
        <Defs>
          <Marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <Path d="M0,0 L8,3 L0,6 Z" fill={C.arrow} />
          </Marker>
        </Defs>

        {/* ── Title block ── */}
        <Rect x={BX} y={8} width={BW} height={56} rx={6}
          fill={C.critBg} stroke={C.critBorder} strokeWidth={1.5} />
        <SvgText x={cx} y={28} fontSize={15} fill={C.critTitle}
          fontWeight="800" textAnchor="middle">RAPID SEQUENCE INTUBATION</SvgText>
        <SvgText x={cx} y={44} fontSize={11} fill={C.critSub} textAnchor="middle">
          Age ≥ 15 — Special Training Required (STR)
        </SvgText>
        <SvgText x={cx} y={58} fontSize={11} fill={C.warnText}
          fontWeight="700" textAnchor="middle">
          ⚠  Always consider transport time to hospital
        </SvgText>

        {/* ── EMT bar (measured) ── */}
        <Rect x={BX} y={L.emtBar.top} width={BW} height={20} rx={3} fill={C.secBg} />
        <SvgText x={cx} y={L.emtBar.top + 14}
          fontSize={11} fill={C.secText} fontWeight="700" textAnchor="middle">EMT</SvgText>

        {/* NO arrow between EMT bar and header — bar sits directly above step 1 */}

        {/* header → indications */}
        <Arrow x1={cx} y1={L.header.bot} x2={cx} y2={L.indications.top} />

        {/* indications → contraindications */}
        <Arrow x1={cx} y1={L.indications.bot} x2={cx} y2={L.contraindications.top} />

        {/* contraindications → down past PARAMEDIC bar (arrow exits contraindications) */}
        <Arrow x1={cx} y1={L.contraindications.bot} x2={cx} y2={L.paraBar.top} />

        {/* ── PARAMEDIC bar (measured) ── */}
        <Rect x={BX} y={L.paraBar.top} width={BW} height={20} rx={3} fill={C.secBg} />
        <SvgText x={cx} y={L.paraBar.top + 14}
          fontSize={11} fill={C.secText} fontWeight="700" textAnchor="middle">PARAMEDIC</SvgText>

        {/* NO arrow between PARAMEDIC bar and step 1 — bar sits directly above step 1 */}
        <Arrow x1={cx} y1={L.step1.bot} x2={cx} y2={L.step2.top} />
        <Arrow x1={cx} y1={L.step2.bot} x2={cx} y2={L.step3.top} />
        <Arrow x1={cx} y1={L.step3.bot} x2={cx} y2={L.step4.top} />
        <Arrow x1={cx} y1={L.step4.bot} x2={cx} y2={L.step5.top} />

        {/* ── Footer ── */}
        <SvgText x={cx} y={L.step5.bot + 20}
          fontSize={10} fill={C.discText} textAnchor="middle">
          Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
        </SvgText>
        <SvgText x={cx} y={L.step5.bot + 36}
          fontSize={10} fill={C.discText} textAnchor="middle">
          Reference aid only — does not replace online medical direction or clinical judgment.
        </SvgText>
      </Svg>
    );
  }

  return (
    <View style={{ width: W, backgroundColor: C.bg }}>

      {/* Title spacer: SVG title block y=8, h=56 → ends at 64 */}
      <View style={{ height: 72 }} />

      {/* EMT bar — measured, drawn by SVG. Sits directly above STEP 1. */}
      <View onLayout={measure('emtBar')} style={{ height: 20, marginHorizontal: BX }} />

      {E('header', 'STEP 1', 'Initiate Universal Care', [
        '• Universal Care prior to RSI',
      ])}
      <View style={{ height: GAP }} />

      {/* Indications */}
      <View onLayout={measure('indications')}
        style={[styles.stepBox, { backgroundColor: C.emtBg, borderColor: C.emtBorder }]}>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Indications</Text>
        {[
          '• Respiratory failure',
          '• Facial or airway burns',
          '• Inability to maintain airway or ventilation',
        ].map((l, i) => <Text key={i} style={[styles.stepBody, { color: C.emtSub }]}>{l}</Text>)}
      </View>
      <View style={{ height: GAP }} />

      {/* Contraindications */}
      <View onLayout={measure('contraindications')}
        style={[styles.stepBox, { backgroundColor: C.warnBg, borderColor: C.warnBorder }]}>
        <Text style={[styles.stepTitle, { color: C.warnText }]}>Contraindications</Text>
        {[
          '• History of neuromuscular disease',
          '• Known or suspected renal failure',
          '• History of malignant hyperthermia',
          '• Patient in cardiac arrest',
          '• Scenarios where intubation possible without drug assistance',
          'Relative: Known/presumed difficult airway,',
          '  RSI would delay transport to definitive care',
        ].map((l, i) => <Text key={i} style={[styles.stepBody, { color: C.warnText }]}>{l}</Text>)}
      </View>
      <View style={{ height: GAP }} />

      {/* PARAMEDIC bar — measured, drawn by SVG. Sits directly above RSI 1. */}
      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />

      {P('step1', 'RSI 1', 'Pre-Oxygenation & Setup', [
        '• Monitoring: cardiac, SpO₂, waveform capnography (EtCO₂)',
        '• Establish IV / IO',
        '• NC + BVM high-flow O₂  OR  NC + NRB high-flow O₂',
        '• Apneic oxygenation: place NC on separate O₂ source',
        '  at max flow — maintain throughout entire procedure',
      ])}
      <View style={{ height: GAP }} />

      {K('step2', 'RSI 2', 'Sedate — Choose One', [
        '• Etomidate 0.3 mg/kg IV/IO push — max 20 mg',
        '  ONE-TIME DOSE ONLY — no repeat doses',
        '',
        '  OR',
        '',
        '• Ketamine 1.5 mg/kg IV/IO push — max 150 mg',
      ])}
      <View style={{ height: GAP }} />

      {K('step3', 'RSI 3', 'Paralyze — Choose One', [
        '• Succinylcholine 1.5 mg/kg IV/IO push',
        '  ONE-TIME DOSE ONLY — no repeat doses',
        '',
        '  OR',
        '',
        '• Rocuronium 1 mg/kg IV/IO push',
        '  ONE-TIME DOSE ONLY',
        '  Requires agency / medical director approval',
      ])}
      <View style={{ height: GAP }} />

      {P('step4', 'RSI 4', 'Intubate & Confirm', [
        '• Max 2 attempts — ventilate patient between attempts',
        '• If unable to intubate → place OPA or SGA + BVM',
        '• Cricothyrotomy if unable to intubate OR',
        '  unable to oxygenate/ventilate via OPA/SGA + BVM',
        '• Confirm ETT placement with waveform capnography (EtCO₂)',
        '  — remove & place alternate device if unable to confirm',
      ])}
      <View style={{ height: GAP }} />

      {K('step5', 'RSI 5', 'Post-Intubation Care', [
        '⚠  NO repeat doses of Etomidate or Succinylcholine',
        '',
        'Sedation & comfort (repeat PRN):',
        '• Fentanyl 1 mcg/kg IV/IO — max 50 mcg per dose',
        '  (lower dose for suspected TBI)',
        '• Morphine 0.1 mg/kg IV/IO — max 5 mg per dose',
        '• Midazolam 0.1 mg/kg IV/IO — max 5 mg per dose',
        '• Lorazepam 0.1 mg/kg IV/IO — max 2 mg per dose',
        '• Ketamine 1 mg/kg IV/IO — max 150 mg, repeat q5 min PRN',
        '',
        'Post-intubation checklist:',
        '• OG tube for gastric decompression',
        '• Repeat vital signs',
        '• If SBP < 100 → IV/IO fluid bolus before additional meds',
        '• Assess comfort and pain during transport',
        '• Document EtCO₂ reading at hospital transfer of care',
      ])}

      <View style={{ height: 56 }} />
      {renderSVG()}
    </View>
  );
}

const styles = StyleSheet.create({
  stepBox: {
    marginHorizontal: BX,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    paddingTop: STEP_PADDING_V,
    paddingBottom: STEP_PADDING_V,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  stepTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  stepBody: { fontSize: 12, lineHeight: 18 },
});
