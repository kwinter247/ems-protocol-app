import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Polygon,
  G,
} from 'react-native-svg';

const W = 700;
const H = 3800;
const cx = W / 2;         // 350
const BW = 480;
const BX = cx - BW / 2;   // 110
const BR = BX + BW;        // 590  right edge of main boxes
const CBX = BR + 6;        // 596  callout box left edge
const CBW = 98;            //      callout box width (right edge 694)
const DW = BW;             // 480  diamond width matches box width
const STEP_H = 100;

// ── Colour tokens ──────────────────────────────────────────────
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
  decBg: '#1f3a5f',
  decBorder: '#185FA5',
  decText: '#79c0ff',
  destBg: '#3a1010',
  destBorder: '#d62828',
  destText: '#f85149',
  pregBg: '#2a1020',
  pregBorder: '#993556',
  pregText: '#f9a8d4',
  adultBg: '#1c1208',
  adultBorder: '#9e6a03',
  adultDrug: '#f0883e',
  adultDose: '#d29922',
  pedsBg: '#0a1a2a',
  pedsBorder: '#1f6feb',
  pedsDrug: '#58a6ff',
  pedsDose: '#a5d6ff',
  secBg: '#161b22',
  secText: '#6e7681',
  arrow: '#6e7681',
  label: '#8b949e',
  muted: '#6e7681',
  inclBg: '#1c2128',
  inclBorder: '#8b949e',
  inclText: '#c9d1d9',
  discText: '#6e7681',
};

// ── SVG-only shape helpers ─────────────────────────────────────

interface BoxShapeProps {
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string; rx?: number;
  badgeBg?: string; badgeBorder?: string; badgeW?: number;
}

function Box({ x, y, w, h, fill, stroke, rx = 8, badgeBg, badgeBorder, badgeW }: BoxShapeProps) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={rx} />
      {badgeW !== undefined && (
        <Rect x={x + w - badgeW - 6} y={y + 7} width={badgeW} height={19}
          fill={badgeBg ?? '#161b22'} stroke={badgeBorder ?? '#484f58'} strokeWidth={1} rx={4} />
      )}
    </G>
  );
}

interface StepBoxShapeProps {
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string;
  badgeBg?: string; badgeBorder?: string;
  hasBadge?: boolean;
}

function StepBox({ x, y, w, h, fill, stroke, badgeBg, badgeBorder, hasBadge }: StepBoxShapeProps) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={10} />
      {hasBadge && (
        <Rect x={x + w - 112} y={y + 8} width={104} height={19}
          fill={badgeBg ?? '#161b22'} stroke={badgeBorder ?? '#484f58'} strokeWidth={1} rx={4} />
      )}
    </G>
  );
}

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
        <SvgText key={i} x={dcx} y={firstLineY + i * lh} textAnchor="middle" fontSize={fontSize} fill={textColor} fontWeight="700">
          {l}
        </SvgText>
      ))}
    </G>
  );
}

function Arrow({ x1, y1, x2, y2, label, labelSide = 'right' }: { x1: number; y1: number; x2: number; y2: number; label?: string; labelSide?: 'left' | 'right' }) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len; const uy = dy / len;
  const ax1 = x2 - ux * 10 - uy * 5;
  const ay1 = y2 - uy * 10 + ux * 5;
  const ax2 = x2 - ux * 10 + uy * 5;
  const ay2 = y2 - uy * 10 - ux * 5;
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  const off = labelSide === 'left' ? -8 : 8;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.arrow} strokeWidth={1.5} />
      <Polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={C.arrow} />
      {label && (
        <SvgText x={mx + off} y={my + 4} fontSize={11} fill={C.label} fontWeight="700" textAnchor={labelSide === 'left' ? 'end' : 'start'}>
          {label}
        </SvgText>
      )}
    </G>
  );
}

function SectionHeader({ x, y, w, text }: { x: number; y: number; w: number; text: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={24} fill={C.secBg} rx={4} />
      <SvgText x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={10} fill={C.secText} fontWeight="700" letterSpacing={1.2}>
        {text.toUpperCase()}
      </SvgText>
    </G>
  );
}

function HRule({ x, y, w }: { x: number; y: number; w: number }) {
  return <Line x1={x} y1={y} x2={x + w} y2={y} stroke={'#30363d'} strokeWidth={1} />;
}

