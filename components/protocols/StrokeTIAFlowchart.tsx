import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Polygon,
  G,
} from 'react-native-svg';

// ── Canvas width constants ─────────────────────────────────────
const W   = 470;
const cx  = W / 2;           // 235
const BW  = 440;
const BX  = cx - BW / 2;    // 15
const BR  = BX + BW;        // 455
const DW  = 240;
const DCX = BX + DW / 2;    // 135
const CBW = 110;
const CBX = BR - CBW;       // 345

// ── Vertical spacing ───────────────────────────────────────────
const GAP            = 24;
const STEP_PADDING_V = 10;

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
  warnBg:     '#1a1400',
  warnBorder: '#9e6a03',
  warnText:   '#d29922',
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

// ── Fixed block heights ────────────────────────────────────────
const FAST_HDR_H  = 28;
const FAST_CARD_H = 110;
const FAST_TOTAL  = FAST_HDR_H + 8 + FAST_CARD_H;

const VAN_HDR_H   = 28;
const VAN_SUB_H   = 22;
const VAN_CARD_H  = 100;
const VAN_TOTAL   = VAN_HDR_H + 6 + VAN_SUB_H + 6 + VAN_CARD_H;

const DEST_HDR_H  = 24;
const DEST_BOX_H  = 185;
const DEST_TOTAL  = DEST_HDR_H + 4 + DEST_BOX_H;

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

// ── FAST block SVG renderer ────────────────────────────────────
function FASTBlock({ y }: { y: number }) {
  const colW = (BW - 12) / 4;
  const cardY = y + FAST_HDR_H + 8;
  const col = (i: number) => BX + i * (colW + 4);

  const cols = [
    { letter: 'F', label: 'Face',   lines: ['Ask to smile.', 'Uneven?'],          score: 'Yes = 1 pt', bg: C.emtBg,  border: C.emtBorder,  lc: C.decText   },
    { letter: 'A', label: 'Arms',   lines: ['Raise both arms.', 'One drift down?'], score: 'Yes = 1 pt', bg: C.emtBg,  border: C.emtBorder,  lc: C.decText   },
    { letter: 'S', label: 'Speech', lines: ['Simple phrase.', 'Sound strange?'],   score: 'Yes = 1 pt', bg: C.emtBg,  border: C.emtBorder,  lc: C.decText   },
    { letter: 'T', label: 'Time',   lines: ['Time is BRAIN.', 'Document onset', 'or last known well'], score: '', bg: C.critBg, border: C.critBorder, lc: C.critTitle },
  ];

  return (
    <G>
      <Rect x={BX} y={y} width={BW} height={FAST_HDR_H} fill={C.secBg} rx={6} />
      <SvgText x={cx} y={y + 20} textAnchor="middle" fontSize={13} fill={C.emtTitle} fontWeight="800">
        FAST Stroke Screen — EMT (Required)
      </SvgText>
      {cols.map((c, i) => {
        const x = col(i);
        const textStartY = cardY + 58;
        const lh = 15;
        return (
          <G key={i}>
            <Rect x={x} y={cardY} width={colW} height={FAST_CARD_H} fill={c.bg} stroke={c.border} strokeWidth={1.5} rx={6} />
            <SvgText x={x + colW / 2} y={cardY + 26} textAnchor="middle" fontSize={20} fill={c.lc} fontWeight="800">{c.letter}</SvgText>
            <SvgText x={x + colW / 2} y={cardY + 41} textAnchor="middle" fontSize={11} fill={C.emtTitle} fontWeight="700">{c.label}</SvgText>
            {c.lines.map((l, li) => (
              <SvgText key={li} x={x + colW / 2} y={textStartY + li * lh} textAnchor="middle" fontSize={10} fill={C.emtSub}>{l}</SvgText>
            ))}
            {c.score !== '' && (
              <SvgText x={x + colW / 2} y={cardY + FAST_CARD_H - 10} textAnchor="middle" fontSize={10} fill={C.adultDose} fontWeight="700">{c.score}</SvgText>
            )}
          </G>
        );
      })}
    </G>
  );
}

