// CardiacArrestShockableFlowchart.tsx
// Cardiac Arrest — Shockable Rhythms (VF / Pulseless VT): Adult & Pediatric
// Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
// Architecture: v2 — onLayout measurements + SVG overlay

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Line,
  Rect,
  Polygon,
  Text as SvgText,
  Defs,
  Marker,
  Path,
} from 'react-native-svg';

// ─── Canvas constants ────────────────────────────────────────────────────────
const W = 470;
const cx = 235;
const BX = 15;
const BR = 455;
const BW = 440;
const GAP = 24;
const STEP_PADDING_V = 10;

// Diamond column (left-biased)
const DW = 240;
const DCX = 135;
const DXR = 255; // right tip of diamond

// Callout box (right side)
const CBW = 140;
const CBX = 315;

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  // EMT section
  emtBg: '#21262d',
  emtBorder: '#484f58',
  emtTitle: '#e6edf3',
  emtSub: '#8b949e',
  // Paramedic section
  paraBg: '#1b3a2d',
  paraBorder: '#0F6E56',
  paraTitle: '#56d364',
  paraSub: '#8fcca0',
  // Critical / warning
  critBg: '#2a1a0a',
  critBorder: '#f0883e',
  critTitle: '#f0883e',
  critSub: '#d29922',
  // Decision diamond
  decBg: '#1f3a5f',
  decBorder: '#185FA5',
  decText: '#79c0ff',
  // Destination / alert
  destBg: '#3a1010',
  destBorder: '#d62828',
  destText: '#f85149',
  // Pediatric
  pedsBg: '#0a1a2a',
  pedsBorder: '#1f6feb',
  pedsDrug: '#58a6ff',
  pedsDose: '#a5d6ff',
  // Warn
  warnBg: '#1a1400',
  warnBorder: '#9e6a03',
  warnText: '#d29922',
  // Misc
  secBg: '#161b22',
  secText: '#6e7681',
  arrow: '#6e7681',
  label: '#8b949e',
  discText: '#6e7681',
};

// ─── Layout state type ───────────────────────────────────────────────────────
type LayoutMap = Record<string, { top: number; bot: number } | undefined>;

// Keys that MUST be measured before SVG renders
const REQUIRED_KEYS = [
  'title',
  'excl',
  'emtBar',
  'step1',
  'step2',
  'step3',
  'step4',
  'dec1',       // Decision: Unwitnessed / special case?
  'step5',      // Passive oxygenation (≥8 yrs)
  'step6',      // BVM start (≥8 yrs no response / <8 yrs)
  'paraBar',
  'step7',      // IV/IO + Monitor
  'step8',      // Defibrillate
  'step9',      // Epinephrine
  'step10',     // Amiodarone / Lidocaine decision block
  'dec2',       // Decision: ROSC?
  'step11',     // Reversible causes
  'dec3',       // Decision: After 4 rounds?
  'step12',     // TOR / transport
  'step13',     // ROSC care
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CALLOUT_LINE_H = 12;
const CALLOUT_PAD = 8;

function calloutBox(
  midY: number,
  lines: string[],
  bg: string,
  border: string,
  tc: string,
) {
  const textBlockH = (lines.length - 1) * CALLOUT_LINE_H + 10;
  const boxH = textBlockH + CALLOUT_PAD * 2;
  const top = midY - boxH / 2;
  const firstBaselineY = top + CALLOUT_PAD + 8;
  return (
    <>
      <Rect
        x={CBX}
        y={top}
        width={CBW}
        height={boxH}
        rx={6}
        fill={bg}
        stroke={border}
        strokeWidth={1.5}
      />
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={CBX + CBW / 2}
          y={firstBaselineY + i * CALLOUT_LINE_H}
          fontSize={9.5}
          fill={tc}
          textAnchor="middle"
          fontWeight="600"
        >
          {line}
        </SvgText>
      ))}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Generic step box
