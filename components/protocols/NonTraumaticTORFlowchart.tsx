// NonTraumaticTORFlowchart.tsx
// Non-Traumatic Termination of Resuscitative Efforts (TOR): Adult & Pediatric
// Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
// Architecture: v2 — onLayout measurements + SVG overlay
// Paramedic-first flow: TOR is a decision made during an already-running cardiac arrest.
// Assumes resuscitation basics (pads, IV/IO, monitor, EtCO₂) are already in place
// per the main Cardiac Arrest protocol.

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
const DXR = 255; // right tip of diamond

// Wide callout (all callouts use the wide variant now)
const CBW_D1 = 170;
const CBX_D1 = 285;

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  // EMT / grey section
  emtBg: '#21262d',
  emtBorder: '#484f58',
  emtTitle: '#e6edf3',
  emtSub: '#8b949e',
  // Paramedic section
  paraBg: '#1b3a2d',
  paraBorder: '#0F6E56',
  paraTitle: '#56d364',
  paraSub: '#8fcca0',
  // Critical / orange action
  critBg: '#2a1a0a',
  critBorder: '#f0883e',
  critTitle: '#f0883e',
  critSub: '#d29922',
  // Decision diamond
  decBg: '#1f3a5f',
  decBorder: '#185FA5',
  decText: '#79c0ff',
  // Destination / alert (red) — for the terminal OLMD alert box
  destBg: '#3a1010',
  destBorder: '#d62828',
  destText: '#f85149',
  destSub: '#e89b9b',
  // Warn (amber)
  warnBg: '#1a1400',
  warnBorder: '#9e6a03',
  warnText: '#d29922',
  // Info (muted blue-grey) — for entry context block
  infoBg: '#161b22',
  infoBorder: '#30363d',
  infoTitle: '#79c0ff',
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
  'excl',       // Exclusions (top gate)
  'entry',      // Entry context block
  'step1',      // STEP 1 — Refractory check (amber, DO NOT TOR YET)
  'step2',      // STEP 2 — TOR Criteria two-column checklist
  'dec1',       // Decision 1 — Either pathway met?
  'step3',      // STEP 3 — Contact OLMD (red alert)
  'dec2',       // Decision 2 — ROSC achieved during consult?
  'step4',      // STEP 4 — Post-termination preserve scene (grey)
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CALLOUT_LINE_H = 14;
const CALLOUT_PAD = 10;