// ── RN text overlay helpers ────────────────────────────────────

interface BoxLabelProps {
  x: number; y: number; w: number; h: number;
  lines: string[]; textColor: string; fontSize?: number;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
}

function BoxLabel({ x, y, w, h, lines, textColor, fontSize = 14, badge, badgeColor, badgeBg, badgeBorder }: BoxLabelProps) {
  return (
    <View pointerEvents="none" style={[styles.abs, { left: x, top: y, width: w, height: h }]}>
      <View style={styles.boxCenter}>
        {lines.map((line, i) => (
          <Text key={i} style={{ color: textColor, fontSize, fontWeight: '500', textAlign: 'center' }}>
            {line}
          </Text>
        ))}
      </View>
      {badge && (
        <View style={[styles.badgeAbs, {
          backgroundColor: badgeBg ?? '#161b22',
          borderColor: badgeBorder ?? '#484f58',
        }]}>
          <Text style={{ color: badgeColor ?? '#8b949e', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

interface StepBoxLabelProps {
  x: number; y: number; w: number; h: number;
  stepLabel: string; title: string; subtitle?: string;
  titleColor: string; subtitleColor: string;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
}

function StepBoxLabel({ x, y, w, h, stepLabel, title, subtitle, titleColor, subtitleColor, badge, badgeColor, badgeBg, badgeBorder }: StepBoxLabelProps) {
  return (
    <View pointerEvents="none" style={[styles.abs, { left: x, top: y, width: w, height: h }]}>
      <View style={[styles.stepCenter, { paddingRight: badge ? 120 : 16 }]}>
        <Text style={{ color: subtitleColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 }}>
          {stepLabel}
        </Text>
        <Text style={{ color: titleColor, fontSize: 16, fontWeight: '800' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: subtitleColor, fontSize: 13, fontWeight: '400', marginTop: 3 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge && (
        <View style={[styles.badgeAbs, {
          backgroundColor: badgeBg ?? '#161b22',
          borderColor: badgeBorder ?? '#484f58',
        }]}>
          <Text style={{ color: badgeColor ?? '#8b949e', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// ── Layout constants ───────────────────────────────────────────
// All Y positions calculated from top down, accounting for STEP_H = 100

const Y_TITLE        = 38;
const Y_INCL         = 72;
const INCL_H         = 72;
const Y_STEP1        = Y_INCL + INCL_H + 24;       // 168
const Y_STEP2        = Y_STEP1 + STEP_H + 24;       // 292
const Y_DIA1         = Y_STEP2 + STEP_H + 30 + 50;  // 472  (BGL diamond cy)
const DIA1_H         = 100;
const Y_STEP3        = Y_DIA1 + DIA1_H / 2 + 26;    // 548
const Y_DIA2         = Y_STEP3 + STEP_H + 30 + 60;  // 738  (Pregnant diamond cy)
const DIA2_H         = 120;
const Y_SECHDR       = Y_DIA2 + DIA2_H / 2 + 26;    // 824
const Y_BENZOHDR     = Y_SECHDR + 24 + 4;            // 852
const BENZOHDR_H     = 40;
const Y_BENZOCOLS    = Y_BENZOHDR + BENZOHDR_H + 4;  // 900
const BENZO_COL_H    = 200;
const Y_BENZOBOTTOM  = Y_BENZOCOLS + BENZO_COL_H;    // 1100
const Y_DIA3         = Y_BENZOBOTTOM + 26 + 50;      // 1176  (Seizure stopped? 1 cy)
const DIA3_H         = 100;
const Y_STEP5        = Y_DIA3 + DIA3_H / 2 + 26;    // 1252
const Y_DIA4         = Y_STEP5 + STEP_H + 30 + 50;  // 1432  (Seizure stopped? 2 cy)
const DIA4_H         = 100;
const Y_STEP6        = Y_DIA4 + DIA4_H / 2 + 26;    // 1508
const STEP6_H        = 120; // taller — 4 lines of content
const Y_STEP7        = Y_STEP6 + STEP6_H + 24;      // 1652
const Y_PREGNOTE     = Y_STEP7 + STEP_H + 24;       // 1776
const PREG_H         = 80;
const Y_DISC         = Y_PREGNOTE + PREG_H + 20;    // 1876

// Side box Y positions
const Y_HYPO_BOX     = Y_DIA1 - 28;                 // aligned to diamond
const Y_MAG_BOX      = Y_DIA2 - 44;
const Y_POSTICTAL_BOX = Y_DIA3 + DIA3_H / 2 - 23 + 34;
const Y_MEDDIR_BOX   = Y_DIA4 + DIA4_H / 2 - 23 + 34;

const TOTAL_H = Y_DISC + 60;

// ── Main component ─────────────────────────────────────────────
export default function SeizureFlowchart() {
  const colW = BW / 2 - 5;

  return (
    <View style={{ width: W, height: TOTAL_H }}>

      {/* ── SVG LAYER ── */}
      <Svg width={W} height={TOTAL_H} viewBox={`0 0 ${W} ${TOTAL_H}`} style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={W} height={TOTAL_H} fill={C.bg} />

        {/* Title */}
        <SvgText x={cx} y={Y_TITLE} textAnchor="middle" fontSize={20} fill={'#e6edf3'} fontWeight="800">
          Seizure Protocol
        </SvgText>
        <SvgText x={cx} y={Y_TITLE + 20} textAnchor="middle" fontSize={11} fill={C.muted}>
          Central Arizona Red Book 2026 · Adult &amp; Pediatric
        </SvgText>

        {/* Inclusion box shape */}
        <Box x={BX} y={Y_INCL} w={BW} h={INCL_H} fill={C.inclBg} stroke={C.inclBorder} rx={8} />

        <Arrow x1={cx} y1={Y_INCL + INCL_H} x2={cx} y2={Y_STEP1} />

        {/* Step 1 shape */}
        <StepBox x={BX} y={Y_STEP1} w={BW} h={STEP_H} fill={C.emtBg} stroke={C.emtBorder}
          hasBadge badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

        <Arrow x1={cx} y1={Y_STEP1 + STEP_H} x2={cx} y2={Y_STEP2} />

        {/* Step 2 shape */}
        <StepBox x={BX} y={Y_STEP2} w={BW} h={STEP_H} fill={C.emtBg} stroke={C.emtBorder}
          hasBadge badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

        <Arrow x1={cx} y1={Y_STEP2 + STEP_H} x2={cx} y2={Y_DIA1 - DIA1_H / 2} />

        {/* Diamond: BGL < 60? */}
        <Diamond cx={cx} cy={Y_DIA1} w={DW} h={DIA1_H}
          fill={C.decBg} stroke={C.decBorder}
          lines={['BGL < 60 mg/dL?']} textColor={C.decText} fontSize={14} />

        {/* YES branch */}
        <Line x1={BR} y1={Y_DIA1} x2={CBX + CBW / 2} y2={Y_DIA1} stroke={C.arrow} strokeWidth={1.5} />
        <Arrow x1={CBX + CBW / 2} y1={Y_DIA1} x2={CBX + CBW / 2} y2={Y_HYPO_BOX} />
        <SvgText x={CBX + CBW / 2 + 4} y={Y_DIA1 - 4} fontSize={11} fill={C.label} fontWeight="700">YES</SvgText>
        <Box x={CBX} y={Y_HYPO_BOX} w={CBW} h={56} fill={C.destBg} stroke={C.destBorder} rx={8} />

        {/* NO branch */}
        <Arrow x1={cx} y1={Y_DIA1 + DIA1_H / 2} x2={cx} y2={Y_STEP3} label="NO" />

        {/* Step 3 shape */}
        <StepBox x={BX} y={Y_STEP3} w={BW} h={STEP_H} fill={C.paraBg} stroke={C.paraBorder}
          hasBadge badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder} />

        <Arrow x1={cx} y1={Y_STEP3 + STEP_H} x2={cx} y2={Y_DIA2 - DIA2_H / 2} />

        {/* Diamond: Pregnant? */}
        <Diamond cx={cx} cy={Y_DIA2} w={DW} h={DIA2_H}
          fill={C.decBg} stroke={C.decBorder}
          lines={['Pregnant > 20 wk', 'or postpartum < 6 wk?']} textColor={C.decText} fontSize={13} />

        {/* YES branch */}
        <Line x1={BR} y1={Y_DIA2} x2={CBX + CBW / 2} y2={Y_DIA2} stroke={C.arrow} strokeWidth={1.5} />
        <Arrow x1={CBX + CBW / 2} y1={Y_DIA2} x2={CBX + CBW / 2} y2={Y_MAG_BOX} />
        <SvgText x={CBX + CBW / 2 + 4} y={Y_DIA2 - 4} fontSize={11} fill={C.label} fontWeight="700">YES</SvgText>
        <Box x={CBX} y={Y_MAG_BOX} w={CBW} h={88} fill={C.destBg} stroke={C.destBorder} rx={8} />

        {/* NO branch */}
        <Arrow x1={cx} y1={Y_DIA2 + DIA2_H / 2} x2={cx} y2={Y_SECHDR} label="NO" />

        {/* Step 4 section header + header bar */}
        <SectionHeader x={BX} y={Y_SECHDR} w={BW} text="Step 4 · Administer Benzodiazepine · Paramedic" />
        <Rect x={BX} y={Y_BENZOHDR} width={BW} height={BENZOHDR_H} fill={C.critBg} stroke={C.critBorder} strokeWidth={1.5} rx={8} />
        <SvgText x={cx} y={Y_BENZOHDR + 26} textAnchor="middle" fontSize={14} fill={C.critTitle} fontWeight="800">
          Administer Benzodiazepine
        </SvgText>

        {/* Benzo columns — rects */}
        <Rect x={BX} y={Y_BENZOCOLS} width={colW} height={BENZO_COL_H} fill={C.adultBg} stroke={C.adultBorder} strokeWidth={1.5} rx={8} />
        <Rect x={BX + colW + 10} y={Y_BENZOCOLS} width={colW} height={BENZO_COL_H} fill={C.pedsBg} stroke={C.pedsBorder} strokeWidth={1.5} rx={8} />

        {/* ADULT column text */}
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 22} textAnchor="middle" fontSize={12} fill={C.adultDrug} fontWeight="800">ADULT (age ≥ 15)</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 44} textAnchor="middle" fontSize={12} fill={C.adultDrug} fontWeight="700">Midazolam</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 60} textAnchor="middle" fontSize={11} fill={C.adultDose}>IM / IN: 0.2 mg/kg</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 75} textAnchor="middle" fontSize={11} fill={C.adultDose}>max 10 mg</SvgText>
        <HRule x={BX + 10} y={Y_BENZOCOLS + 88} w={colW - 20} />
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 104} textAnchor="middle" fontSize={12} fill={C.adultDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 120} textAnchor="middle" fontSize={11} fill={C.adultDose}>IV / IO: 0.1 mg/kg</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 135} textAnchor="middle" fontSize={11} fill={C.adultDose}>max 4 mg</SvgText>
        <HRule x={BX + 10} y={Y_BENZOCOLS + 148} w={colW - 20} />
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 164} textAnchor="middle" fontSize={11} fill={'#d29922'} fontWeight="600">Age &gt; 60: reduce dose by half</SvgText>
        <SvgText x={BX + colW / 2} y={Y_BENZOCOLS + 180} textAnchor="middle" fontSize={11} fill={C.adultDose}>Slow over 2 min via IV/IO</SvgText>

        {/* PEDS column text */}
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 22} textAnchor="middle" fontSize={12} fill={C.pedsDrug} fontWeight="800">PEDIATRIC (age &lt; 15)</SvgText>
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 44} textAnchor="middle" fontSize={12} fill={C.pedsDrug} fontWeight="700">Midazolam</SvgText>
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 60} textAnchor="middle" fontSize={11} fill={C.pedsDose}>IM / IN: 0.2 mg/kg</SvgText>
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 75} textAnchor="middle" fontSize={11} fill={C.pedsDose}>max 10 mg</SvgText>
        <HRule x={BX + colW + 10 + 10} y={Y_BENZOCOLS + 88} w={colW - 20} />
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 104} textAnchor="middle" fontSize={12} fill={C.pedsDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 120} textAnchor="middle" fontSize={11} fill={C.pedsDose}>IV / IO: 0.1 mg/kg</SvgText>
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 135} textAnchor="middle" fontSize={11} fill={C.pedsDose}>max 4 mg</SvgText>
        <HRule x={BX + colW + 10 + 10} y={Y_BENZOCOLS + 148} w={colW - 20} />
        <SvgText x={BX + colW + 10 + colW / 2} y={Y_BENZOCOLS + 164} textAnchor="middle" fontSize={11} fill={C.pedsDose} fontWeight="600">Slow over 2 min via IV/IO</SvgText>

        <Arrow x1={cx} y1={Y_BENZOBOTTOM} x2={cx} y2={Y_DIA3 - DIA3_H / 2} />

        {/* Diamond: Seizure stopped? (1) */}
        <Diamond cx={cx} cy={Y_DIA3} w={DW} h={DIA3_H}
          fill={C.decBg} stroke={C.decBorder}
          lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

        {/* YES branch */}
        <Line x1={BR} y1={Y_DIA3} x2={CBX + CBW / 2} y2={Y_DIA3} stroke={C.arrow} strokeWidth={1.5} />
        <Arrow x1={CBX + CBW / 2} y1={Y_DIA3} x2={CBX + CBW / 2} y2={Y_POSTICTAL_BOX} />
        <SvgText x={CBX + CBW / 2 + 4} y={Y_DIA3 - 4} fontSize={11} fill={C.label} fontWeight="700">YES</SvgText>
        <Box x={CBX} y={Y_POSTICTAL_BOX} w={CBW} h={46} fill={C.paraBg} stroke={C.paraBorder} rx={8} />

        {/* NO branch */}
        <Arrow x1={cx} y1={Y_DIA3 + DIA3_H / 2} x2={cx} y2={Y_STEP5} label="NO" labelSide="right" />

        {/* Step 5 shape */}
        <StepBox x={BX} y={Y_STEP5} w={BW} h={STEP_H} fill={C.critBg} stroke={C.critBorder}
          hasBadge badgeBg="rgba(42,26,10,0.4)" badgeBorder={C.critBorder} />

        <Arrow x1={cx} y1={Y_STEP5 + STEP_H} x2={cx} y2={Y_DIA4 - DIA4_H / 2} />

        {/* Diamond: Seizure stopped? (2) */}
        <Diamond cx={cx} cy={Y_DIA4} w={DW} h={DIA4_H}
          fill={C.decBg} stroke={C.decBorder}
          lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

        {/* NO branch */}
        <Line x1={BR} y1={Y_DIA4} x2={CBX + CBW / 2} y2={Y_DIA4} stroke={C.arrow} strokeWidth={1.5} />
        <Arrow x1={CBX + CBW / 2} y1={Y_DIA4} x2={CBX + CBW / 2} y2={Y_MEDDIR_BOX} />
        <SvgText x={CBX + CBW / 2 + 4} y={Y_DIA4 - 4} fontSize={11} fill={C.label} fontWeight="700">NO</SvgText>
        <Box x={CBX} y={Y_MEDDIR_BOX} w={CBW} h={46} fill={C.destBg} stroke={C.destBorder} rx={8} />

        {/* YES branch */}
        <Arrow x1={cx} y1={Y_DIA4 + DIA4_H / 2} x2={cx} y2={Y_STEP6} label="YES" />

        {/* Step 6 shape */}
        <StepBox x={BX} y={Y_STEP6} w={BW} h={STEP6_H} fill={C.paraBg} stroke={C.paraBorder}
          hasBadge badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder} />

        <Arrow x1={cx} y1={Y_STEP6 + STEP6_H} x2={cx} y2={Y_STEP7} />

        {/* Step 7 shape */}
        <StepBox x={BX} y={Y_STEP7} w={BW} h={STEP_H} fill={C.emtBg} stroke={C.emtBorder}
          hasBadge badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

        <Arrow x1={cx} y1={Y_STEP7 + STEP_H} x2={cx} y2={Y_PREGNOTE} />

        {/* Pregnancy Note shape */}
        <Box x={BX} y={Y_PREGNOTE} w={BW} h={PREG_H} fill={C.pregBg} stroke={C.pregBorder} rx={8} />

        {/* Disclaimer */}
        <Rect x={BX} y={Y_DISC} width={BW} height={1} fill={C.muted} />
        <SvgText x={cx} y={Y_DISC + 18} textAnchor="middle" fontSize={10} fill={C.discText}>
          Reference aid only — not a substitute for clinical judgment or online medical direction
        </SvgText>
        <SvgText x={cx} y={Y_DISC + 34} textAnchor="middle" fontSize={10} fill={C.discText}>
          Central AZ Red Book 2026 p.23
        </SvgText>
      </Svg>

      {/* ── RN TEXT OVERLAY LAYER ── */}

      {/* Inclusion box */}
      <BoxLabel x={BX} y={Y_INCL} w={BW} h={INCL_H}
        lines={['INCLUDES:', 'Ongoing seizure on arrival · Seizure > 5 min', '> 2 seizures/hr without recovery (Status Epilepticus)']}
        textColor={C.inclText} fontSize={12} />

      {/* Step 1 */}
      <StepBoxLabel x={BX} y={Y_STEP1} w={BW} h={STEP_H}
        stepLabel="STEP 1"
        title="Initiate Universal Care"
        subtitle="Airway support · AVPU/GCS · O₂ as needed"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      {/* Step 2 */}
      <StepBoxLabel x={BX} y={Y_STEP2} w={BW} h={STEP_H}
        stepLabel="STEP 2"
        title="Check Blood Glucose"
        subtitle="Fingerstick BGL · If pregnant → left lateral recumbent"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      {/* Hypoglycemia side box */}
      <BoxLabel x={CBX} y={Y_HYPO_BOX} w={CBW} h={56}
        lines={['→ Hypoglycemia', 'protocol']}
        textColor={C.destText} fontSize={11} />

      {/* Step 3 */}
      <StepBoxLabel x={BX} y={Y_STEP3} w={BW} h={STEP_H}
        stepLabel="STEP 3"
        title="IV/IO Access + Cardiac & EtCO₂ Monitoring"
        subtitle="Establish access · Continuous monitoring"
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder} />

      {/* Mag Sulfate side box */}
      <BoxLabel x={CBX} y={Y_MAG_BOX} w={CBW} h={88}
        lines={['Mag Sulfate', '4 g IV/IO', '20 min slow push', '→ OB protocol']}
        textColor={C.destText} fontSize={11} />

      {/* Step 5 */}
      <StepBoxLabel x={BX} y={Y_STEP5} w={BW} h={STEP_H}
        stepLabel="STEP 5 · PARAMEDIC"
        title="Repeat Benzodiazepine — 1 repeat dose max"
        subtitle="Same drug and dose · Max 2 total doses · Ketamine NOT indicated postictal"
        titleColor={C.critTitle} subtitleColor={'#e6b87a'}
        badge="PARAMEDIC" badgeColor={C.critTitle} badgeBg="rgba(42,26,10,0.4)" badgeBorder={C.critBorder} />

      {/* Postictal side box */}
      <BoxLabel x={CBX} y={Y_POSTICTAL_BOX} w={CBW} h={46}
        lines={['Postictal', '→ Step 6']}
        textColor={C.paraTitle} fontSize={11} />

      {/* Medical Direction side box */}
      <BoxLabel x={CBX} y={Y_MEDDIR_BOX} w={CBW} h={46}
        lines={['Medical Direction']}
        textColor={C.destText} fontSize={12} />

      {/* Step 6 */}
      <StepBoxLabel x={BX} y={Y_STEP6} w={BW} h={STEP6_H}
        stepLabel="STEP 6 · PARAMEDIC"
        title="Postictal Care"
        subtitle={"Maintain airway · positioning · continuous monitoring\nIf agitation: refer to Agitated/Violent Patient protocol\nKetamine NOT indicated postictal"}
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder} />

      {/* Step 7 */}
      <StepBoxLabel x={BX} y={Y_STEP7} w={BW} h={STEP_H}
        stepLabel="STEP 7"
        title="Transport — Notify Receiving Facility"
        subtitle="ALS intercept if not already on scene"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="ALL PROVIDERS" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      {/* Pregnancy Note */}
      <BoxLabel x={BX} y={Y_PREGNOTE} w={BW} h={PREG_H}
        lines={['⚠  PREGNANCY NOTE', 'Mag sulfate is first-line for eclamptic seizure', 'If etiology unclear: may give benzo simultaneously with mag']}
        textColor={C.pregText} fontSize={12} />

    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  boxCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  badgeAbs: {
    position: 'absolute',
    right: 8,
    top: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