function StepBox({
  stepNum,
  title,
  bullets,
  bg,
  border,
  bodyColor,
  subColor,
  onLayout,
}: {
  stepNum: string;
  title: string;
  bullets: string[];
  bg: string;
  border: string;
  bodyColor: string;
  subColor: string;
  onLayout: (e: any) => void;
}) {
  return (
    <View
      onLayout={onLayout}
      style={[
        styles.stepBox,
        { backgroundColor: bg, borderColor: border, marginHorizontal: BX },
      ]}
    >
      <Text style={[styles.stepLabel, { color: bodyColor }]}>{stepNum}</Text>
      <Text style={[styles.stepTitle, { color: bodyColor }]}>{title}</Text>
      {bullets.map((b, i) => (
        <Text key={i} style={[styles.bullet, { color: subColor }]}>
          {'• '}
          {b}
        </Text>
      ))}
    </View>
  );
}

// Section bar (EMT or Paramedic)
function SectionBar({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={[
        styles.sectionBar,
        { backgroundColor: bg, marginHorizontal: BX },
      ]}
    >
      <Text style={[styles.sectionBarText, { color }]}>{label}</Text>
    </View>
  );
}

// Arrow component (with arrowhead)
function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}) {
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2 + 4;
  return (
    <>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={C.arrow}
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <SvgText
          x={lx + 10}
          y={ly}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          {label}
        </SvgText>
      )}
    </>
  );
}

// Plain line (no arrowhead)
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
  return (
    <Line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={C.arrow}
      strokeWidth={1.5}
    />
  );
}