// Wide callout — per-line styling, 170px wide. Single helper used for all callouts.
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
  const firstBaselineY = top + CALLOUT_PAD + 9;
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
          fontSize={10.5}
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
export default function NonTraumaticTORFlowchart() {
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

  // ── SVG overlay ──────────────────────────────────────────────────────────
  function renderSVG() {
    if (REQUIRED_KEYS.some((k) => !L[k])) return null;

    const l = L as Required<LayoutMap>;

    const d1mid = (l.dec1.top + l.dec1.bot) / 2;
    const d2mid = (l.dec2.top + l.dec2.bot) / 2;

    const svgH = l.step4.bot + 20;

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

        {/* Header block (title, excl, entry) sits visually adjacent with no flow arrows —
            flow begins at STEP 1 via entry → step1. */}

        {/* entry → step1 (flow begins) */}
        <Arrow x1={cx} y1={l.entry.bot} x2={cx} y2={l.step1.top} />

        {/* step1 → step2 */}
        <Arrow x1={cx} y1={l.step1.bot} x2={cx} y2={l.step2.top} />

        {/* step2 → dec1 (enter diamond at DCX) */}
        <Arrow x1={DCX} y1={l.step2.bot} x2={DCX} y2={l.dec1.top} />

        {/* dec1 diamond — Either pathway met? */}
        <Diamond
          cx={DCX}
          cy={d1mid}
          w={DW}
          h={l.dec1.bot - l.dec1.top}
          text="Either pathway met?"
          textSize={14}
        />

        {/* dec1 NO → Continue resus wide callout (right, orange)
            Label "NO" sits ABOVE the horizontal line per convention. */}
        <Arrow x1={DXR} y1={d1mid} x2={CBX_D1} y2={d1mid} />
        <SvgText
          x={(DXR + CBX_D1) / 2}
          y={d1mid - 6}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="middle"
        >
          NO
        </SvgText>
        {wideCalloutBox(
          d1mid,
          [
            { text: 'Continue resuscitation', color: C.critTitle, weight: '700' },
            { text: 'per Cardiac Arrest protocol', color: C.emtTitle, weight: '600' },
          ],
          C.critBg,
          C.critBorder,
        )}

        {/* dec1 YES → step3 (OLMD, down)
            Label "YES" sits slightly RIGHT of the vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec1.bot} x2={DCX} y2={l.step3.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec1.bot + l.step3.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          YES
        </SvgText>

        {/* step3 → dec2 */}
        <Arrow x1={DCX} y1={l.step3.bot} x2={DCX} y2={l.dec2.top} />

        {/* dec2 diamond — ROSC achieved during consult? */}
        <Diamond
          cx={DCX}
          cy={d2mid}
          w={DW}
          h={l.dec2.bot - l.dec2.top}
          text="ROSC achieved?"
          textSize={14}
        />

        {/* dec2 YES → ROSC Care wide callout (right, green) */}
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
            { text: '(or closest if >15 min)', color: C.emtTitle, weight: '600' },
          ],
          C.paraBg,
          C.paraBorder,
        )}

        {/* dec2 NO → step4 (TOR confirmed, post-termination)
            Label "NO" sits slightly RIGHT of the vertical line per convention. */}
        <Arrow x1={DCX} y1={l.dec2.bot} x2={DCX} y2={l.step4.top} />
        <SvgText
          x={DCX + 6}
          y={(l.dec2.bot + l.step4.top) / 2 + 4}
          fontSize={11}
          fill={C.label}
          fontWeight="700"
          textAnchor="start"
        >
          NO
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
          Termination of Resuscitation
        </Text>
        <Text style={styles.titleText}>
          (Non-Traumatic)
        </Text>
        <Text style={styles.titleSub}>
          TOR · Adult &amp; Pediatric
        </Text>
      </View>

      <View style={{ height: 12 }} />

      {/* Exclusions — top gate, all centered */}
      <View
        onLayout={measure('excl')}
        style={[styles.warnBox, { marginHorizontal: BX }]}
      >
        <Text style={[styles.warnTitle, { textAlign: 'center' }]}>EXCLUSIONS — DO NOT TERMINATE</Text>
        <Text style={[styles.warnBody, { textAlign: 'center', color: C.emtTitle }]}>
          Hypothermia · Lightning strike · Submersion / Drowning{'\n'}
          Patients &lt; 18 years old
        </Text>
        <Text style={[styles.warnBody, { textAlign: 'center' }]}>
          Obvious/Apparent Death criteria → Obvious/Apparent Death protocol{'\n'}
          Traumatic cardiac arrest → Traumatic Cardiac Arrest TOR
        </Text>
        <Text style={[styles.warnBody, { marginTop: 6, color: C.destText, fontWeight: '700', textAlign: 'center' }]}>
          Continue efforts OR contact OLMD for guidance.
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* Entry context — TOR is a decision during an active resuscitation */}
      <View
        onLayout={measure('entry')}
        style={[styles.entryBox, { marginHorizontal: BX }]}
      >
        <Text style={styles.entryTitle}>
          ℹ  DURING ACTIVE RESUSCITATION
        </Text>
        <Text style={styles.entryBody}>
          TOR is a decision made during an active cardiac arrest.
          Pads, IV/IO, monitor, and EtCO₂ are already in place per{' '}
          <Text style={{ color: C.emtTitle, fontWeight: '700' }}>Cardiac Arrest protocol</Text>.
          Complete <Text style={{ color: C.emtTitle, fontWeight: '700' }}>4 rounds</Text> before assessing criteria below.
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* STEP 1 — Refractory Check (amber, DO NOT TOR YET) */}
      <View
        onLayout={measure('step1')}
        style={[styles.warnBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.warnText }]}>STEP 1 · DO NOT TOR YET</Text>
          <ScopeBadge scope="PARAMEDIC" tone="red" />
        </View>
        <Text style={[styles.stepTitle, { color: C.warnText }]}>
          Refractory Rhythms → Continue up to 60 min from dispatch
        </Text>
        <Text style={[styles.bullet, { color: C.emtTitle }]}>
          • <Text style={{ color: C.destText, fontWeight: '700' }}>Refractory VF / Pulseless VT</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.emtTitle }]}>
          • <Text style={{ color: C.destText, fontWeight: '700' }}>Narrow complex PEA, rate &gt; 40</Text>
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub, marginTop: 4, fontStyle: 'italic' }]}>
          Load and transport — resuscitate en route up to 60 min from time of dispatch.
        </Text>
      </View>

      <View style={{ height: GAP }} />

      {/* STEP 2 — TOR Criteria two-column checklist */}
      <View
        onLayout={measure('step2')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 2</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>
          TOR Criteria — Meet either pathway
        </Text>

        <View style={styles.criteriaRow}>
          {/* Pathway 1 column */}
          <View style={[styles.criteriaCol, { backgroundColor: '#1a1f26', borderColor: C.emtBorder }]}>
            <Text style={[styles.criteriaColTitle, { color: C.emtTitle }]}>
              PATHWAY 1
            </Text>
            <Text style={[styles.criteriaColSub, { color: C.emtSub }]}>
              All 3 of 3
            </Text>
            <View style={styles.criteriaDivider} />
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• Unwitnessed</Text>
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• No shock advised (AED)</Text>
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• No ROSC</Text>
          </View>

          {/* Pathway 2 column — paramedic-exclusive */}
          <View style={[styles.criteriaCol, { backgroundColor: '#142418', borderColor: C.paraBorder }]}>
            <Text style={[styles.criteriaColTitle, { color: C.paraTitle }]}>
              PATHWAY 2
            </Text>
            <Text style={[styles.criteriaColSub, { color: C.paraSub }]}>
              All 4 of 4
            </Text>
            <View style={styles.criteriaDivider} />
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• Witnessed arrest</Text>
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• 20 min resuscitation</Text>
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• EtCO₂ &lt; 20</Text>
            <Text style={[styles.criteriaItem, { color: C.emtTitle }]}>• Non-shockable rhythm</Text>
          </View>
        </View>

        <Text style={[styles.bullet, { color: C.emtSub, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }]}>
          Either pathway complete → OLMD for TOR order
        </Text>
      </View>

      {/* DECISION 1 — Either pathway met? (stub with breathing room) */}
      <View style={{ height: GAP }} />
      <View onLayout={measure('dec1')} style={{ height: 92, marginHorizontal: BX }} />
      <View style={{ height: GAP }} />

      {/* STEP 3 — OLMD red alert (merge point / irreversible gate) */}
      <View
        onLayout={measure('step3')}
        style={[styles.olmdBox, { marginHorizontal: BX }]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.destSub }]}>STEP 3 · IRREVERSIBLE</Text>
          <ScopeBadge scope="PARAMEDIC" tone="red" />
        </View>
        <Text style={styles.olmdTitle}>
          📞  Contact On-Line Medical Direction
        </Text>
        <Text style={[styles.bullet, { color: C.emtTitle, marginTop: 4 }]}>
          • Request TOR order from OLMD physician
        </Text>
        <Text style={[styles.bullet, { color: C.emtTitle }]}>
          • Document: rhythm · rounds completed · EtCO₂ · time · physician name
        </Text>
        <Text style={[styles.bullet, { color: C.destText, fontWeight: '700', marginTop: 4 }]}>
          All Non-Traumatic TOR requires OLMD order.
        </Text>
      </View>

      {/* DECISION 2 — ROSC achieved during consult? (stub with breathing room) */}
      <View style={{ height: GAP }} />
      <View onLayout={measure('dec2')} style={{ height: 84, marginHorizontal: BX }} />
      <View style={{ height: GAP }} />

      {/* STEP 4 — Post-Termination preserve scene */}
      <View
        onLayout={measure('step4')}
        style={[
          styles.stepBox,
          { backgroundColor: C.emtBg, borderColor: C.emtBorder, marginHorizontal: BX },
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepLabel, { color: C.emtSub }]}>STEP 4 · POST-TERMINATION</Text>
          <ScopeBadge scope="PARAMEDIC" />
        </View>
        <Text style={[styles.stepTitle, { color: C.emtTitle }]}>
          Preserve Scene &amp; Body
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.emtTitle, fontWeight: '700' }}>Do not alter body condition</Text> — leave lines, tubes, equipment in place
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Altering the scene may compromise Medical Examiner investigation
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • <Text style={{ color: C.emtTitle, fontWeight: '700' }}>Contact law enforcement</Text> — EMS provider remains with patient until released
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Initiate grief support for family / bystanders
        </Text>
        <Text style={[styles.bullet, { color: C.emtSub }]}>
          • Document time of termination + OLMD physician name + order
        </Text>
      </View>

      {/* ── Below STEP 4: amber exclusions reminder + acronym glossary + footer ── */}
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
      <View style={{ height: 12 }} />
      <View style={[styles.acronymBox, { marginHorizontal: BX }]}>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>TOR</Text> — Termination of Resuscitation
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>OLMD</Text> — On-Line Medical Direction
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>ROSC</Text> — Return of Spontaneous Circulation
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>CRC</Text> — Cardiac Receiving Center
        </Text>
        <Text style={styles.acronymLine}>
          <Text style={styles.acronymKey}>CCR/MICR</Text> — Cardiocerebral / Minimally Interrupted CR
        </Text>
      </View>

      {/* Footer */}
      <View style={{ height: 20 }} />
      <Text style={styles.footerLine}>
        Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
      </Text>
      <Text style={styles.footerLine}>
        Reference aid only — does not replace online medical direction or clinical judgment.
      </Text>

      {/* SVG overlay */}
      {ready && renderSVG()}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
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

  // Entry context box — informational, subtle blue-tint header
  entryBox: {
    backgroundColor: C.infoBg,
    borderColor: C.infoBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: STEP_PADDING_V,
    paddingHorizontal: 12,
  },
  entryTitle: {
    color: C.infoTitle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  entryBody: {
    color: C.emtSub,
    fontSize: 12,
    lineHeight: 18,
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

  // Scope badge
  scopeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scopeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Step header row
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  // Two-column criteria checklist (STEP 2)
  criteriaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  criteriaCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  criteriaColTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  criteriaColSub: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  criteriaDivider: {
    height: 1,
    backgroundColor: '#30363d',
    marginVertical: 6,
  },
  criteriaItem: {
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 1,
  },

  // OLMD red alert box
  olmdBox: {
    backgroundColor: C.destBg,
    borderColor: C.destBorder,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: STEP_PADDING_V + 2,
    paddingHorizontal: 12,
  },
  olmdTitle: {
    color: C.destText,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },

  // TOR reminder block — amber, bottom of chart
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

  // Footer
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
