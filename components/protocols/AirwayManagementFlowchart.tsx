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
const cx = W / 2;           // 235
const BW = 440;
const BX = cx - BW / 2;    // 15
const BR = BX + BW;         // 455
const GAP = 24;
const STEP_PADDING_V = 10;

// Diamond: left-aligned, center at DCX
const DW = 240;
const DCX = BX + DW / 2;   // 135 — diamond center X
const DXR = BX + DW;       // 255 — diamond right tip

// Callout box: right-aligned
const CBW = 140;
const CBX = BR - CBW;       // 315

// Pediatric note block height
const PEDS_H = 80;

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  emtBg: '#21262d', emtBorder: '#484f58', emtTitle: '#e6edf3', emtSub: '#8b949e',
  paraBg: '#1b3a2d', paraBorder: '#0F6E56', paraTitle: '#56d364', paraSub: '#8fcca0',
  critBg: '#2a1a0a', critBorder: '#f0883e', critTitle: '#f0883e', critSub: '#d29922',
  decBg: '#1f3a5f', decBorder: '#185FA5', decText: '#79c0ff',
  pedsBg: '#0a1a2a', pedsBorder: '#1f6feb', pedsDrug: '#58a6ff', pedsDose: '#a5d6ff',
  secBg: '#161b22', secText: '#6e7681',
  arrow: '#6e7681', label: '#8b949e', discText: '#6e7681',
};

// ─── Required layout keys ─────────────────────────────────────────────────────
const REQUIRED_KEYS = [
  'emtBar',
  'step1', 'step2', 'dec1',
  'step3', 'step4', 'paraBar',
  'step5', 'step6', 'dec2',
  'step7', 'step8', 'pedsNote',
  'step9', 'step10',
];

type Layouts = Record<string, { top: number; bot: number }>;

