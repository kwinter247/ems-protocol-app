import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Polygon,
  G,
} from 'react-native-svg';

// ── Canvas width constants (horizontal layout only) ────────────
const W   = 470;
const cx  = W / 2;           // 270
const BW  = 440;
const BX  = cx - BW / 2;    // 75   left edge of main boxes
const BR  = BX + BW;        // 465  right edge of main boxes
const DW  = 240;             //      diamond width
const DCX = BX + DW / 2;    // 195  diamond center X
const CBW = 110;             //      callout box width
const CBX = BR - CBW;       //      callout box left edge

// ── Vertical spacing ───────────────────────────────────────────
const GAP  = 24;  // gap between every element (step → diamond, diamond → step, etc.)
const STEP_PADDING_V = 10; // paddingVertical on step boxes — must match styles.stepCenter

// ── Colour tokens ──────────────────────────────────────────────
const C = {
  bg:         '#0d1117',
  emtBg:      '#21262d',
  emtBorder:  '#484f58',
  emtTitle:   '#e6edf3',
  emtSub:     '#8b949e',
  paraBg:     '#1b3a2d',
  paraBorder: '#0F6E56',
  paraTitle:  '#56d364',
  paraSub:    '#8fcca0',
  critBg:     '#2a1a0a',
  critBorder: '#f0883e',
  critTitle:  '#f0883e',
  decBg:      '#1f3a5f',
  decBorder:  '#185FA5',
  decText:    '#79c0ff',
  destBg:     '#3a1010',
  destBorder: '#d62828',
  destText:   '#f85149',
  pregBg:     '#2a1020',
  pregBorder: '#993556',
  pregText:   '#f9a8d4',
  adultBg:    '#1c1208',
  adultBorder:'#9e6a03',
  adultDrug:  '#f0883e',
  adultDose:  '#d29922',
  pedsBg:     '#0a1a2a',
  pedsBorder: '#1f6feb',
  pedsDrug:   '#58a6ff',
  pedsDose:   '#a5d6ff',
  secBg:      '#161b22',
  secText:    '#6e7681',
  arrow:      '#6e7681',
  label:      '#8b949e',
  muted:      '#6e7681',
  inclBg:     '#1c2128',
  inclBorder: '#8b949e',
  inclText:   '#c9d1d9',
  discText:   '#6e7681',
};

// ── Measured layout for a single element ──────────────────────
interface Measured { y: number; height: number }

// ── SVG shape helpers ──────────────────────────────────────────

function Diamond({ cx: dcx, cy: dcy, w, h, fill, stroke, lines, textColor, fontSize = 12 }:
  { cx: number; cy: number; w: number; h: number; fill: string; stroke: string; lines: string[]; textColor: string; fontSize?: number }) {
  const hw = w / 2; const hh = h / 2;
  const pts = `${dcx},${dcy - hh} ${dcx + hw},${dcy} ${dcx},${dcy + hh} ${dcx - hw},${dcy}`;
  const lh = fontSize * 1.5;
  const totalTextH = (lines.length - 1) * lh;
  const firstLineY = dcy - totalTextH / 2 + fontSize * 0.35;
  return (
    <G>
      <Polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.map((l, i) => (
        <SvgText key={i} x={dcx} y={firstLineY + i * lh} textAnchor="middle"
          fontSize={fontSize} fill={textColor} fontWeight="700">{l}</SvgText>
      ))}
    </G>
  );
}

function Arrow({ x1, y1, x2, y2, label, labelSide = 'right' }:
  { x1: number; y1: number; x2: number; y2: number; label?: string; labelSide?: 'left' | 'right' }) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len; const uy = dy / len;
  const ax1 = x2 - ux * 10 - uy * 5;
  const ay1 = y2 - uy * 10 + ux * 5;
  const ax2 = x2 - ux * 10 + uy * 5;
  const ay2 = y2 - uy * 10 - ux * 5;
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  const offX = labelSide === 'left' ? -8 : 0;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.arrow} strokeWidth={1.5} />
      <Polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={C.arrow} />
      {label && (
        <SvgText x={mx + offX} y={my - 10} fontSize={11} fill={C.label}
          fontWeight="700" textAnchor="middle">{label}</SvgText>
      )}
    </G>
  );
}

