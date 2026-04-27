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

// Diamond 1 callout — wider, self-contained passive O₂ box
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
  destSub: '#e89b9b',
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
// Internal keys retain original names; display labels (STEP 1, STEP 2...) renumbered after
// removing the old "Ventilation Mode" box (was step4) and the unused step5 stub.
const REQUIRED_KEYS = [
  'title',
  'excl',
  'emtBar',
  'step1',      // display: STEP 1 — Compressions
  'step2',      // display: STEP 2 — AED
  'step3',      // display: STEP 3 — Airway / Oxygenation
  'dec1',       // Decision: Witnessed cardiac arrest, ≥8 yrs?
  'step6',      // display: STEP 4 — Manual Ventilation (BVM)
  'paraBar',
  'step7',      // display: STEP 5 — IV/IO + Monitor
  'step8',      // display: STEP 6 — Defibrillate
  'step9',      // display: STEP 7 — Epinephrine
  'step10',     // display: STEP 8 — Shock-refractory
  'dec2',       // Decision: ROSC?
  'step11',     // display: STEP 9 — Continue resuscitation
  'dec3',       // Decision: After 4 rounds?
  'step12',     // display: STEP 10 — TOR / Transport
  'step13',     // ROSC care (callout stub)
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
          fontSize={11}
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

// ── Wide ROSC callout — per-line styling, wider box for transport annotation ──
// Each line carries its own color + weight. Used for both dec2 and dec3 YES
// callouts so they render identically. Box width CBW_D1 (170) to fit the
// "Transport to CRC..." annotation line.
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
      {/* Two-line: center the text block on dCY
          Main line: baseline at dCY - 3
          Sub line:  baseline at dCY + 12
          Visual block centerline ≈ dCY. */}
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

// ─── CircleArrow: small inline circular-arrow icon (cycle indicator) ─────────
// Inline SVG sized to sit next to 12pt text. Stroked circle (~270° arc) with a
// small arrowhead at the end to indicate rotation. Used on Step 9's
// "4 Rounds OR until ROSC" endpoint line.
function CircleArrow({ size = 14, color = '#e6edf3', strokeWidth = 1.8 }:
  { size?: number; color?: string; strokeWidth?: number }) {
  // viewBox 24×24, centered at 12,12, radius 8
  // Arc from 45° (top-right) sweeping clockwise back around to ~0° (right),
  // leaving a small gap for the arrowhead to sit visually at the start.
  // Path: M (start) A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Main arc — clockwise, ~300° sweep */}
      <Path
        d="M 17.66 6.34 A 8 8 0 1 1 6.34 6.34"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Arrowhead at the end of the arc (top-right area) */}
      <Path
        d="M 17.66 6.34 L 14.5 5.2 M 17.66 6.34 L 16.6 9.6"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
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
      scope="EMT"
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
      scope="PARAMEDIC"
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

    // total SVG height — SVG content now ends at step12.bot (footer moved to RN)
    const svgH = l.step12.bot + 20;

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

        {/* step3 → dec1 (Ventilation Mode assessment box removed — diamond now assesses directly) */}
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

        {/* dec1 NO — down to step6 (immediate BVM: unwitnessed / resp / OD / trauma / drowning / <8)
            Label "NO" sits slightly RIGHT of the vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec1.bot} x2={DCX} y2={l.step6.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec1.bot + l.step6.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* dec1 YES — right to passive O₂ callout (NO arrowhead — callout is terminal)
            Label "YES" sits ABOVE the horizontal line per convention. */}
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

        {/* Passive O₂ callout — custom (self-contained, mixed colors)
            Layout:
              Line 1: "Passive O₂"            (title, 14pt, white)
              Line 2: "(NRB + OPA or SGA)"     (subtitle, 10pt, dim)
              Line 3: "If no response 8 min,"  (warn, orange)
              Line 4: "→ Step 4 (active BVM)"  (warn, orange, bold)        */}
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
          let y = top + padTop + titleSize - 2; // baseline of title
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
              {/* Title */}
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
              {/* Subtitle */}
              <SvgText
                x={centerX}
                y={(y += lineGap + subSize)}
                fontSize={subSize}
                fill={C.emtSub}
                textAnchor="middle"
              >
                (NRB + OPA or SGA)
              </SvgText>
              {/* Warn line 1 */}
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
              {/* Warn line 2 */}
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

        {/* step10 → dec2 (enter diamond at DCX) */}
        <Arrow x1={DCX} y1={l.step10.bot} x2={DCX} y2={l.dec2.top} />

        {/* dec2 diamond — ROSC? */}
        <Diamond
          cx={DCX}
          cy={d2mid}
          w={DW}
          h={l.dec2.bot - l.dec2.top}
          text="ROSC?"
        />

        {/* dec2 YES → ROSC care (right callout — wide variant)
            Label "YES" sits ABOVE the horizontal line per convention. */}
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

        {/* dec2 NO → step11
            Label "NO" sits slightly RIGHT of the vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec2.bot} x2={DCX} y2={l.step11.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec2.bot + l.step11.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* step11 → dec3 (enter diamond at DCX) */}
        <Arrow x1={DCX} y1={l.step11.bot} x2={DCX} y2={l.dec3.top} />

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

        {/* dec3 NO → step12 (TOR / Transport)
            Label "NO" sits slightly RIGHT of the vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec3.bot} x2={DCX} y2={l.step12.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec3.bot + l.step12.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
        </SvgText>

        {/* dec3 YES → ROSC Care Protocol (right-side callout, matches dec2)
            Label "YES" sits ABOVE the horizontal line per convention. */}
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
          Cardiac Arrest — ⚡ Shockable Rhythms
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

      {/* DECISION 1 — measured stub (flow: STEP 3 → Diamond 1 directly) */}
      <View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />

      <View style={{ height: GAP }} />

      {/* STEP 4 — Manual Ventilation (internally keyed as 'step6') */}
      <View
        onLayout={measure('step6')}
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

      {/* ── PARAMEDIC BAR ─────────────────────────────────────────────── */}
      <View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />

      {/* Display: STEP 5 — IV/IO + Monitor (internally 'step7') */}
      {P(
        'step7',
        'STEP 5',
        'IV/IO Access + Monitor',
        [
          'IV/IO access as soon as possible — do NOT interrupt compressions',
          'Apply cardiac monitor/defibrillator',
          'Confirm shockable rhythm (VF / Pulseless VT)',
        ],
      )}

      <View style={{ height: GAP }} />

      {/* Display: STEP 6 — Defibrillate (internally 'step8') — red destination/alert style */}
      <View
        onLayout={measure('step8')}
        style={[styles.defiBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.defiLabel}>STEP 6</Text>
          <ScopeBadge scope="PARAMEDIC" tone="red" />
        </View>
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

      {/* Display: STEP 7 — Epinephrine (internally 'step9') — orange + PARAMEDIC badge */}
      <View
        onLayout={measure('step9')}
        style={[styles.drugBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.drugLabel}>STEP 7</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={styles.drugTitle}>Epinephrine</Text>

        {/* Adult dose */}
        <View style={styles.doseRow}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={[styles.doseText, { color: C.critTitle }]}>
            1 mg (0.1 mg/mL) IV/IO{'\n'}Every 3–5 min · Max 3 total doses
          </Text>
        </View>

        {/* Peds dose — stays blue */}
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

      {/* Display: STEP 8 — Refractory VF/VT (internally 'step10') — orange + PARAMEDIC badge */}
      <View
        onLayout={measure('step10')}
        style={[styles.drugBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.drugLabel}>STEP 8</Text>
          <ScopeBadge scope="PARAMEDIC" tone="orange" />
        </View>
        <Text style={[styles.drugTitle, { color: C.emtTitle }]}>
          Refractory VF / Pulseless VT (After shock)
        </Text>
        <Text style={[styles.drugSub, { color: C.label }]}>
          Consider antiarrhythmic if VF/VT persists after defibrillation:
        </Text>

        {/* Amiodarone */}
        <Text style={styles.drugSubHeader}>Amiodarone (preferred)</Text>
        <View style={styles.doseRow}>
          <View style={styles.doseBadge}>
            <Text style={styles.doseBadgeText}>ADULT</Text>
          </View>
          <Text style={[styles.doseText, { color: C.critTitle }]}>
            300 mg IV/IO over 10 min{'\n'}Repeat: 150 mg once at 5 min if recurs
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
          <Text style={[styles.doseText, { color: C.critTitle }]}>
            1–1.5 mg/kg IV/IO{'\n'}Repeat ½ dose q5 min · Max total 3 mg/kg
          </Text>
        </View>

        {/* Torsades — gray sub-box, mag dose orange */}
        <View style={[styles.torsadesBox, { marginTop: 8 }]}>
          <Text style={styles.torsadesTitle}>Torsades de Pointes</Text>
          <Text style={styles.torsadesDose}>
            Magnesium Sulfate: 50 mg/kg IV/IO · Max 2 g (adult) over 5 min
          </Text>
        </View>

        {/* Reversible causes — white title, gray body, Ca doses orange */}
        <View style={[styles.revCausesBox, { marginTop: 8 }]}>
          <Text style={styles.revCausesTitle}>
            Consider Reversible Causes (H&apos;s &amp; T&apos;s)
          </Text>
          <Text style={styles.revCausesBody}>
            Hypothermia · Hyperkalemia · Hypovolemia{'\n'}Overdose · Tension pneumothorax
          </Text>
          <Text style={[styles.revCausesDose, { marginTop: 4 }]}>
            Hyperkalemia → Calcium Gluconate 100 mg/kg IV/IO (max 2 g) or{'\n'}Calcium Chloride 20 mg/kg IV/IO (max 1 g) over 5 min
          </Text>
        </View>
      </View>

      <View style={{ height: GAP }} />

      {/* DECISION 2 — ROSC? */}
      <View onLayout={measure('dec2')} style={{ height: 72, marginHorizontal: BX }} />

      {/* ROSC callout stub */}
      <View onLayout={measure('step13')} style={{ height: 4 }} />

      <View style={{ height: GAP }} />

      {/* Display: STEP 9 — Continue resuscitation (internally 'step11') */}
      <View
        onLayout={measure('step11')}
        style={[
          styles.stepBox,
          { backgroundColor: C.paraBg, borderColor: C.paraBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.paraSub }]}>STEP 9</Text>
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
          Compressions / rhythm / shock / Epi (max 3)
        </Text>
        <View style={{ height: 8 }} />
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Repeat 2-min compression cycles
          <Text style={styles.backRef}>  → Step 1</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Check rhythm /{' '}
          <Text style={{ color: C.destText, fontWeight: '700' }}>
            defibrillate every 2 min ⚡
          </Text>
          <Text style={styles.backRef}>  → Step 6</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          •{' '}
          <Text style={{ color: C.critTitle }}>
            Continue Epinephrine every 3–5 min
          </Text>{' '}
          <Text style={{ color: C.emtTitle, fontWeight: '700' }}>
            (max 3 total doses)
          </Text>
          <Text style={styles.backRef}>  → Step 7</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.paraSub }]}>
          • Reassess for reversible causes each round
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* DECISION 3 — After 4 rounds? */}
      <View onLayout={measure('dec3')} style={{ height: 72, marginHorizontal: BX }} />
      <View style={{ height: GAP }} />

      {/* Display: STEP 10 — Transport Decision (internally 'step12') */}
      <View
        onLayout={measure('step12')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 10</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>Transport Decision</Text>

        {/* TOR jump-out sub-box — red palette, first after title */}
        <View style={[styles.torJumpBox, { marginTop: 4, marginBottom: 8 }]}>
          <Text style={styles.torJumpTitle}>
            No ROSC after 4 rounds, non-shockable rhythm?
          </Text>
          <Text style={styles.torJumpBody}>
            → See <Text style={{ fontWeight: '700' }}>Non-Traumatic TOR</Text> protocol
          </Text>
        </View>

        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.destText, fontWeight: '700' }}>Refractory VF / VT</Text> → Load &amp; transport, continue resuscitation en route (up to 60 min from dispatch)
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.emtTitle, fontWeight: '700' }}>CRC bypass</Text> if ongoing CPR without ROSC OR CRC adds &gt;15 min transport → closest appropriate facility
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.paraTitle, fontWeight: '700' }}>ROSC achieved</Text> → Transport to Cardiac Receiving Center (CRC); refer to Post-Cardiac Arrest / ROSC Care
        </Text>
      </View>

      {/* TOR reminder block — visible clinical warning, RN-rendered */}
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
      </View>

      {/* Disclaimer footer — moved from SVG to RN so it sits below the TOR reminder */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  // Torsades sub-box — gray border/title, orange dose
  torsadesBox: {
    backgroundColor: C.emtBg,
    borderColor: C.emtBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  torsadesTitle: {
    color: C.emtTitle,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  torsadesDose: {
    color: C.critTitle,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  // Reversible Causes sub-box — white title, gray body, orange Ca doses
  revCausesBox: {
    backgroundColor: C.emtBg,
    borderColor: C.emtBorder,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  revCausesTitle: {
    color: C.emtTitle,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  revCausesBody: {
    color: C.label,
    fontSize: 10,
    lineHeight: 15,
  },
  revCausesDose: {
    color: C.critTitle,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  causeNote: {
    fontSize: 11,
    lineHeight: 17,
    color: C.critTitle,
    fontWeight: '700',
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
    color: C.destSub,
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

  // Drug box — ORANGE (matches Chest Pain / Seizure drug administration pattern)
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
    fontSize: 14,
    lineHeight: 20,
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
    color: C.paraSub,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  destTitle: {
    color: C.paraTitle,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  destBullet: {
    color: C.paraSub,
    fontSize: 15,
    lineHeight: 22,
  },

  // TOR jump-out sub-box — inside Step 10, references separate TOR protocol
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

  // TOR reminder block — standalone clinical warning below Step 10
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

  // Footer lines — RN-rendered (moved out of SVG)
  footerLine: {
    color: C.discText,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Acronym glossary — small reference block below TOR exclusion box
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
