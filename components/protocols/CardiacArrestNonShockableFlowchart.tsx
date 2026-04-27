// CardiacArrestNonShockableFlowchart.tsx
// Cardiac Arrest — Non-Shockable Rhythms (Asystole / PEA): Adult & Pediatric
// Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
// Architecture: v2 — onLayout measurements + SVG overlay
// Sister protocol to CardiacArrestShockableFlowchart.tsx — structure mirrored
// for paramedic familiarity, with H's & T's grid replacing defib/antiarrhythmic
// branch.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Line,
  Rect,
  Polygon,
  Text as SvgText,
  Defs,
  Marker,
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
const DXR = 255;

// Callout box (right side)
const CBW = 140;
const CBX = 315;

// Wide callout (Passive O₂, ROSC care)
const CBW_D1 = 170;
const CBX_D1 = 285;

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
  // Critical / drug
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
  destSub: '#e89b9b',
  // Pediatric
  pedsBg: '#0a1a2a',
  pedsBorder: '#1f6feb',
  pedsDrug: '#58a6ff',
  pedsDose: '#a5d6ff',
  // Warn / amber
  warnBg: '#1a1400',
  warnBorder: '#9e6a03',
  warnText: '#d29922',
  // Purple — NEW (Non-Shockable: H's & T's grid accent)
  // Use sparingly; reserved for "this is the differentiating clinical move"
  purpleBg: '#1c1029',
  purpleBorder: '#8957e5',
  purpleTitle: '#d2a8ff',
  purpleSub: '#b083f0',
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
  'step1',  // Compressions
  'step2',  // AED (no shock advised → confirms non-shockable)
  'step3',  // Airway / Oxygenation
  'dec1',   // Witnessed ≥8 yrs?
  'step4',  // Manual Ventilation
  'paraBar',
  'step5',  // IV/IO + Monitor
  'step6',  // Epinephrine
  'step7',  // H's & T's Reversible Causes Grid
  'dec2',   // ROSC? (mid-cycle)
  'step8',  // Continue Resuscitation (4 rounds 🔄)
  'dec3',   // ROSC? After 4 rounds
  'step9',  // Transport Decision (grey, w/ TOR jump-out)
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CALLOUT_LINE_H = 12;
const CALLOUT_PAD = 8;

// Wide callout — per-line styling, CBW_D1 wide
interface CalloutLine { text: string; color: string; weight: '400' | '600' | '700' }
function wideCalloutBox(
  midY: number,
  lines: CalloutLine[],
  bg: string,
  border: string,
) {
  const textBlockH = (lines.length - 1) * CALLOUT_LINE_H + 10;
  const boxH = textBlockH + CALLOUT_PAD * 2;
  const top = midY - boxH / 2;
  const firstBaselineY = top + CALLOUT_PAD + 8;
  return (
    <>
      <Rect
        x={CBX_D1}
        y={top}
        width={CBW_D1}
        height={boxH}
        rx={6}
        fill={bg}
        stroke={border}
        strokeWidth={1.5}
      />
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={CBX_D1 + CBW_D1 / 2}
          y={firstBaselineY + i * CALLOUT_LINE_H}
          fontSize={11}
          fill={line.color}
          textAnchor="middle"
          fontWeight={line.weight}
        >
          {line.text}
        </SvgText>
      ))}
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Generic step box
function StepBox({
  stepNum,
  title,
  bullets,
  bg,
  border,
  bodyColor,
  subColor,
  scope,
  onLayout,
}: {
  stepNum: string;
  title: string;
  bullets: string[];
  bg: string;
  border: string;
  bodyColor: string;
  subColor: string;
  scope?: 'EMT' | 'PARAMEDIC';
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
      <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: subColor }]}>{stepNum}</Text>
        {scope && <ScopeBadge scope={scope} />}
      </View>
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

// Arrow component (with arrowhead)
function Arrow({
  x1, y1, x2, y2, label,
}: {
  x1: number; y1: number; x2: number; y2: number; label?: string;
}) {
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2 + 4;
  return (
    <>
      <Line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={C.arrow}
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <SvgText
          x={lx + 10} y={ly}
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
  x1, y1, x2, y2,
}: {
  x1: number; y1: number; x2: number; y2: number;
}) {
  return (
    <Line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={C.arrow}
      strokeWidth={1.5}
    />
  );
}