function SvgBox({ x, y, w, h, fill, stroke, rx = 8 }:
  { x: number; y: number; w: number; h: number; fill: string; stroke: string; rx?: number }) {
  return <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={rx} />;
}

function SectionHeader({ x, y, w, text, color = C.secText }: { x: number; y: number; w: number; text: string; color?: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={24} fill={C.secBg} rx={4} />
      <SvgText x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={13}
        fill={color} fontWeight="700" letterSpacing={1.2}>{text.toUpperCase()}</SvgText>
    </G>
  );
}

function HRule({ x, y, w }: { x: number; y: number; w: number }) {
  return <Line x1={x} y1={y} x2={x + w} y2={y} stroke={'#30363d'} strokeWidth={1} />;
}

// ── RN component helpers ───────────────────────────────────────

interface StepBoxProps {
  fill: string; stroke: string;
  stepLabel: string; title: string; subtitle?: string;
  titleColor: string; subtitleColor: string;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
  subtitleFontSize?: number;
  titleFontSize?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}

function StepBox({
  fill, stroke, stepLabel, title, subtitle,
  titleColor, subtitleColor, badge, badgeColor, badgeBg, badgeBorder,
  subtitleFontSize = 14, titleFontSize = 16, onLayout,
}: StepBoxProps) {
  return (
    <View
      onLayout={onLayout}
      style={[styles.stepBox, { backgroundColor: fill, borderColor: stroke, marginLeft: BX, width: BW }]}
    >
      <View style={[styles.stepContent, { paddingRight: badge ? 60 : 16 }]}>
        <Text style={{ color: subtitleColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 }}>
          {stepLabel}
        </Text>
        <Text style={{ color: titleColor, fontSize: titleFontSize, fontWeight: '800' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: subtitleColor, fontSize: subtitleFontSize, fontWeight: '400', marginTop: 3 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeBg ?? '#161b22', borderColor: badgeBorder ?? '#484f58' }]}>
          <Text style={{ color: badgeColor ?? '#8b949e', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// Spacer for section header + benzo block (unused placeholder — benzo uses inline View)


// ── Main component ─────────────────────────────────────────────
export default function SeizureFlowchart() {
  // We measure Y positions of key RN elements so the SVG layer
  // can draw arrows and diamonds at the correct coordinates.
  const [m, setM] = useState<Record<string, Measured>>({});
  const [totalH, setTotalH] = useState(2000);

  const measure = useCallback((key: string) => (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setM(prev => ({ ...prev, [key]: { y, height } }));
  }, []);

  // Diamond dimensions
  const DIA1_H = 100; // BGL < 60?
  const DIA2_H = 120; // Pregnant?
  const DIA3_H = 100; // Seizure stopped? (post benzo)
  const DIA4_H = 100; // Seizure stopped? (post repeat)

  // Benzo block heights (fixed SVG content)
  const SEC_HDR_H    = 24;
  const BENZO_HDR_H  = 40;
  const BENZO_COL_H  = 195;
  const BENZO_TOTAL  = SEC_HDR_H + 4 + BENZO_HDR_H + 4 + BENZO_COL_H;

  // Title + inclusion block heights
  const TITLE_H = 60;
  const INCL_H  = 72;
  const PREG_H  = 80;
  const DISC_H  = 60;

  const colW = BW / 2 - 5;

  // ── Derive SVG coordinates from measurements ─────────────────
  // Helper: bottom edge of a measured element
  const bot = (key: string) => (m[key]?.y ?? 0) + (m[key]?.height ?? 0);

  // Diamond centers: halfway between bottom of previous element and top of next
  // We position diamonds in SVG at fixed offsets below the RN spacers,
  // so they sit in the middle of their reserved spacer height.
  const diaCenter = (spacerKey: string, diaH: number) =>
    (m[spacerKey]?.y ?? 0) + GAP + diaH / 2;

  // Benzo block start Y
  const benzoY = (spacerKey: string) => (m[spacerKey]?.y ?? 0);

  // Side callout box positions (vertically centered on their diamond)
  const sideBoxY = (spacerKey: string, diaH: number, boxH: number) =>
    diaCenter(spacerKey, diaH) - boxH / 2;

  // SVG total height = container height
  const svgH = totalH;

  // Are all key measurements ready?
  const ready = ['step1','step2','spacer1','step3','spacer2','benzospace',
    'spacer3','step5','spacer4','step6','step7','pregnote','disc']
    .every(k => m[k]);

  // ── Y positions derived from measurements ────────────────────
  const Y_TITLE   = 38;
  const Y_INCL    = TITLE_H;

  // Step 1 top
  const Y_STEP1   = ready ? m['step1']?.y ?? 0 : 0;
  // Step 2 top
  const Y_STEP2   = ready ? m['step2']?.y ?? 0 : 0;

  // Diamond 1: BGL
  const Y_DIA1    = ready ? diaCenter('spacer1', DIA1_H) : 0;
  const Y_STEP3   = ready ? m['step3']?.y ?? 0 : 0;
  const Y_DIA2    = ready ? diaCenter('spacer2', DIA2_H) : 0;

  // Benzo block
  const Y_BENZO   = ready ? benzoY('benzospace') : 0;
  const Y_SECHDR  = Y_BENZO;
  const Y_BENZOHDR    = Y_SECHDR + SEC_HDR_H + 4;
  const Y_BENZOCOLS   = Y_BENZOHDR + BENZO_HDR_H + 4;
  const Y_BENZOBOTTOM = Y_BENZOCOLS + BENZO_COL_H;

  // Diamond 3: Seizure stopped? (post benzo)
  const Y_DIA3    = ready ? diaCenter('spacer3', DIA3_H) : 0;
  const Y_STEP5   = ready ? m['step5']?.y ?? 0 : 0;
  const Y_DIA4    = ready ? diaCenter('spacer4', DIA4_H) : 0;
  const Y_STEP6   = ready ? m['step6']?.y ?? 0 : 0;
  const Y_STEP6_H = ready ? m['step6']?.height ?? 0 : 0;
  const Y_STEP7   = ready ? m['step7']?.y ?? 0 : 0;
  const Y_STEP7_H = ready ? m['step7']?.height ?? 0 : 0;
  const Y_PREGNOTE = ready ? m['pregnote']?.y ?? 0 : 0;
  const Y_DISC    = ready ? m['disc']?.y ?? 0 : 0;

  // Side callout boxes
  const Y_HYPO_BOX     = ready ? sideBoxY('spacer1', DIA1_H, 56)  : 0;
  const Y_MAG_BOX      = ready ? sideBoxY('spacer2', DIA2_H, 88)  : 0;
  const Y_POSTICTAL_BOX = ready ? sideBoxY('spacer3', DIA3_H, 46) : 0;
  const Y_MEDDIR_BOX   = ready ? sideBoxY('spacer4', DIA4_H, 46)  : 0;

  return (
    <View
      style={{ width: W }}
      onLayout={e => setTotalH(e.nativeEvent.layout.height)}
    >
      {/* ── SVG OVERLAY (absoluteFill) ── */}
      {svgH > 0 && (
        <Svg
          width={W} height={svgH}
          viewBox={`0 0 ${W} ${svgH}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {/* Background */}
          <Rect x={0} y={0} width={W} height={svgH} fill={C.bg} />

          {/* Title */}
          <SvgText x={cx} y={Y_TITLE} textAnchor="middle" fontSize={20} fill={'#e6edf3'} fontWeight="800">
            Seizure Protocol
          </SvgText>
          <SvgText x={cx} y={Y_TITLE + 20} textAnchor="middle" fontSize={11} fill={C.muted}>
            Central Arizona Red Book 2026 · Adult &amp; Pediatric
          </SvgText>

          {/* Inclusion box shape */}
          <SvgBox x={BX} y={Y_INCL} w={BW} h={INCL_H} fill={C.inclBg} stroke={C.inclBorder} />

          {ready && (
            <G>
              {/* Arrow: incl → step1 */}
              <Arrow x1={cx} y1={Y_INCL + INCL_H} x2={cx} y2={Y_STEP1} />

              {/* Arrow: step1 → step2 */}
              <Arrow x1={cx} y1={bot('step1')} x2={cx} y2={Y_STEP2} />

              {/* Arrow: step2 → diamond1 */}
              <Arrow x1={DCX} y1={bot('step2')} x2={DCX} y2={Y_DIA1 - DIA1_H / 2} />

              {/* Diamond 1: BGL */}
              <Diamond cx={DCX} cy={Y_DIA1} w={DW} h={DIA1_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['BGL < 60 mg/dL?']} textColor={C.decText} fontSize={14} />

              {/* YES branch → Hypo */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA1} x2={CBX} y2={Y_DIA1} label="YES" labelSide="left" />
              <SvgBox x={CBX} y={Y_HYPO_BOX} w={CBW} h={56} fill={C.destBg} stroke={C.destBorder} />

              {/* NO branch → step3 */}
              <Arrow x1={DCX} y1={Y_DIA1 + DIA1_H / 2} x2={DCX} y2={Y_STEP3} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA1 + DIA1_H / 2 + Y_STEP3) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >NO</SvgText>

              {/* Arrow: step3 → diamond2 */}
              <Arrow x1={DCX} y1={bot('step3')} x2={DCX} y2={Y_DIA2 - DIA2_H / 2} />

              {/* Diamond 2: Pregnant? */}
              <Diamond cx={DCX} cy={Y_DIA2} w={DW} h={DIA2_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['Pregnant > 20 wk', 'or postpartum < 6 wk?']} textColor={C.decText} fontSize={13} />

              {/* YES branch → Mag */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA2} x2={CBX} y2={Y_DIA2} label="YES" labelSide="left" />
              <SvgBox x={CBX} y={Y_MAG_BOX} w={CBW} h={88} fill={C.destBg} stroke={C.destBorder} />

              {/* NO branch → benzo section */}
              <Arrow x1={DCX} y1={Y_DIA2 + DIA2_H / 2} x2={DCX} y2={Y_SECHDR} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA2 + DIA2_H / 2 + Y_SECHDR) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >NO</SvgText>

              {/* Step 4: benzo section header + header bar */}
              <SectionHeader x={BX} y={Y_SECHDR} w={BW} text="Step 4 · Administer Benzodiazepine · Paramedic" color={C.critTitle} />
              <Rect x={BX} y={Y_BENZOHDR} width={BW} height={BENZO_HDR_H}
                fill={C.critBg} stroke={C.critBorder} strokeWidth={1.5} rx={8} />
              <SvgText x={cx} y={Y_BENZOHDR + 26} textAnchor="middle" fontSize={18}
                fill={C.critTitle} fontWeight="800">Administer Benzodiazepine</SvgText>

              {/* Benzo columns */}
              <Rect x={BX} y={Y_BENZOCOLS} width={colW} height={BENZO_COL_H}
                fill={C.adultBg} stroke={C.adultBorder} strokeWidth={1.5} rx={8} />
              <Rect x={BX + colW + 10} y={Y_BENZOCOLS} width={colW} height={BENZO_COL_H}
                fill={C.pedsBg} stroke={C.pedsBorder} strokeWidth={1.5} rx={8} />

              {/* Adult column text */}
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 22} textAnchor="middle" fontSize={13} fill={C.adultDrug} fontWeight="800">ADULT (age ≥ 15)</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 44} textAnchor="middle" fontSize={13} fill={C.adultDrug} fontWeight="700">Midazolam</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 60} textAnchor="middle" fontSize={14} fill={C.adultDose}>IM / IN: 0.2 mg/kg</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 75} textAnchor="middle" fontSize={14} fill={C.adultDose}>max 10 mg</SvgText>
              <HRule x={BX + 10} y={Y_BENZOCOLS + 88} w={colW - 20} />
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 104} textAnchor="middle" fontSize={13} fill={C.adultDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 120} textAnchor="middle" fontSize={14} fill={C.adultDose}>IV / IO: 0.1 mg/kg</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 135} textAnchor="middle" fontSize={14} fill={C.adultDose}>max 4 mg</SvgText>
              <HRule x={BX + 10} y={Y_BENZOCOLS + 148} w={colW - 20} />
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 164} textAnchor="middle" fontSize={11} fill={'#d29922'} fontWeight="600">Age &gt; 60: reduce dose by half</SvgText>
              <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 180} textAnchor="middle" fontSize={14} fill={C.adultDose}>Slow over 2 min via IV/IO</SvgText>

              {/* Peds column text */}
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 22} textAnchor="middle" fontSize={13} fill={C.pedsDrug} fontWeight="800">PEDIATRIC (age &lt; 15)</SvgText>
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 44} textAnchor="middle" fontSize={13} fill={C.pedsDrug} fontWeight="700">Midazolam</SvgText>
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 60} textAnchor="middle" fontSize={14} fill={C.pedsDose}>IM / IN: 0.2 mg/kg</SvgText>
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 75} textAnchor="middle" fontSize={14} fill={C.pedsDose}>max 10 mg</SvgText>
              <HRule x={BX + colW + 10 + 10} y={Y_BENZOCOLS + 88} w={colW - 20} />
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 104} textAnchor="middle" fontSize={13} fill={C.pedsDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 120} textAnchor="middle" fontSize={14} fill={C.pedsDose}>IV / IO: 0.1 mg/kg</SvgText>
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 135} textAnchor="middle" fontSize={14} fill={C.pedsDose}>max 4 mg</SvgText>
              <HRule x={BX + colW + 10 + 10} y={Y_BENZOCOLS + 148} w={colW - 20} />
              <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 164} textAnchor="middle" fontSize={11} fill={C.pedsDose} fontWeight="600">Slow over 2 min via IV/IO</SvgText>

              {/* Arrow: benzo bottom → diamond3 */}
              <Arrow x1={DCX} y1={Y_BENZOBOTTOM} x2={DCX} y2={Y_DIA3 - DIA3_H / 2} />

              {/* Diamond 3: Seizure stopped? (post benzo) */}
              <Diamond cx={DCX} cy={Y_DIA3} w={DW} h={DIA3_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

              {/* YES → postictal callout */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA3} x2={CBX} y2={Y_DIA3} label="YES" labelSide="left" />
              <SvgBox x={CBX} y={Y_POSTICTAL_BOX} w={CBW} h={46} fill={C.paraBg} stroke={C.paraBorder} />

              {/* NO → step5 */}
              <Arrow x1={DCX} y1={Y_DIA3 + DIA3_H / 2} x2={DCX} y2={Y_STEP5} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA3 + DIA3_H / 2 + Y_STEP5) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >NO</SvgText>

              {/* Arrow: step5 → diamond4 */}
              <Arrow x1={DCX} y1={bot('step5')} x2={DCX} y2={Y_DIA4 - DIA4_H / 2} />

              {/* Diamond 4: Seizure stopped? (post repeat) */}
              <Diamond cx={DCX} cy={Y_DIA4} w={DW} h={DIA4_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

              {/* NO → medical direction callout */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA4} x2={CBX} y2={Y_DIA4} label="NO" labelSide="left" />
              <SvgBox x={CBX} y={Y_MEDDIR_BOX} w={CBW} h={46} fill={C.destBg} stroke={C.destBorder} />

              {/* YES → step6 */}
              <Arrow x1={DCX} y1={Y_DIA4 + DIA4_H / 2} x2={DCX} y2={Y_STEP6} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA4 + DIA4_H / 2 + Y_STEP6) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >YES</SvgText>

              {/* Arrow: step6 → step7 */}
              <Arrow x1={cx} y1={Y_STEP6 + Y_STEP6_H} x2={cx} y2={Y_STEP7} />

              {/* Arrow: step7 → pregnancy note */}
              <Arrow x1={cx} y1={Y_STEP7 + Y_STEP7_H} x2={cx} y2={Y_PREGNOTE} />

              {/* Pregnancy note shape */}
              <SvgBox x={BX} y={Y_PREGNOTE} w={BW} h={PREG_H} fill={C.pregBg} stroke={C.pregBorder} />

              {/* Disclaimer */}
              <Rect x={BX} y={Y_DISC} width={BW} height={1} fill={C.muted} />
              <SvgText x={cx} y={Y_DISC + 18} textAnchor="middle" fontSize={10} fill={C.discText}>
                Reference aid only — not a substitute for clinical judgment or online medical direction
              </SvgText>
              <SvgText x={cx} y={Y_DISC + 34} textAnchor="middle" fontSize={10} fill={C.discText}>
                Central AZ Red Book 2026 p.23
              </SvgText>
            </G>
          )}
        </Svg>
      )}

      {/* ── RN LAYOUT COLUMN ── */}
      {/* This column drives all vertical layout. The SVG reads onLayout measurements. */}

      {/* Title spacer */}
      <View style={{ height: TITLE_H }} />

      {/* Inclusion box text */}
      <View style={[styles.inclBox, { marginLeft: BX, width: BW, height: INCL_H }]}>
        <View style={styles.boxCenter}>
          <Text style={[styles.inclText, { fontWeight: '700' }]}>INCLUDES:</Text>
          <Text style={styles.inclText}>Ongoing seizure on arrival · Seizure &gt; 5 min</Text>
          <Text style={styles.inclText}>&gt; 2 seizures/hr without recovery (Status Epilepticus)</Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* Step 1 */}
      <StepBox
        onLayout={measure('step1')}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="STEP 1"
        title="Initiate Universal Care"
        subtitle="Airway support · AVPU/GCS · O₂ as needed"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={10}
      />

      <View style={{ height: GAP }} />

      {/* Step 2 */}
      <StepBox
        onLayout={measure('step2')}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="STEP 2"
        title="Check Blood Glucose"
        subtitle="Fingerstick BGL · If pregnant → left lateral recumbent"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={10}
      />

      {/* Diamond 1 spacer (BGL < 60?) */}
      <DiamondSpacer onLayout={measure('spacer1')} h={DIA1_H} />

      {/* Step 3 */}
      <StepBox
        onLayout={measure('step3')}
        fill={C.paraBg} stroke={C.paraBorder}
        stepLabel="STEP 3"
        title={"IV/IO Access\n+ Cardiac & EtCO₂ Monitoring"}
        subtitle="Establish access · Continuous monitoring"
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder}
        subtitleFontSize={12}
      />

      {/* Diamond 2 spacer (Pregnant?) */}
      <DiamondSpacer onLayout={measure('spacer2')} h={DIA2_H} />

      {/* Benzo section spacer */}
      <View onLayout={measure('benzospace')} style={{ height: BENZO_TOTAL }} />

      {/* Diamond 3 spacer (Seizure stopped? post-benzo) */}
      <DiamondSpacer onLayout={measure('spacer3')} h={DIA3_H} />

      {/* Step 5 */}
      <StepBox
        onLayout={measure('step5')}
        fill={C.critBg} stroke={C.critBorder}
        stepLabel="STEP 5"
        title={"Repeat Benzodiazepine\n1 repeat dose max"}
        subtitle={"Same drug and dose · Max 2 total doses\nKetamine NOT indicated postictal"}
        titleColor={C.critTitle} subtitleColor={'#e6b87a'}
        badge="PARAMEDIC" badgeColor={C.critTitle} badgeBg="rgba(42,26,10,0.4)" badgeBorder={C.critBorder}
        titleFontSize={17} subtitleFontSize={11}
      />

      {/* Diamond 4 spacer (Seizure stopped? post-repeat) */}
      <DiamondSpacer onLayout={measure('spacer4')} h={DIA4_H} />

      {/* Step 6 */}
      <StepBox
        onLayout={measure('step6')}
        fill={C.paraBg} stroke={C.paraBorder}
        stepLabel="STEP 6"
        title="Postictal Care"
        subtitle={"Maintain airway · positioning · continuous monitoring\nIf agitation: refer to Agitated/Violent Patient protocol\nKetamine NOT indicated postictal"}
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder}
        subtitleFontSize={11}
      />

      <View style={{ height: GAP }} />

      {/* Step 7 */}
      <StepBox
        onLayout={measure('step7')}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="STEP 7"
        title="Transport"
        subtitle="Notify Receiving Facility · ALS intercept if not on scene"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="ALL PROVIDERS" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={11}
      />

      <View style={{ height: GAP }} />

      {/* Pregnancy note */}
      <View onLayout={measure('pregnote')}
        style={[styles.inclBox, { marginLeft: BX, width: BW, height: PREG_H, borderColor: C.pregBorder, backgroundColor: C.pregBg }]}>
        <View style={styles.boxCenter}>
          <Text style={{ color: C.pregText, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>⚠  PREGNANCY NOTE</Text>
          <Text style={{ color: C.pregText, fontSize: 12, textAlign: 'center' }}>Mag sulfate is first-line for eclamptic seizure</Text>
          <Text style={{ color: C.pregText, fontSize: 12, textAlign: 'center' }}>If etiology unclear: may give benzo simultaneously with mag</Text>
        </View>
      </View>

      <View style={{ height: 20 }} />

      {/* Disclaimer spacer (SVG draws the actual text) */}
      <View onLayout={measure('disc')} style={{ height: DISC_H }} />

      {/* ── ABSOLUTE RN TEXT OVERLAYS FOR SIDE CALLOUT BOXES ── */}
      {/* These render after measurements are ready so top positions are correct */}
      {ready && (
        <>
          {/* Hypo callout */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_HYPO_BOX, width: CBW, height: 56 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>Hypoglycemia</Text>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>protocol</Text>
            </View>
          </View>

          {/* Mag sulfate callout */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_MAG_BOX, width: CBW, height: 88 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>Mag Sulfate</Text>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>4 g IV/IO</Text>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>20 min slow push</Text>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>→ OB protocol</Text>
            </View>
          </View>

          {/* Postictal callout */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_POSTICTAL_BOX, width: CBW, height: 46 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.paraTitle, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>Postictal</Text>
              <Text style={{ color: C.paraTitle, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>→ Step 6</Text>
            </View>
          </View>

          {/* Medical Direction callout */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_MEDDIR_BOX, width: CBW, height: 46 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 12, fontWeight: '500', textAlign: 'center' }}>Medical Direction</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  stepBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    position: 'relative',
  },
  stepContent: {
    paddingVertical: STEP_PADDING_V,
    paddingLeft: 16,
  },
  badge: {
    position: 'absolute',
    right: 8,
    top: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inclBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    borderColor: C.inclBorder,
    backgroundColor: C.inclBg,
  },
  boxCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  inclText: {
    color: C.inclText,
    fontSize: 12,
    textAlign: 'center',
  },
});

// ── DiamondSpacer with onLayout ─────────────────────────────────
// Defined here because it needs styles and GAP constant
function DiamondSpacer({ h, onLayout }: { h: number; onLayout?: (e: LayoutChangeEvent) => void }) {
  return <View onLayout={onLayout} style={{ height: h + GAP * 2 }} />;
}