// Diamond shape
function Diamond({
  cx: dCX,
  cy: dCY,
  w,
  h,
  text,
  subText,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  text: string;
  subText?: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  const points = `${dCX},${dCY - hh} ${dCX + hw},${dCY} ${dCX},${dCY + hh} ${dCX - hw},${dCY}`;
  return (
    <>
      <Polygon
        points={points}
        fill={C.decBg}
        stroke={C.decBorder}
        strokeWidth={2}
      />
      <SvgText
        x={dCX}
        y={subText ? dCY - 2 : dCY + 4}
        fontSize={11}
        fill={C.decText}
        textAnchor="middle"
        fontWeight="700"
      >
        {text}
      </SvgText>
      {subText && (
        <SvgText
          x={dCX}
          y={dCY + 12}
          fontSize={9.5}
          fill={C.label}
          textAnchor="middle"
        >
          {subText}
        </SvgText>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CardiacArrestShockableFlowchart() {
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

  // ── EMT helpers ──────────────────────────────────────────────────────────
  const E = (
    key: string,
    stepNum: string,
    title: string,
    bullets: string[],
  ) => (
    <StepBox
      onLayout={measure(key)}
      stepNum={stepNum}
      title={title}
      bullets={bullets}
      bg={C.emtBg}
      border={C.emtBorder}
      bodyColor={C.emtTitle}
      subColor={C.emtSub}
    />
  );

  // ── Paramedic helpers ────────────────────────────────────────────────────
  const P = (
    key: string,
    stepNum: string,
    title: string,
    bullets: string[],
  ) => (
    <StepBox
      onLayout={measure(key)}
      stepNum={stepNum}
      title={title}
      bullets={bullets}
      bg={C.paraBg}
      border={C.paraBorder}
      bodyColor={C.paraTitle}
      subColor={C.paraSub}
    />
  );

  // ── SVG overlay ──────────────────────────────────────────────────────────
  function renderSVG() {
    if (REQUIRED_KEYS.some((k) => !L[k])) return null;

    const l = L as Required<LayoutMap>;

    // diamond midpoints
    const d1mid = (l.dec1.top + l.dec1.bot) / 2;
    const d2mid = (l.dec2.top + l.dec2.bot) / 2;
    const d3mid = (l.dec3.top + l.dec3.bot) / 2;

    // total SVG height
    const svgH = l.step12.bot + 80;

    return (
      <Svg
        width={W}
        height={svgH}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <Polygon points="0 0, 8 3, 0 6" fill={C.arrow} />
          </Marker>
        </Defs>

        {/* Title → Excludes */}
        <Arrow x1={cx} y1={l.title.bot} x2={cx} y2={l.excl.top} />

        {/* Excludes → EMT bar */}
        <Arrow x1={cx} y1={l.excl.bot} x2={cx} y2={l.emtBar.top} />

        {/* EMT bar drawn */}
        <Rect
          x={BX}
          y={l.emtBar.top}
          width={BW}
          height={20}
          rx={4}
          fill="#1c2a3a"
          stroke={C.emtBorder}
          strokeWidth={1.5}
        />
        <SvgText
          x={cx}
          y={l.emtBar.top + 14}
          fontSize={11}
          fill={C.emtTitle}
          textAnchor="middle"
          fontWeight="700"
          letterSpacing={1.5}
        >
          EMT
        </SvgText>

        {/* step1 → step2 */}
        <Arrow x1={cx} y1={l.step1.bot} x2={cx} y2={l.step2.top} />

        {/* step2 → step3 */}
        <Arrow x1={cx} y1={l.step2.bot} x2={cx} y2={l.step3.top} />

        {/* step3 → step4 */}
        <Arrow x1={cx} y1={l.step3.bot} x2={cx} y2={l.step4.top} />

        {/* step4 → dec1 */}
        <Arrow x1={DCX} y1={l.step4.bot} x2={DCX} y2={l.dec1.top} />

        {/* dec1 diamond */}
        <Diamond
          cx={DCX}
          cy={d1mid}
          w={DW}
          h={l.dec1.bot - l.dec1.top}
          text="Unwitnessed OR"
          subText="Respiratory/OD/Trauma/Drowning/<8?"
        />

        {/* dec1 YES — down */}
        <Arrow x1={DCX} y1={l.dec1.bot} x2={DCX} y2={l.step6.top} />
        <SvgText
          x={DCX + 14}
          y={(l.dec1.bot + l.step6.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          YES
        </SvgText>

        {/* dec1 NO — right to step5 callout */}
        <Arrow x1={DXR} y1={d1mid} x2={CBX} y2={d1mid} label="NO" />
        {calloutBox(
          d1mid,
          ['≥8 yrs:', 'Passive O₂', '(NRM + OPA or', 'STR passive port)'],
          C.emtBg,
          C.emtBorder,
          C.emtTitle,
        )}

        {/* step5 stub — passive O₂ step is rendered as callout; connect callout to step6 via right-side vertical */}
        {/* step5 measured stub: connect bottom of callout area → step6 */}
        {/* We use a path: right edge of callout down and back left to cx at step6 */}
        <Path
          d={`M ${CBX + CBW / 2} ${d1mid + 28} L ${CBX + CBW / 2} ${l.step6.top + (l.step6.bot - l.step6.top) / 2} L ${cx} ${l.step6.top + (l.step6.bot - l.step6.top) / 2}`}
          stroke={C.arrow}
          strokeWidth={1.5}
          fill="none"
          markerEnd="url(#arrowhead)"
        />

        {/* step6 → paraBar */}
        <Arrow x1={cx} y1={l.step6.bot} x2={cx} y2={l.paraBar.top} />

        {/* PARAMEDIC bar */}
        <Rect
          x={BX}
          y={l.paraBar.top}
          width={BW}
          height={20}
          rx={4}
          fill="#1b2e24"
          stroke={C.paraBorder}
          strokeWidth={1.5}
        />
        <SvgText
          x={cx}
          y={l.paraBar.top + 14}
          fontSize={11}
          fill={C.paraTitle}
          textAnchor="middle"
          fontWeight="700"
          letterSpacing={1.5}
        >
          PARAMEDIC
        </SvgText>

        {/* step7 → step8 */}
        <Arrow x1={cx} y1={l.step7.bot} x2={cx} y2={l.step8.top} />

        {/* step8 → step9 */}
        <Arrow x1={cx} y1={l.step8.bot} x2={cx} y2={l.step9.top} />

        {/* step9 → step10 */}
        <Arrow x1={cx} y1={l.step9.bot} x2={cx} y2={l.step10.top} />

        {/* step10 → dec2 */}
        <Arrow x1={cx} y1={l.step10.bot} x2={cx} y2={l.dec2.top} />

        {/* dec2 diamond — ROSC? */}
        <Diamond
          cx={DCX}
          cy={d2mid}
          w={DW}
          h={l.dec2.bot - l.dec2.top}
          text="ROSC?"
        />

        {/* dec2 YES → step13 ROSC care (right callout) */}
        <Arrow x1={DXR} y1={d2mid} x2={CBX} y2={d2mid} label="YES" />
        {calloutBox(
          d2mid,
          ['→ ROSC Care', 'Protocol', '(Post-Arrest)'],
          C.paraBg,
          C.paraBorder,
          C.paraTitle,
        )}

        {/* dec2 NO → step11 */}
        <Arrow x1={DCX} y1={l.dec2.bot} x2={DCX} y2={l.step11.top} />
        <SvgText
          x={DCX + 14}
          y={(l.dec2.bot + l.step11.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          NO
        </SvgText>

        {/* step11 → dec3 */}
        <Arrow x1={cx} y1={l.step11.bot} x2={cx} y2={l.dec3.top} />

        {/* dec3 diamond — After 4 rounds? */}
        <Diamond
          cx={DCX}
          cy={d3mid}
          w={DW}
          h={l.dec3.bot - l.dec3.top}
          text="After 4 rounds?"
          subText="No ROSC"
        />

        {/* dec3 YES → step12 */}
        <Arrow x1={DCX} y1={l.dec3.bot} x2={DCX} y2={l.step12.top} />
        <SvgText
          x={DCX + 14}
          y={(l.dec3.bot + l.step12.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          YES
        </SvgText>

        {/* dec3 NO — loop back up (left side arc back to step7) */}
        {/* Left-side loop: left of dec3 → up → left of step7 → into step7 left */}
        <Path
          d={`M ${BX + 15} ${d3mid} L ${BX - 12} ${d3mid} L ${BX - 12} ${(l.step7.top + l.step7.bot) / 2} L ${BX + 15} ${(l.step7.top + l.step7.bot) / 2}`}
          stroke={C.arrow}
          strokeWidth={1.5}
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <SvgText
          x={BX - 16}
          y={(d3mid + (l.step7.top + l.step7.bot) / 2) / 2}
          fontSize={10}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
          transform={`rotate(-90, ${BX - 16}, ${(d3mid + (l.step7.top + l.step7.bot) / 2) / 2})`}
        >
          NO — CONTINUE
        </SvgText>

        {/* Footer */}
        <SvgText
          x={cx}
          y={l.step12.bot + 20}
          fontSize={10}
          fill={C.discText}
          textAnchor="middle"
        >
          Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan
          12, 2026
        </SvgText>
        <SvgText
          x={cx}
          y={l.step12.bot + 36}
          fontSize={10}
          fill={C.discText}
          textAnchor="middle"
        >
          Reference aid only — does not replace online medical direction or
          clinical judgment.
        </SvgText>
      </Svg>
    );
  }

  // ── RN layout tree ───────────────────────────────────────────────────────
  return (
    <View
      style={styles.canvas}
      onLayout={(e) => {
        setContainerY(e.nativeEvent.layout.y);
      }}
    >
      {/* Title */}
      <View
        onLayout={measure('title')}
        style={[styles.titleBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.titleText}>
          Cardiac Arrest — Shockable Rhythms
        </Text>
        <Text style={styles.titleSub}>
          VF / Pulseless VT · Adult &amp; Pediatric
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* Exclusions */}
      <View
        onLayout={measure('excl')}
        style={[styles.warnBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.warnTitle}>EXCLUSIONS</Text>
        <Text style={styles.warnBody}>
          • Newborns → Neonatal Resuscitation{'\n'}• DNR / Advanced
          Directive → DNR Protocol{'\n'}• Traumatic cardiac arrest →
          Traumatic Cardiac Arrest TOR
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* ── EMT BAR ────────────────────────────────────────────────────── */}
      <View onLayout={measure('emtBar')} style={{ height: 20, marginHorizontal: BX }} />

      {/* STEP 1 — Compressions */}
      {E(
        'step1',
        'STEP 1',
        'Chest Compressions',
        [
          'Rate: 100–120/min · 200 compressions per round (2 min)',
          'Ensure adequate recoil',
          'Check rhythm every 2 min (pulse check when indicated)',
          'Resume compressions immediately after defibrillation — no pause for pulse check',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 2 — AED */}
      {E(
        'step2',
        'STEP 2',
        'Attach AED',
        [
          'Attach without interrupting compressions',
          'Immediately perform rhythm analysis',
          'Defibrillate if indicated',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 3 — Airway initial */}
      {E(
        'step3',
        'STEP 3',
        'Airway / Oxygenation',
        [
          'Airway management must NOT interrupt compressions',
          'Avoid excessive ventilation volume and pressure',
          'All ventilatory support may be administered asynchronously',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 4 — Special cases note */}
      {E(
        'step4',
        'STEP 4',
        'Ventilation Mode — Assess',
        [
          'Special cases → immediate BVM at 10 bpm:',
          '  Unwitnessed arrest',
          '  Respiratory cause, overdose, trauma, drowning',
          '  Pediatric < 8 years old',
          'All others (≥8 yrs, witnessed, cardiac cause):',
          '  Passive O₂ first (NRM + OPA or STR passive port)',
          '  If no response after 8 min → begin BVM at 10 bpm',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* DECISION 1 — measured stub */}
      <View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />

      {/* STEP 5 is rendered as a callout (NO branch) — stub for layout */}
      <View onLayout={measure('step5')} style={{ height: 4 }} />

      <View style={{ height: GAP }} />

      {/* STEP 6 — BVM / immediate ventilation */}
      {E(
        'step6',
        'STEP 6',
        'Manual Ventilation (BVM or STR)',
        [
          'Rate: 10 breaths/min',
          'Continue compressions with asynchronous ventilation',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* ── PARAMEDIC BAR ─────────────────────────────────────────────── */}
      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />

      {/* STEP 7 — IV/IO + Monitor */}
      {P(
        'step7',
        'STEP 7',
        'IV/IO Access + Monitor',
        [
          'IV/IO access as soon as possible — do NOT interrupt compressions',
          'Apply cardiac monitor/defibrillator',
          'Confirm shockable rhythm (VF / Pulseless VT)',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 8 — Defibrillate */}
      <View
        onLayout={measure('step8')}
        style={[styles.defiBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.defiLabel}>STEP 8</Text>
        <Text style={styles.defiTitle}>⚡ Defibrillate</Text>
        <Text style={styles.defiBullet}>• Per monitor settings</Text>
        <Text style={styles.defiBullet}>
          • Resume compressions immediately after shock
        </Text>
        <View style={styles.defiMonitors}>
          <Text style={styles.defiMon}>Philips MRx</Text>
          <Text style={styles.defiMon}>Stryker LIFEPAK</Text>
          <Text style={styles.defiMon}>Zoll X Series</Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* STEP 9 — Epinephrine */}
      <View
        onLayout={measure('step9')}
        style={[styles.drugBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.drugLabel}>STEP 9</Text>
        <Text style={styles.drugTitle}>Epinephrine</Text>

        {/* Adult dose */}
        <View style={styles.doseRow}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={styles.doseText}>
            1 mg (0.1 mg/mL) IV/IO{'\n'}Every 3–5 min · Max 3 total doses
          </Text>
        </View>

        {/* Peds dose */}
        <View style={[styles.doseRow, { marginTop: 6 }]}>
          <View style={[styles.doseBadge, styles.pedsBadge]}>
            <Text style={[styles.doseBadgeText, { color: C.pedsDrug }]}>
              PEDS
            </Text>
          </View>
          <Text style={[styles.doseText, { color: C.pedsDose }]}>
            0.01 mg/kg (0.1 mg/mL) IV/IO{'\n'}Max dose 1 mg · Every 3–5 min ·
            Max 3 total doses
          </Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* STEP 10 — Shock-refractory drugs */}
      <View
        onLayout={measure('step10')}
        style={[styles.drugBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.drugLabel}>STEP 10</Text>
        <Text style={styles.drugTitle}>
          Shock-Refractory VF / Pulseless VT
        </Text>
        <Text style={styles.drugSub}>
          Consider antiarrhythmic if VF/VT persists after defibrillation:
        </Text>

        {/* Amiodarone */}
        <Text style={styles.drugSubHeader}>Amiodarone (preferred)</Text>
        <View style={styles.doseRow}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={styles.doseText}>
            300 mg IV/IO over 10 min{'\n'}Repeat: 150 mg once at 5 min if
            recurs
          </Text>
        </View>
        <View style={[styles.doseRow, { marginTop: 4 }]}>
          <View style={[styles.doseBadge, styles.pedsBadge]}>
            <Text style={[styles.doseBadgeText, { color: C.pedsDrug }]}>
              PEDS
            </Text>
          </View>
          <Text style={[styles.doseText, { color: C.pedsDose }]}>
            5 mg/kg IV/IO · Max 300 mg{'\n'}May repeat at half dose at 5 min
          </Text>
        </View>

        {/* Lidocaine */}
        <Text style={[styles.drugSubHeader, { marginTop: 8 }]}>
          Lidocaine (alternative)
        </Text>
        <View style={styles.doseRow}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={styles.doseText}>
            1–1.5 mg/kg IV/IO{'\n'}Repeat ½ dose q5 min · Max total 3 mg/kg
          </Text>
        </View>

        {/* Torsades */}
        <View style={[styles.warnBoxInline, { marginTop: 8 }]}>
          <Text style={styles.warnTitleSmall}>Torsades de Pointes</Text>
          <Text style={styles.warnBodySmall}>
            Magnesium Sulfate: 50 mg/kg IV/IO · Max 2 g (adult) over 5 min
          </Text>
        </View>

        {/* Reversible causes */}
        <View style={[styles.critBoxInline, { marginTop: 8 }]}>
          <Text style={styles.critTitleSmall}>
            Consider Reversible Causes (H&apos;s &amp; T&apos;s)
          </Text>
          <Text style={styles.critBodySmall}>
            Hypothermia · Hyperkalemia · Hypovolemia{'\n'}Overdose · Tension
            pneumothorax
          </Text>
          <Text style={[styles.critBodySmall, { marginTop: 4 }]}>
            Hyperkalemia → Calcium Gluconate 100 mg/kg IV/IO (max 2 g) or
            {'\n'}Calcium Chloride 20 mg/kg IV/IO (max 1 g) over 5 min
          </Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* DECISION 2 — ROSC? */}
      <View onLayout={measure('dec2')} style={{ height: 72, marginHorizontal: BX }} />

      {/* ROSC callout stub */}
      <View onLayout={measure('step13')} style={{ height: 4 }} />

      <View style={{ height: GAP }} />

      {/* STEP 11 — Continue resuscitation */}
      {P(
        'step11',
        'STEP 11',
        'Continue Resuscitation',
        [
          'Repeat 2-min compression cycles',
          'Check rhythm / defibrillate every 2 min',
          'Continue Epinephrine every 3–5 min (max 3 total doses)',
          'Reassess for reversible causes each round',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* DECISION 3 — After 4 rounds? */}
      <View onLayout={measure('dec3')} style={{ height: 72, marginHorizontal: BX }} />
      <View style={{ height: GAP }} />

      {/* STEP 12 — TOR / Transport decision */}
      <View
        onLayout={measure('step12')}
        style={[styles.destBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.destLabel}>STEP 12</Text>
        <Text style={styles.destTitle}>Transport / TOR Decision</Text>
        <Text style={styles.destBullet}>
          • Transport to Cardiac Receiving Center (CRC) if ROSC achieved
        </Text>
        <Text style={styles.destBullet}>
          • If no ROSC and ≥4 rounds: consider Non-Traumatic TOR protocol
        </Text>
        <Text style={styles.destBullet}>
          • CRC bypass if: ongoing CPR without ROSC OR CRC adds &gt;15 min
          transport
        </Text>
        <Text style={styles.destBullet}>
          • On ROSC → refer to Post-Cardiac Arrest / ROSC Care protocol
        </Text>
      </View>

      {/* SVG overlay — rendered last so it sits on top */}
      <View style={{ height: 56 }} />
      {ready && renderSVG()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  canvas: {
    width: W,
    backgroundColor: C.bg,
    paddingBottom: 24,
  },

  // Title
  titleBox: {
    backgroundColor: C.destBg,
    borderColor: C.destBorder,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  titleText: {
    color: C.destText,
    fontSize: 17,
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

  // Exclusion / warning box
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warnBody: {
    color: C.label,
    fontSize: 11,
    lineHeight: 18,
  },

  // Inline warning (inside step boxes)
  warnBoxInline: {
    backgroundColor: C.warnBg,
    borderColor: C.warnBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  warnTitleSmall: {
    color: C.warnText,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  warnBodySmall: {
    color: C.label,
    fontSize: 10,
    lineHeight: 16,
  },

  // Critical inline box
  critBoxInline: {
    backgroundColor: C.critBg,
    borderColor: C.critBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  critTitleSmall: {
    color: C.critTitle,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  critBodySmall: {
    color: C.critSub,
    fontSize: 10,
    lineHeight: 15,
  },

  // Generic step box
  stepBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 11,
    lineHeight: 18,
  },

  // Section bar (EMT / PARAMEDIC)
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

  // Defibrillate box (prominent red/orange)
  defiBox: {
    backgroundColor: C.destBg,
    borderColor: '#d62828',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  defiLabel: {
    color: C.paraTitle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  defiTitle: {
    color: C.destText,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  defiBullet: {
    color: C.label,
    fontSize: 11,
    lineHeight: 18,
  },
  defiMonitors: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  defiMon: {
    color: C.warnText,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: C.warnBg,
    borderColor: C.warnBorder,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Drug box
  drugBox: {
    backgroundColor: C.paraBg,
    borderColor: C.paraBorder,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  drugLabel: {
    color: C.paraTitle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  drugTitle: {
    color: C.paraTitle,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  drugSub: {
    color: C.paraSub,
    fontSize: 11,
    marginBottom: 4,
  },
  drugSubHeader: {
    color: C.critTitle,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  doseBadge: {
    backgroundColor: '#1c2a3a',
    borderColor: C.emtBorder,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 44,
    alignItems: 'center',
    marginTop: 2,
  },
  pedsBadge: {
    backgroundColor: C.pedsBg,
    borderColor: C.pedsBorder,
  },
  doseBadgeText: {
    color: C.emtTitle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doseText: {
    color: C.paraSub,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },

  // Destination box
  destBox: {
    backgroundColor: '#1a0a0a',
    borderColor: C.paraBorder,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  destLabel: {
    color: C.paraTitle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  destTitle: {
    color: C.paraTitle,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  destBullet: {
    color: C.paraSub,
    fontSize: 11,
    lineHeight: 18,
  },
});