// Scope badge (top-right corner of step boxes)
// `tone` overrides the default color:
//   'default' → EMT (white) / PARAMEDIC (green)
//   'orange'  → matches orange drug-admin boxes
//   'red'     → matches red defibrillate / destination boxes
function ScopeBadge({
  scope,
  tone = 'default',
}: {
  scope: 'EMT' | 'PARAMEDIC';
  tone?: 'default' | 'orange' | 'red';
}) {
  let color: string;
  let borderColor: string;
  if (tone === 'orange') {
    color = C.critTitle;
    borderColor = C.critBorder;
  } else if (tone === 'red') {
    color = C.destText;
    borderColor = C.destBorder;
  } else {
    color = scope === 'EMT' ? C.emtTitle : C.paraTitle;
    borderColor = scope === 'EMT' ? C.emtBorder : C.paraBorder;
  }
  return (
    <View style={[styles.scopeBadge, { borderColor }]}>
      <Text style={[styles.scopeBadgeText, { color }]}>{scope}</Text>
    </View>
  );
}

// Diamond (decision)
function Diamond({
  cx: dCX,
  cy: dCY,
  w,
  h,
  text,
  subText,
  textSize = 11,
  subTextSize = 11,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  text: string;
  subText?: string;
  textSize?: number;
  subTextSize?: number;
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
        y={subText ? dCY - 3 : dCY + 4}
        fontSize={textSize}
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
          fontSize={subTextSize}
          fill={C.emtTitle}
          textAnchor="middle"
          fontWeight="600"
        >
          {subText}
        </SvgText>
      )}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CardiacArrestNonShockableFlowchart() {
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

  // ── EMT helper ────────────────────────────────────────────────────────────
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
      scope="EMT"
    />
  );

  // ── Paramedic helper ──────────────────────────────────────────────────────
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
      scope="PARAMEDIC"
    />
  );

  // ── SVG overlay ───────────────────────────────────────────────────────────
  function renderSVG() {
    if (REQUIRED_KEYS.some((k) => !L[k])) return null;

    const l = L as Record<string, { top: number; bot: number }>;

    // Diamond midpoints
    const d1mid = (l.dec1.top + l.dec1.bot) / 2;
    const d2mid = (l.dec2.top + l.dec2.bot) / 2;
    const d3mid = (l.dec3.top + l.dec3.bot) / 2;

    // Total SVG height — content ends at step9.bot; RN footer follows
    const svgH = l.step9.bot + 20;

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

        {/* step3 → dec1 (DCX) */}
        <Arrow x1={DCX} y1={l.step3.bot} x2={DCX} y2={l.dec1.top} />

        {/* dec1 diamond — Witnessed cardiac arrest, ≥8 yrs? */}
        <Diamond
          cx={DCX}
          cy={d1mid}
          w={DW}
          h={l.dec1.bot - l.dec1.top}
          text="Witnessed cardiac arrest,"
          subText="≥8 yrs?"
        />

        {/* dec1 NO → step4 (immediate BVM)
            Label "NO" sits slightly RIGHT of vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec1.bot} x2={DCX} y2={l.step4.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec1.bot + l.step4.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* dec1 YES → Passive O₂ callout (no arrowhead — terminal callout)
            Label "YES" sits ABOVE horizontal line per convention. */}
        <ConnLine x1={DXR} y1={d1mid} x2={CBX_D1} y2={d1mid} />
        <SvgText
          x={(DXR + CBX_D1) / 2}
          y={d1mid - 6}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          YES
        </SvgText>

        {/* Passive O₂ callout — mirrors Shockable exactly */}
        {(() => {
          const titleSize = 12;
          const subSize = 11;
          const warnSize = 11;
          const lineGap = 4;
          const padTop = 10;
          const padBot = 10;
          const sectionGap = 6;
          const boxH =
            padTop +
            titleSize +
            lineGap +
            subSize +
            sectionGap +
            warnSize +
            lineGap +
            warnSize +
            padBot;
          const top = d1mid - boxH / 2;
          const centerX = CBX_D1 + CBW_D1 / 2;
          let y = top + padTop + titleSize - 2;
          return (
            <>
              <Rect
                x={CBX_D1}
                y={top}
                width={CBW_D1}
                height={boxH}
                rx={6}
                fill={C.emtBg}
                stroke={C.emtBorder}
                strokeWidth={1.5}
              />
              <SvgText
                x={centerX}
                y={y}
                fontSize={titleSize}
                fill={C.emtTitle}
                textAnchor="middle"
                fontWeight="800"
              >
                Passive O₂
              </SvgText>
              <SvgText
                x={centerX}
                y={(y += lineGap + subSize)}
                fontSize={subSize}
                fill={C.emtSub}
                textAnchor="middle"
              >
                (NRB + OPA or SGA)
              </SvgText>
              <SvgText
                x={centerX}
                y={(y += sectionGap + warnSize)}
                fontSize={warnSize}
                fill={C.critSub}
                textAnchor="middle"
                fontWeight="600"
              >
                If no response 8 min,
              </SvgText>
              <SvgText
                x={centerX}
                y={(y += lineGap + warnSize)}
                fontSize={warnSize}
                fill={C.critSub}
                textAnchor="middle"
                fontWeight="800"
              >
                → Step 4 (active BVM)
              </SvgText>
            </>
          );
        })()}

        {/* step4 → paraBar */}
        <Arrow x1={cx} y1={l.step4.bot} x2={cx} y2={l.paraBar.top} />

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

        {/* step5 → step6 */}
        <Arrow x1={cx} y1={l.step5.bot} x2={cx} y2={l.step6.top} />

        {/* step6 → step7 */}
        <Arrow x1={cx} y1={l.step6.bot} x2={cx} y2={l.step7.top} />

        {/* step7 → dec2 (DCX) */}
        <Arrow x1={DCX} y1={l.step7.bot} x2={DCX} y2={l.dec2.top} />

        {/* dec2 diamond — ROSC? (mid-cycle) */}
        <Diamond
          cx={DCX}
          cy={d2mid}
          w={DW}
          h={l.dec2.bot - l.dec2.top}
          text="ROSC?"
        />

        {/* dec2 YES → ROSC Care callout (right) */}
        <Arrow x1={DXR} y1={d2mid} x2={CBX_D1} y2={d2mid} />
        <SvgText
          x={(DXR + CBX_D1) / 2}
          y={d2mid - 6}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          YES
        </SvgText>
        {wideCalloutBox(
          d2mid,
          [
            { text: '→ ROSC Care Protocol', color: C.paraTitle, weight: '700' },
            { text: '(Post-Arrest)', color: C.paraTitle, weight: '600' },
            { text: 'Transport to CRC', color: C.emtTitle, weight: '700' },
            { text: '(or closest if >15 min)', color: C.emtTitle, weight: '700' },
          ],
          C.paraBg,
          C.paraBorder,
        )}

        {/* dec2 NO → step8 */}
        <Arrow x1={DCX} y1={l.dec2.bot} x2={DCX} y2={l.step8.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec2.bot + l.step8.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* step8 → dec3 */}
        <Arrow x1={DCX} y1={l.step8.bot} x2={DCX} y2={l.dec3.top} />

        {/* dec3 diamond — ROSC? (After 4 rounds) */}
        <Diamond
          cx={DCX}
          cy={d3mid}
          w={DW}
          h={l.dec3.bot - l.dec3.top}
          text="ROSC?"
          subText="(After 4 rounds)"
          textSize={14}
          subTextSize={10}
        />

        {/* dec3 NO → step9 (Transport Decision) */}
        <Arrow x1={DCX} y1={l.dec3.bot} x2={DCX} y2={l.step9.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec3.bot + l.step9.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* dec3 YES → ROSC Care callout (right, no arrowhead — terminal) */}
        <ConnLine x1={DXR} y1={d3mid} x2={CBX_D1} y2={d3mid} />
        <SvgText
          x={(DXR + CBX_D1) / 2}
          y={d3mid - 6}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          YES
        </SvgText>
        {wideCalloutBox(
          d3mid,
          [
            { text: '→ ROSC Care Protocol', color: C.paraTitle, weight: '700' },
            { text: '(Post-Arrest)', color: C.paraTitle, weight: '600' },
            { text: 'Transport to CRC', color: C.emtTitle, weight: '700' },
            { text: '(or closest if >15 min)', color: C.emtTitle, weight: '700' },
          ],
          C.paraBg,
          C.paraBorder,
        )}
      </Svg>
    );
  }

  // ── RN layout tree ────────────────────────────────────────────────────────
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
          Cardiac Arrest — Non-Shockable Rhythms
        </Text>
        <Text style={styles.titleSub}>
          Asystole / PEA · Adult &amp; Pediatric
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

      {/* ── EMT BAR ─────────────────────────────────────────────────────── */}
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
          'Minimize interruptions to compressions',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 2 — AED (no shock advised confirms non-shockable) */}
      <View
        onLayout={measure('step2')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 2</Text>
          <ScopeBadge scope="EMT" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>
          Attach AED
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Attach without interrupting compressions
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Immediately perform rhythm analysis
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          •{' '}
          <Text style={{ color: C.decText, fontWeight: '700' }}>
            “No shock advised”
          </Text>{' '}
          confirms non-shockable rhythm (Asystole / PEA)
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* STEP 3 — Airway / Oxygenation */}
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

      {/* DECISION 1 — measured stub */}
      <View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />

      <View style={{ height: GAP }} />

      {/* STEP 4 — Manual Ventilation */}
      <View
        onLayout={measure('step4')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 4</Text>
          <ScopeBadge scope="EMT" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>
          Manual Ventilation (BVM or STR)
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Rate: 10 breaths/min
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Continue compressions with asynchronous ventilation
        </Text>
        <Text style={[styles.causeNote, { marginTop: 6 }]}>
          ⚠ Consider cause:{'\n'}Unwitnessed • Respiratory • Overdose • Trauma • Drowning • &lt;8 yrs
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* ── PARAMEDIC BAR ───────────────────────────────────────────────── */}
      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />

      {/* STEP 5 — IV/IO + Monitor */}
      {P(
        'step5',
        'STEP 5',
        'IV/IO Access + Monitor',
        [
          'IV/IO access ASAP — do NOT interrupt compressions',
          'Apply cardiac monitor / defibrillator',
          'Confirm rhythm: Asystole or PEA',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* STEP 6 — Epinephrine (orange drug box) */}
      <View
        onLayout={measure('step6')}
        style={[styles.drugBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.drugLabel}>STEP 6</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={styles.drugTitle}>Epinephrine</Text>
        <Text style={[styles.drugSub, { color: C.label }]}>
          First-line ACLS drug for non-shockable rhythms
        </Text>

        {/* Adult dose */}
        <View style={[styles.doseRow, { marginTop: 4 }]}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={[styles.doseText, { color: C.critTitle }]}>
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

      {/* STEP 7 — H's & T's Reversible Causes Grid (PARAMEDIC green outer
          box, purple-bordered grid sub-box as the differentiating accent) */}
      <View
        onLayout={measure('step7')}
        style={[
          styles.stepBox,
          { backgroundColor: C.paraBg, borderColor: C.paraBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.paraSub }]}>STEP 7</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.paraTitle }]}>
          Identify &amp; Treat Reversible Causes
        </Text>
        <Text style={[styles.htSubtitle, { color: C.paraSub }]}>
          H&apos;s &amp; T&apos;s — assess each round
        </Text>

        {/* Two-column grid — purple accent */}
        <View style={styles.htGrid}>
          {/* H's column */}
          <View style={styles.htCol}>
            <Text style={styles.htColTitle}>6 H&apos;s</Text>
            <View style={styles.htDivider} />
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Hypovolemia</Text> → IV Fluids
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Hypoxia</Text> → Ventilate
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Acidosis (H⁺)</Text> → Ventilate
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Hyperkalemia</Text> →{' '}
              <Text style={styles.htHilite}>Calcium ↓</Text>
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Hypothermia</Text> → Warm pt
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Hypoglycemia</Text> → Check BGL
            </Text>
          </View>

          {/* T's column */}
          <View style={styles.htCol}>
            <Text style={styles.htColTitle}>6 T&apos;s</Text>
            <View style={styles.htDivider} />
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Tension Pneumo</Text> →{' '}
              <Text style={styles.htHilite}>Needle decomp</Text>
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Tamponade</Text> → Transport
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Toxins</Text> → OD protocol
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Thrombosis (MI)</Text> → CRC
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Thrombosis (PE)</Text> → Fluids, transport
            </Text>
            <Text style={styles.htItem}>
              <Text style={styles.htCause}>Trauma</Text> → Trauma protocol
            </Text>
          </View>
        </View>

        {/* Hyperkalemia drug callout — orange (only Red-Book-specified ALS drug
            from the H's & T's list) */}
        <View style={[styles.hyperKBox, { marginTop: 8 }]}>
          <Text style={styles.hyperKTitle}>Hyperkalemia Treatment</Text>
          <Text style={styles.hyperKDose}>
            Calcium Gluconate: 100 mg/kg IV/IO · Max 2 g over 5 min{'\n'}
            <Text style={{ color: C.label }}>or</Text>{' '}
            Calcium Chloride: 20 mg/kg IV/IO · Max 1 g over 5 min
          </Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* DECISION 2 — ROSC? (mid-cycle) */}
      <View onLayout={measure('dec2')} style={{ height: 72, marginHorizontal: BX }} />

      <View style={{ height: GAP }} />

      {/* STEP 8 — Continue Resuscitation */}
      <View
        onLayout={measure('step8')}
        style={[
          styles.stepBox,
          { backgroundColor: C.paraBg, borderColor: C.paraBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.paraSub }]}>STEP 8</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.paraTitle }]}>
          Continue Resuscitation
        </Text>
        <View style={styles.endpointRow}>
          <Text style={[styles.stepEndpoint, { color: C.emtTitle, marginBottom: 0 }]}>
            4 Rounds OR until ROSC
          </Text>
          <Text style={styles.cycleIcon}>  🔄</Text>
        </View>
        <Text style={[styles.cycleSub, { color: C.emtSub }]}>
          Compressions / rhythm check / Epi (max 3) / reassess H&apos;s &amp; T&apos;s
        </Text>
        <View style={{ height: 8 }} />
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Repeat 2-min compression cycles
          <Text style={styles.backRef}>  → Step 1</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Check rhythm every 2 min · defibrillate ONLY if rhythm converts to VF/VT
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          •{' '}
          <Text style={{ color: C.critTitle }}>
            Continue Epinephrine every 3–5 min
          </Text>{' '}
          <Text style={{ color: C.emtTitle, fontWeight: '700' }}>
            (max 3 total doses)
          </Text>
          <Text style={styles.backRef}>  → Step 6</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          •{' '}
          <Text style={{ color: C.purpleTitle, fontWeight: '700' }}>
            Reassess H&apos;s &amp; T&apos;s
          </Text>{' '}
          each round
          <Text style={styles.backRef}>  → Step 7</Text>
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* DECISION 3 — ROSC? After 4 rounds */}
      <View onLayout={measure('dec3')} style={{ height: 72, marginHorizontal: BX }} />

      <View style={{ height: GAP }} />

      {/* STEP 9 — Transport Decision (grey, with TOR jump-out) */}
      <View
        onLayout={measure('step9')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 9</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Transport Decision</Text>

        {/* TOR jump-out sub-box — red palette, references separate TOR protocol */}
        <View style={[styles.torJumpBox, { marginTop: 4, marginBottom: 8 }]}>
          <Text style={styles.torJumpTitle}>
            No ROSC after 4 rounds, criteria met?
          </Text>
          <Text style={styles.torJumpBody}>
            → See <Text style={{ fontWeight: '700' }}>Non-Traumatic TOR</Text> protocol
          </Text>
        </View>

        {/* Bullet 1 — narrow complex PEA, rate >40, 60-min rule */}
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.warnText, fontWeight: '700' }}>Narrow complex PEA, rate &gt; 40</Text> → Continue resuscitation up to 60 min from dispatch
        </Text>
        {/* Bullet 2 — ROSC achieved */}
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.paraTitle, fontWeight: '700' }}>ROSC achieved</Text> → Transport to Cardiac Receiving Center (CRC); refer to Post-Cardiac Arrest / ROSC Care
        </Text>
        {/* Bullet 3 — CRC bypass */}
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.emtTitle, fontWeight: '700' }}>CRC bypass</Text> if ongoing CPR without ROSC OR CRC adds &gt;15 min transport → closest appropriate facility
        </Text>
      </View>

      {/* TOR reminder block */}
      <View style={{ height: GAP }} />
      <View style={[styles.torReminderBox, { marginHorizontal: BX }]}>
        <Text style={[styles.torReminderTitle, { textAlign: 'center' }]}>
          ⚠ TOR Exclusions — Do not terminate without OLMD
        </Text>
        <Text style={[styles.torReminderBody, { textAlign: 'center' }]}>
          Hypothermia · Lightning strike · Submersion / drowning · Age &lt; 18
        </Text>
        <Text style={[styles.torReminderBody, { marginTop: 4, color: C.destText, fontWeight: '700', textAlign: 'center' }]}>
          All TOR requires on-line medical direction.
        </Text>
      </View>

      {/* Acronym glossary */}
      <View style={{ height: 14 }} />
      <View style={[styles.acronymBox, { marginHorizontal: BX }]}>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>ROSC</Text> — Return of Spontaneous Circulation
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>CRC</Text> — Cardiac Receiving Center
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>TOR</Text> — Termination of Resuscitation
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>OLMD</Text> — On-Line Medical Direction
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>PEA</Text> — Pulseless Electrical Activity
        </Text>
      </View>

      {/* Disclaimer footer */}
      <View style={{ height: 20 }} />
      <Text style={styles.footerLine}>
        Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
      </Text>
      <Text style={styles.footerLine}>
        Reference aid only — does not replace online medical direction or clinical judgment.
      </Text>

      {/* SVG overlay — rendered last so it sits on top */}
      <View style={{ height: 24 }} />
      {ready && renderSVG()}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  canvas: {
    width: W,
    backgroundColor: C.bg,
    paddingBottom: 24,
  },

  // Title
  titleBox: {
    backgroundColor: 'transparent',
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warnBody: {
    color: C.label,
    fontSize: 12,
    lineHeight: 16,
  },

  // Generic step box
  stepBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
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
  stepEndpoint: {
    color: C.warnText,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  cycleSub: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cycleIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
  backRef: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#6e7681',
    fontWeight: '400',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Scope badge (top-right corner of step boxes)
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

  // Step header row (step label left, scope badge right)
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  // Drug box — ORANGE (matches Shockable Step 7)
  drugBox: {
    backgroundColor: C.critBg,
    borderColor: C.critBorder,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  drugLabel: {
    color: C.critSub,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  drugTitle: {
    color: C.critTitle,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  drugSub: {
    color: C.critSub,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 4,
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
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  causeNote: {
    fontSize: 11,
    lineHeight: 17,
    color: C.critTitle,
    fontWeight: '700',
  },

  // ─── H's & T's grid (Step 7) — PURPLE accent ──────────────────────────
  htSubtitle: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  htGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  htCol: {
    flex: 1,
    backgroundColor: C.purpleBg,
    borderColor: C.purpleBorder,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  htColTitle: {
    color: C.purpleTitle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  htDivider: {
    height: 1,
    backgroundColor: C.purpleBorder,
    opacity: 0.5,
    marginVertical: 6,
  },
  htItem: {
    color: C.emtSub,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 1,
  },
  htCause: {
    color: C.purpleSub,
    fontWeight: '700',
  },
  htHilite: {
    color: C.critTitle,
    fontWeight: '700',
  },

  // Hyperkalemia drug callout (inside Step 7) — orange palette
  hyperKBox: {
    backgroundColor: C.critBg,
    borderColor: C.critBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  hyperKTitle: {
    color: C.critTitle,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  hyperKDose: {
    color: C.critSub,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  // TOR jump-out sub-box — inside Step 9, references separate TOR protocol
  torJumpBox: {
    backgroundColor: C.destBg,
    borderColor: C.destBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  torJumpTitle: {
    color: C.destText,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  torJumpBody: {
    color: C.emtTitle,
    fontSize: 11,
    lineHeight: 15,
  },

  // TOR reminder block — standalone clinical warning below Step 9
  torReminderBox: {
    backgroundColor: C.warnBg,
    borderColor: C.warnBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  torReminderTitle: {
    color: C.warnText,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  torReminderBody: {
    color: C.emtTitle,
    fontSize: 11,
    lineHeight: 15,
  },

  // Footer lines — RN-rendered
  footerLine: {
    color: C.discText,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Acronym glossary
  acronymBox: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  acronymLine: {
    color: C.emtSub,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  acronymKey: {
    color: C.emtTitle,
    fontWeight: '700',
  },
});