// ── VAN block SVG renderer ─────────────────────────────────────
function VANBlock({ y }: { y: number }) {
  const colW = (BW - 8) / 3;
  const subY  = y + VAN_HDR_H + 6;
  const cardY = subY + VAN_SUB_H + 6;
  const col = (i: number) => BX + i * (colW + 4);

  const cols = [
    { letter: 'V', label: 'Vision',  lines: ['Field cut testing:', '2 fingers right,', '1 finger left']          },
    { letter: 'A', label: 'Aphasia', lines: ["Can't speak or", 'understand. Repeat', '& name 2 objects']         },
    { letter: 'N', label: 'Neglect', lines: ['Forced gaze or', 'ignoring one side.', 'Touch both sides']         },
  ];

  return (
    <G>
      <Rect x={BX} y={y} width={BW} height={VAN_HDR_H} fill={C.paraBg} stroke={C.paraBorder} strokeWidth={1.5} rx={6} />
      <SvgText x={cx} y={y + 19} textAnchor="middle" fontSize={13} fill={C.paraTitle} fontWeight="800">
        VAN Screen — LVO Assessment (onset &gt;4 hrs) — Paramedic
      </SvgText>
      <SvgText x={cx} y={subY + 15} textAnchor="middle" fontSize={11} fill={C.paraSub}>
        Step 1: Is arm weakness present? No → VAN Negative (stop)
      </SvgText>
      {cols.map((c, i) => {
        const x = col(i);
        const textStartY = cardY + 56;
        const lh = 15;
        return (
          <G key={i}>
            <Rect x={x} y={cardY} width={colW} height={VAN_CARD_H} fill={C.decBg} stroke={C.decBorder} strokeWidth={1.5} rx={6} />
            <SvgText x={x + colW / 2} y={cardY + 26} textAnchor="middle" fontSize={20} fill={C.decText} fontWeight="800">{c.letter}</SvgText>
            <SvgText x={x + colW / 2} y={cardY + 41} textAnchor="middle" fontSize={11} fill={C.emtTitle} fontWeight="700">{c.label}</SvgText>
            {c.lines.map((l, li) => (
              <SvgText key={li} x={x + colW / 2} y={textStartY + li * lh} textAnchor="middle" fontSize={10} fill={C.paraSub}>{l}</SvgText>
            ))}
          </G>
        );
      })}
    </G>
  );
}

// ── DiamondSpacer ──────────────────────────────────────────────
function DiamondSpacer({ h, onLayout }: { h: number; onLayout?: (e: LayoutChangeEvent) => void }) {
  return <View onLayout={onLayout} style={{ height: h + GAP * 2 }} />;
}

// ── StepBox ────────────────────────────────────────────────────
interface StepBoxProps {
  fill: string; stroke: string;
  stepLabel: string; title: string; subtitle?: string;
  titleColor: string; subtitleColor: string;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
  subtitleFontSize?: number; titleFontSize?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}