// ─── Arrow helper ─────────────────────────────────────────────────────────────
function Arrow({ x1, y1, x2, y2, label, labelSide = 'right' }: {
  x1: number; y1: number; x2: number; y2: number;
  label?: string; labelSide?: 'left' | 'right';
}) {
  const isH = Math.abs(y2 - y1) < 4;
  const lx = isH ? (x1 + x2) / 2 : labelSide === 'right' ? Math.max(x1, x2) + 6 : Math.min(x1, x2) - 6;
  const ly = isH ? Math.min(y1, y2) - 5 : (y1 + y2) / 2 + 4;
  return (
    <>
      <Line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={C.arrow} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
      {label && (
        <SvgText x={lx} y={ly} fontSize={11} fill={C.label} fontWeight="700"
          textAnchor={isH ? 'middle' : labelSide === 'right' ? 'start' : 'end'}
        >{label}</SvgText>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AirwayManagementFlowchart() {
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

  // ─── Step box factory ─────────────────────────────────────────────────────
  function Box({ id, stepNum, title, lines, bg, border, titleColor, bodyColor, badge }: {
    id: string; stepNum: string; title: string; lines: string[];
    bg: string; border: string; titleColor: string; bodyColor: string; badge: string;
  }) {
    return (
      <View onLayout={measure(id)} style={[styles.stepBox, { backgroundColor: bg, borderColor: border }]}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: bodyColor }]}>{stepNum}</Text>
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

  // ─── SVG overlay ───────────────────────────────────────────────────────────
  function renderSVG() {
    if (!ready) return null;
    if (REQUIRED_KEYS.some(k => !L[k])) return null;

    const PARA_BAR_Y = L.paraBar.top;
    const d1mid = (L.dec1.top + L.dec1.bot) / 2;
    const d2mid = (L.dec2.top + L.dec2.bot) / 2;

    function Diamond(key: string, text: string) {
      const { top, bot } = L[key];
      const midy = (top + bot) / 2;
      return (
        <>
          <Path d={`M${DCX},${top} L${DXR},${midy} L${DCX},${bot} L${BX},${midy} Z`}
            fill={C.decBg} stroke={C.decBorder} strokeWidth={1.5} />
          <SvgText x={DCX} y={midy + 4} fontSize={12} fill={C.decText}
            fontWeight="700" textAnchor="middle">{text}</SvgText>
        </>
      );
    }

    // Tight callout sizing: 3 lines × 12px line-height = 24px baseline-to-baseline
    // + ~8px cap height above first baseline + ~4px descender below last baseline
    // + 8px top padding + 8px bottom padding = 52px total
    const CALLOUT_LINE_H = 12;
    const CALLOUT_PAD = 8;
    function Callout(midY: number, lines: string[], bg: string, border: string, tc: string) {
      const n = lines.length;
      const textBlockH = (n - 1) * CALLOUT_LINE_H + 10; // baselines + ascender/descender
      const boxH = textBlockH + CALLOUT_PAD * 2;
      const top = midY - boxH / 2;
      const firstBaselineY = top + CALLOUT_PAD + 8; // 8 = approximate cap height
      return (
        <>
          <Rect x={CBX} y={top} width={CBW} height={boxH}
            rx={6} fill={bg} stroke={border} strokeWidth={1.5} />
          {lines.map((line, i) => (
            <SvgText key={i} x={CBX + CBW / 2} y={firstBaselineY + i * CALLOUT_LINE_H}
              fontSize={10} fill={tc} fontWeight="600" textAnchor="middle">{line}</SvgText>
          ))}
        </>
      );
    }

    function PedsNote() {
      const { top } = L.pedsNote;
      return (
        <>
          <Rect x={BX} y={top} width={BW} height={22}
            rx={4} fill={C.pedsBg} stroke={C.pedsBorder} strokeWidth={1.5} />
          <SvgText x={cx} y={top + 15} fontSize={11} fill={C.pedsDrug}
            fontWeight="800" textAnchor="middle">⚠  PEDIATRIC EXCEPTION — Age &lt; 8</SvgText>
          <Rect x={BX} y={top + 22} width={BW} height={PEDS_H - 22}
            rx={4} fill={C.pedsBg} stroke={C.pedsBorder} strokeWidth={1} />
          <SvgText x={cx} y={top + 38} fontSize={11} fill={C.pedsDose} textAnchor="middle">
            OPA + SGA only — NO endotracheal intubation
          </SvgText>
          <SvgText x={cx} y={top + 54} fontSize={11} fill={C.pedsDose} textAnchor="middle">
            without online medical direction
          </SvgText>
          <SvgText x={cx} y={top + 70} fontSize={11} fill={C.pedsDose} textAnchor="middle">
            Cricothyroidotomy: NEEDLE CRIC only (&lt; 8 yo)
          </SvgText>
        </>
      );
    }

    return (
      <Svg style={StyleSheet.absoluteFill} width={W}>
        <Defs>
          <Marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <Path d="M0,0 L8,3 L0,6 Z" fill={C.arrow} />
          </Marker>
        </Defs>

        {/* ── Title block ── */}
        <Rect x={BX} y={8} width={BW} height={44} rx={6}
          fill={C.emtBg} stroke={C.emtBorder} strokeWidth={1.5} />
        <SvgText x={cx} y={27} fontSize={15} fill={C.emtTitle}
          fontWeight="800" textAnchor="middle">AIRWAY MANAGEMENT</SvgText>
        <SvgText x={cx} y={43} fontSize={11} fill={C.emtSub} textAnchor="middle">
          Adult &amp; Pediatric — Red Book 2026
        </SvgText>

        {/* ── EMT bar (measured) — sits directly above step1, no arrow ── */}
        <Rect x={BX} y={L.emtBar.top} width={BW} height={20} rx={3} fill={C.secBg} />
        <SvgText x={cx} y={L.emtBar.top + 14}
          fontSize={11} fill={C.secText} fontWeight="700" textAnchor="middle">EMT</SvgText>

        {/* step1 → step2 */}
        <Arrow x1={cx} y1={L.step1.bot} x2={cx} y2={L.step2.top} />

        {/* step2 → dec1 — straight down to diamond top (DCX) */}
        <Arrow x1={DCX} y1={L.step2.bot} x2={DCX} y2={L.dec1.top} />

        {/* ── Decision 1 ── */}
        {Diamond('dec1', 'Respiratory Failure / Arrest?')}

        {/* dec1 YES — straight down from diamond bottom (DCX) */}
        <Arrow x1={DCX} y1={L.dec1.bot} x2={DCX} y2={L.step3.top} />
        <SvgText x={DCX + 14} y={(L.dec1.bot + L.step3.top) / 2 + 4}
          fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle">YES</SvgText>

        {/* dec1 NO — straight right to callout, horizontal arrow */}
        <Arrow x1={DXR} y1={d1mid} x2={CBX} y2={d1mid} label="NO" />
        {Callout(d1mid,
          ['Position of Comfort', 'Suction PRN', 'OPA / NPA Adjuncts'],
          C.emtBg, C.emtBorder, C.emtTitle)}

        {/* step3 → step4 — straight down from center */}
        <Arrow x1={cx} y1={L.step3.bot} x2={cx} y2={L.step4.top} />

        {/* step4 → paraBar — arrow terminates at bar top */}
        <Arrow x1={cx} y1={L.step4.bot} x2={cx} y2={L.paraBar.top} />

        {/* ── PARAMEDIC bar (measured) — sits directly above step5, no arrow ── */}
        <Rect x={BX} y={PARA_BAR_Y} width={BW} height={20} rx={3} fill={C.secBg} />
        <SvgText x={cx} y={PARA_BAR_Y + 14}
          fontSize={11} fill={C.secText} fontWeight="700" textAnchor="middle">PARAMEDIC</SvgText>

        {/* step5 → step6 */}
        <Arrow x1={cx} y1={L.step5.bot} x2={cx} y2={L.step6.top} />

        {/* step6 → dec2 — straight down to diamond top (DCX) */}
        <Arrow x1={DCX} y1={L.step6.bot} x2={DCX} y2={L.dec2.top} />

        {/* ── Decision 2 ── */}
        {Diamond('dec2', 'BVM / NIPPV Effective?')}

        {/* dec2 YES — straight right to callout */}
        <Arrow x1={DXR} y1={d2mid} x2={CBX} y2={d2mid} label="YES" />
        {Callout(d2mid,
          ['Continue & Monitor', 'EtCO₂, SpO₂', 'Vitals'],
          C.paraBg, C.paraBorder, C.paraTitle)}

        {/* dec2 NO — straight down from diamond bottom (DCX) */}
        <Arrow x1={DCX} y1={L.dec2.bot} x2={DCX} y2={L.step7.top} />
        <SvgText x={DCX + 14} y={(L.dec2.bot + L.step7.top) / 2 + 4}
          fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle">NO</SvgText>

        {/* step7 → step8 — straight down center */}
        <Arrow x1={cx} y1={L.step7.bot} x2={cx} y2={L.step8.top} />

        {/* step8 → pedsNote (connector line) */}
        <Line x1={cx} y1={L.step8.bot} x2={cx} y2={L.pedsNote.top}
          stroke={C.arrow} strokeWidth={1.5} />
        {PedsNote()}

        {/* pedsNote → step9 */}
        <Arrow x1={cx} y1={L.pedsNote.bot} x2={cx} y2={L.step9.top} />

        {/* step9 → step10 */}
        <Arrow x1={cx} y1={L.step9.bot} x2={cx} y2={L.step10.top} />

        {/* ── Footer ── */}
        <SvgText x={cx} y={L.step10.bot + 20}
          fontSize={10} fill={C.discText} textAnchor="middle">
          Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
        </SvgText>
        <SvgText x={cx} y={L.step10.bot + 36}
          fontSize={10} fill={C.discText} textAnchor="middle">
          Reference aid only — does not replace online medical direction or clinical judgment.
        </SvgText>
      </Svg>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={{ width: W, backgroundColor: C.bg }}>

      {/* Title spacer — SVG title block: y=8, h=44, ends at 52 */}
      <View style={{ height: 60 }} />

      {/* EMT bar — measured, drawn by SVG. Sits directly above STEP 1. */}
      <View onLayout={measure('emtBar')} style={{ height: 20, marginHorizontal: BX }} />

      {E('step1', 'STEP 1', 'Universal Care & Scene Assessment', [
        '• Initiate Universal Care',
        '• SpO₂ monitoring',
        '• Position (elevate HOB 30° when possible)',
        '• Suction airway PRN',
      ])}
      <View style={{ height: GAP }} />

      {E('step2', 'STEP 2', 'Identify Need for Airway Management', [
        'INCLUDES:',
        '• Severe respiratory distress or respiratory failure',
        '• Evidence of hypoxemia or hypoventilation',
        'EXCLUDES: tracheostomy, chronically vented, newborns',
        'Suspected highly infectious illness → see separate protocol',
      ])}
      <View style={{ height: GAP }} />

      {/* ── Decision 1: diamond spacer (measured inline) ── */}
      <View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />
      {/* callout1 spacer stacks directly below — SVG pins it to diamond mid Y */}
      <View onLayout={measure('callout1')} style={{ height: 4 }} />
      <View style={{ height: GAP }} />

      {E('step3', 'STEP 3', 'BVM Ventilation', [
        '• BVM with appropriate-sized mask',
        '• Add OPA or NPA to facilitate BVM seal',
        '• Avoid excessive pressures / volumes',
        '• Rate: 10 breaths/min',
        '• Target SpO₂ ≥ 94%',
      ])}
      <View style={{ height: GAP }} />

      {E('step4', 'STEP 4', 'Supplemental Oxygen', [
        '• Apply O₂ to maintain SpO₂ ≥ 94%',
        '• NC, simple mask, or non-rebreather as indicated',
      ])}
      <View style={{ height: GAP }} />

      {/* PARAMEDIC bar — measured, drawn by SVG. Sits directly above STEP 5. */}
      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />

      {P('step5', 'STEP 5', 'NIPPV (Non-Invasive Positive Pressure Ventilation)', [
        '• CPAP or B-PAP for severe respiratory distress or',
        '  impending resp failure WITHOUT decreased LOC',
        '• Discontinue if: shock develops, LOC decreases',
        '• Use pharmacologic management as indicated',
      ])}
      <View style={{ height: GAP }} />

      {P('step6', 'STEP 6', 'Advanced Monitoring & Airway Confirmation', [
        '• Initiate waveform capnography (EtCO₂)',
        '• Confirm ALL advanced airway placement with EtCO₂',
        '  — remove & place alternate if unable to confirm',
        '• Continuous cardiac monitoring',
        '• OG tube for gastric decompression with advanced airways',
      ])}
      <View style={{ height: GAP }} />

      {/* ── Decision 2: diamond spacer (measured inline) ── */}
      <View onLayout={measure('dec2')} style={{ height: 72, marginHorizontal: BX }} />
      {/* callout2 spacer stacks directly below — SVG pins it to diamond mid Y */}
      <View onLayout={measure('callout2')} style={{ height: 4 }} />
      <View style={{ height: GAP }} />

      {P('step7', 'STEP 7', 'Supraglottic Airway (SGA)', [
        '• Place SGA when BVM or NIPPV not effective',
        '• Confirm placement with waveform capnography',
      ])}
      <View style={{ height: GAP }} />

      {P('step8', 'STEP 8', 'Endotracheal Intubation (Age ≥ 8)', [
        '• ONLY when less invasive methods fail',
        '• Cuffed ETT — secure with commercial holder or tape',
        '• Max 2 attempts — ventilate between attempts',
        '• Confirm placement with waveform EtCO₂',
        '  — remove & use alternate if unable to confirm',
        '• Monitor EtCO₂ continuously to prevent hyper/hypoventilation',
      ])}

      {/* Peds note block — extra top gap for breathing room */}
      <View onLayout={measure('pedsNote')}
        style={{ height: PEDS_H, marginHorizontal: BX, marginTop: GAP * 1.5 }} />

      {/* Extra gap between peds note and step9 */}
      <View style={{ height: GAP }} />

      {K('step9', 'STEP 9', 'Cricothyroidotomy (Cannot Oxygenate / Ventilate)', [
        '• When unable to oxygenate/ventilate with above interventions',
        '  AND risk of death > risk of procedural complication',
        '• Age ≥ 8 → Surgical cricothyroidotomy',
        '• Age < 8 → NEEDLE cricothyroidotomy ONLY',
      ])}
      <View style={{ height: GAP }} />

      {P('step10', 'STEP 10', 'Post-Advanced Airway Care', [
        '• OG tube for gastric decompression',
        '• Repeat vital signs post-intubation',
        '• If SBP < 100 → IV/IO fluid bolus before additional meds',
        '• Assess comfort during transport (lower doses if suspected TBI)',
        '• Document EtCO₂ reading at hospital transfer of care',
      ])}

      <View style={{ height: 56 }} />
      {renderSVG()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