function StepBox({
  fill, stroke, stepLabel, title, subtitle,
  titleColor, subtitleColor, badge, badgeColor, badgeBg, badgeBorder,
  subtitleFontSize = 14, titleFontSize = 16, onLayout,
}: StepBoxProps) {
  return (
    <View onLayout={onLayout}
      style={[styles.stepBox, { backgroundColor: fill, borderColor: stroke, marginLeft: BX, width: BW }]}>
      <View style={[styles.stepContent, { paddingRight: badge ? 60 : 16 }]}>
        <Text style={{ color: subtitleColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 }}>
          {stepLabel}
        </Text>
        <Text style={{ color: titleColor, fontSize: titleFontSize, fontWeight: '800' }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: subtitleColor, fontSize: subtitleFontSize, fontWeight: '400', marginTop: 3 }}>{subtitle}</Text>
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

// ── Main component ─────────────────────────────────────────────
export default function StrokeTIAFlowchart() {
  const [m, setM] = useState<Record<string, { y: number; height: number }>>({});
  const [totalH, setTotalH] = useState(2800);

  const measure = useCallback((key: string) => (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setM(prev => ({ ...prev, [key]: { y, height } }));
  }, []);

  const DIA1_H = 100;
  const DIA2_H = 120;
  const DIA3_H = 120;

  const TITLE_H = 60;
  const INCL_H  = 88;
  const PEDS_H  = 60;
  const DISC_H  = 60;

  const bot = (key: string) => (m[key]?.y ?? 0) + (m[key]?.height ?? 0);
  const diaCenter = (spacerKey: string, diaH: number) => (m[spacerKey]?.y ?? 0) + GAP + diaH / 2;
  const sideBoxY  = (spacerKey: string, diaH: number, boxH: number) => diaCenter(spacerKey, diaH) - boxH / 2;

  const svgH = totalH;

  const REQUIRED_KEYS = [
    'step1','step2','fastblock','step3','spacer1',
    'step4','vanblock','spacer2','spacer3',
    'step5','step6','destspace','pedsbox','disc',
  ];
  const ready = REQUIRED_KEYS.every(k => m[k] !== undefined);

  const Y_TITLE  = 38;
  const Y_INCL   = TITLE_H;
  const Y_STEP1  = ready ? m['step1']?.y   ?? 0 : 0;
  const Y_STEP2  = ready ? m['step2']?.y   ?? 0 : 0;
  const Y_FAST   = ready ? m['fastblock']?.y ?? 0 : 0;
  const Y_STEP3  = ready ? m['step3']?.y   ?? 0 : 0;
  const Y_DIA1   = ready ? diaCenter('spacer1', DIA1_H) : 0;
  const Y_NEAR_BOX  = ready ? sideBoxY('spacer1', DIA1_H, 70) : 0;
  const Y_STEP4  = ready ? m['step4']?.y   ?? 0 : 0;
  const Y_VAN    = ready ? m['vanblock']?.y ?? 0 : 0;
  const Y_DIA2   = ready ? diaCenter('spacer2', DIA2_H) : 0;
  const Y_NEAR2_BOX = ready ? sideBoxY('spacer2', DIA2_H, 70) : 0;
  const Y_DIA3   = ready ? diaCenter('spacer3', DIA3_H) : 0;
  const Y_VAN_POS_BOX = ready ? sideBoxY('spacer3', DIA3_H, 110) : 0;
  const Y_STEP5  = ready ? m['step5']?.y   ?? 0 : 0;
  const Y_STEP6  = ready ? m['step6']?.y   ?? 0 : 0;
  const Y_STEP6_H = ready ? m['step6']?.height ?? 0 : 0;
  const Y_DESTHDR = ready ? m['destspace']?.y ?? 0 : 0;
  const Y_DESTBOX = Y_DESTHDR + DEST_HDR_H + 4;
  const Y_PEDS   = ready ? m['pedsbox']?.y ?? 0 : 0;
  const Y_DISC   = ready ? m['disc']?.y    ?? 0 : 0;

  return (
    <View style={{ width: W }} onLayout={e => setTotalH(e.nativeEvent.layout.height)}>

      {/* ── SVG OVERLAY ── */}
      {svgH > 0 && (
        <Svg width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`}
          style={StyleSheet.absoluteFill} pointerEvents="none">

          <Rect x={0} y={0} width={W} height={svgH} fill={C.bg} />

          <SvgText x={cx} y={Y_TITLE} textAnchor="middle" fontSize={20} fill={'#e6edf3'} fontWeight="800">
            Stroke / TIA Protocol
          </SvgText>
          <SvgText x={cx} y={Y_TITLE + 20} textAnchor="middle" fontSize={11} fill={C.muted}>
            Central Arizona Red Book 2026 · Adult &amp; Pediatric
          </SvgText>

          <SvgBox x={BX} y={Y_INCL} w={BW} h={INCL_H} fill={C.inclBg} stroke={C.inclBorder} />

          {ready && (
            <G>
              <Arrow x1={cx} y1={Y_INCL + INCL_H} x2={cx} y2={Y_STEP1} />
              <Arrow x1={cx} y1={bot('step1')} x2={cx} y2={Y_STEP2} />

              {/* Connector line: step2 → FAST block */}
              <Line x1={cx} y1={bot('step2')} x2={cx} y2={Y_FAST} stroke={C.arrow} strokeWidth={1.5} />
              <FASTBlock y={Y_FAST} />

              {/* Arrow: FAST → step3 */}
              <Arrow x1={cx} y1={Y_FAST + FAST_TOTAL} x2={cx} y2={Y_STEP3} />

              <SectionHeader x={BX} y={bot('step3') + GAP} w={BW} text="PARAMEDIC" color={C.paraTitle} />
              <Arrow x1={DCX} y1={bot('step3') + GAP + 24 + 4} x2={DCX} y2={Y_DIA1 - DIA1_H / 2} />

              <Diamond cx={DCX} cy={Y_DIA1} w={DW} h={DIA1_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['Symptom onset', '< 4 hours?']} textColor={C.decText} fontSize={14} />

              {/* YES → red Nearest Stroke Center */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA1} x2={CBX} y2={Y_DIA1} label="YES" labelSide="left" />
              <SvgBox x={CBX} y={Y_NEAR_BOX} w={CBW} h={70} fill={C.destBg} stroke={C.destBorder} />

              {/* NO → step4 — manual label offset right of shaft */}
              <Arrow x1={DCX} y1={Y_DIA1 + DIA1_H / 2} x2={DCX} y2={Y_STEP4} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA1 + DIA1_H / 2 + Y_STEP4) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >NO</SvgText>

              {/* Connector: step4 → VAN block */}
              <Line x1={cx} y1={bot('step4')} x2={cx} y2={Y_VAN} stroke={C.arrow} strokeWidth={1.5} />
              <VANBlock y={Y_VAN} />

              {/* Arrow: VAN block → diamond2 */}
              <Arrow x1={DCX} y1={Y_VAN + VAN_TOTAL} x2={DCX} y2={Y_DIA2 - DIA2_H / 2} />

              <Diamond cx={DCX} cy={Y_DIA2} w={DW} h={DIA2_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['Unilateral motor', 'weakness ×10 sec?']} textColor={C.decText} fontSize={13} />

              {/* NO → red Nearest Stroke Center */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA2} x2={CBX} y2={Y_DIA2} label="NO" labelSide="left" />
              <SvgBox x={CBX} y={Y_NEAR2_BOX} w={CBW} h={70} fill={C.destBg} stroke={C.destBorder} />

              {/* YES → VAN diamond — draw arrow without label, add manual label above midpoint */}
              <Arrow x1={DCX} y1={Y_DIA2 + DIA2_H / 2} x2={DCX} y2={Y_DIA3 - DIA3_H / 2} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA2 + DIA2_H / 2 + Y_DIA3 - DIA3_H / 2) / 2 - 6}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >YES</SvgText>

              <Diamond cx={DCX} cy={Y_DIA3} w={DW} h={DIA3_H}
                fill={C.decBg} stroke={C.decBorder}
                lines={['VAN / LVO screen', 'POSITIVE?']} textColor={C.decText} fontSize={13} />

              {/* YES → red Comprehensive */}
              <Arrow x1={DCX + DW / 2} y1={Y_DIA3} x2={CBX} y2={Y_DIA3} label="YES" labelSide="left" />
              <SvgBox x={CBX} y={Y_VAN_POS_BOX} w={CBW} h={110} fill={C.destBg} stroke={C.destBorder} />

              {/* NO → step5 — manual label offset right of shaft */}
              <Arrow x1={DCX} y1={Y_DIA3 + DIA3_H / 2} x2={DCX} y2={Y_STEP5} />
              <SvgText
                x={DCX + 14}
                y={(Y_DIA3 + DIA3_H / 2 + Y_STEP5) / 2 + 4}
                fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
              >NO</SvgText>

              <Arrow x1={cx} y1={bot('step5')} x2={cx} y2={Y_STEP6} />

              <SectionHeader x={BX} y={Y_DESTHDR} w={BW} text="Stroke Destination · Paramedic" color={C.paraTitle} />
              <Rect x={BX} y={Y_DESTBOX} width={BW} height={DEST_BOX_H}
                fill={C.paraBg} stroke={C.paraBorder} strokeWidth={1.5} rx={8} />

              <SvgText x={cx} y={Y_DESTBOX + 22} textAnchor="middle" fontSize={13} fill={C.paraTitle} fontWeight="800">ONSET &lt; 4 HOURS</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 42} textAnchor="middle" fontSize={15} fill={C.destText} fontWeight="800">Nearest Stroke Center</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 59} textAnchor="middle" fontSize={11} fill={C.paraSub}>(Primary · Comprehensive · Thrombectomy)</SvgText>
              <Line x1={BX + 15} y1={Y_DESTBOX + 74} x2={BR - 15} y2={Y_DESTBOX + 74} stroke={'#30363d'} strokeWidth={1} />
              <SvgText x={cx} y={Y_DESTBOX + 94} textAnchor="middle" fontSize={13} fill={C.paraTitle} fontWeight="800">ONSET &gt; 4 HOURS</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 112} textAnchor="middle" fontSize={12} fill={C.paraSub}>VAN Positive →</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 130} textAnchor="middle" fontSize={15} fill={C.destText} fontWeight="800">Comprehensive Stroke Center</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 148} textAnchor="middle" fontSize={12} fill={C.destText}>(Thrombectomy Capable)</SvgText>
              <SvgText x={cx} y={Y_DESTBOX + 168} textAnchor="middle" fontSize={11} fill={C.warnText}>Unless &gt; 30 min → closest Stroke Center</SvgText>

              <Arrow x1={cx} y1={Y_STEP6 + Y_STEP6_H} x2={cx} y2={Y_DESTHDR} />

              <SvgBox x={BX} y={Y_PEDS} w={BW} h={PEDS_H} fill={C.pedsBg} stroke={C.pedsBorder} />

              <Rect x={BX} y={Y_DISC} width={BW} height={1} fill={C.muted} />
              <SvgText x={cx} y={Y_DISC + 18} textAnchor="middle" fontSize={10} fill={C.discText}>
                Reference aid only — not a substitute for clinical judgment or online medical direction
              </SvgText>
              <SvgText x={cx} y={Y_DISC + 34} textAnchor="middle" fontSize={10} fill={C.discText}>
                Central AZ Red Book 2026 p.21
              </SvgText>
            </G>
          )}
        </Svg>
      )}

      {/* ── RN LAYOUT COLUMN ── */}
      <View style={{ height: TITLE_H }} />

      <View style={[styles.inclBox, { marginLeft: BX, width: BW, height: INCL_H }]}>
        <View style={styles.boxCenter}>
          <Text style={[styles.inclText, { fontWeight: '700' }]}>INCLUDES:</Text>
          <Text style={styles.inclText}>Acute neuro deficit</Text>
          <Text style={styles.inclText}>(facial droop, focal weakness, speech difficulty, AMS)</Text>
          <Text style={styles.inclText}>Within 24 hrs of onset or last known well · Excludes TBI/Trauma</Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      <StepBox
        onLayout={measure('step1')}
        fill={C.emtBg} stroke={C.emtBorder} stepLabel="STEP 1"
        title="Initiate Universal Care"
        subtitle={"Airway support · AVPU/GCS · O₂ as needed\nObtain SpO₂ and waveform capnography (EtCO₂)"}
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={10}
      />

      <View style={{ height: GAP }} />

      <StepBox
        onLayout={measure('step2')}
        fill={C.emtBg} stroke={C.emtBorder} stepLabel="STEP 2"
        title="Stroke Screening + BGL"
        subtitle={"Obtain blood glucose → refer to Hypoglycemia if indicated\nDocument weight + last known well time / onset time\nIf AMS + SBP > 100: elevate HOB 15–30°"}
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={10}
      />

      {/* FAST block spacer */}
      <View style={{ height: GAP }} />
      <View onLayout={measure('fastblock')} style={{ height: FAST_TOTAL, marginLeft: BX, width: BW }} />
      <View style={{ height: GAP }} />

      <StepBox
        onLayout={measure('step3')}
        fill={C.emtBg} stroke={C.emtBorder} stepLabel="STEP 3"
        title="Transport to a Stroke Center"
        subtitle="Notify receiving facility as soon as possible"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder}
        subtitleFontSize={10}
      />

      {/* PARAMEDIC bar spacer */}
      <View style={{ height: GAP + 24 + 4 }} />

      <DiamondSpacer onLayout={measure('spacer1')} h={DIA1_H} />

      <StepBox
        onLayout={measure('step4')}
        fill={C.paraBg} stroke={C.paraBorder} stepLabel="STEP 4"
        title="Assess Unilateral Motor Weakness"
        subtitle={"Onset > 4 hrs: assess for unilateral weakness × 10 seconds\nIf present → perform VAN screen below"}
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder}
        subtitleFontSize={11}
      />

      {/* VAN block spacer */}
      <View style={{ height: GAP }} />
      <View onLayout={measure('vanblock')} style={{ height: VAN_TOTAL, marginLeft: BX, width: BW }} />
      <View style={{ height: GAP }} />

      <DiamondSpacer onLayout={measure('spacer2')} h={DIA2_H} />
      <View style={{ height: GAP }} />
      <DiamondSpacer onLayout={measure('spacer3')} h={DIA3_H} />

      <StepBox
        onLayout={measure('step5')}
        fill={C.paraBg} stroke={C.paraBorder} stepLabel="STEP 5"
        title="Advanced Airway + Monitoring"
        subtitle={"Consider airway adjuncts, escalate as indicated\nPerform 12-lead ECG, transmit when indicated"}
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder}
        subtitleFontSize={11}
      />

      <View style={{ height: GAP }} />

      <StepBox
        onLayout={measure('step6')}
        fill={C.paraBg} stroke={C.paraBorder} stepLabel="STEP 6"
        title="Notify Receiving Facility"
        subtitle={"Activate Stroke Alert · Report last known well time\nReport FAST/VAN findings · ETA"}
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder}
        subtitleFontSize={11}
      />

      <View style={{ height: GAP }} />

      <View onLayout={measure('destspace')} style={{ height: DEST_TOTAL }} />

      <View style={{ height: GAP }} />

      <View onLayout={measure('pedsbox')}
        style={[styles.inclBox, { marginLeft: BX, width: BW, height: PEDS_H, borderColor: C.pedsBorder, backgroundColor: C.pedsBg }]}>
        <View style={styles.boxCenter}>
          <Text style={{ color: C.pedsDrug, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>⚠  PEDIATRIC NOTE</Text>
          <Text style={{ color: C.pedsDose, fontSize: 11, textAlign: 'center' }}>Strokes rare but possible · Stroke scales NOT validated in peds</Text>
          <Text style={{ color: C.pedsDose, fontSize: 11, textAlign: 'center' }}>Call receiving facility / base hospital for destination decision</Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
      <View onLayout={measure('disc')} style={{ height: DISC_H }} />

      {/* ── ABSOLUTE RN TEXT OVERLAYS ── */}
      {ready && (
        <>
          {/* Onset < 4 hrs YES → red Nearest Stroke Center */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_NEAR_BOX, width: CBW, height: 70 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Nearest</Text>
              <Text style={{ color: C.destText, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Stroke Center</Text>
              <Text style={{ color: C.destText, fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 }}>→ Step 5</Text>
            </View>
          </View>

          {/* No motor weakness → red Nearest Stroke Center */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_NEAR2_BOX, width: CBW, height: 70 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Nearest</Text>
              <Text style={{ color: C.destText, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Stroke Center</Text>
              <Text style={{ color: C.destText, fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 }}>VAN negative</Text>
            </View>
          </View>

          {/* VAN positive → Comprehensive Stroke Center */}
          <View pointerEvents="none"
            style={[styles.abs, { left: CBX, top: Y_VAN_POS_BOX, width: CBW, height: 110 }]}>
            <View style={styles.boxCenter}>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>Comprehensive</Text>
              <Text style={{ color: C.destText, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>Stroke Center</Text>
              <Text style={{ color: C.destText, fontSize: 10, fontWeight: '500', textAlign: 'center' }}>(Thrombectomy</Text>
              <Text style={{ color: C.destText, fontSize: 10, fontWeight: '500', textAlign: 'center' }}>Capable)</Text>
              <Text style={{ color: C.warnText, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>Unless &gt;30 min,</Text>
              <Text style={{ color: C.warnText, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>then closest SC</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  abs:         { position: 'absolute' },
  stepBox:     { borderWidth: 1.5, borderRadius: 10, position: 'relative' },
  stepContent: { paddingVertical: STEP_PADDING_V, paddingLeft: 16 },
  badge: {
    position: 'absolute', right: 8, top: 8,
    borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  inclBox: { borderWidth: 1.5, borderRadius: 8, borderColor: C.inclBorder, backgroundColor: C.inclBg },
  boxCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  inclText:  { color: C.inclText, fontSize: 12, textAlign: 'center' },
});
