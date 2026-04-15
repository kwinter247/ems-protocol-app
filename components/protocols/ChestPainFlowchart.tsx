import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Text as SvgText, Line, Polygon } from 'react-native-svg';

// ─── Canvas constants ─────────────────────────────────────────────────────────
const W = 470;
const cx = W / 2;
const BW = 440;
const BX = cx - BW / 2;
const BR = BX + BW;
const GAP = 24;
const PARA_BAR_H = 22;
const STEP_PADDING_V = 12;

const DW = 240;
const DH1 = 90;
const DH2 = 100;

// Right rail — dashed line column
const RAIL_X = BR - 20;

// HOLD NTG box — below and left of diamond 1 right vertex, angled NO line
const HOLD_W = 92;
const HOLD_H_CONST = 40;
const HOLD_X = BR - HOLD_W - 4;

// CONTRAINDICATION box — left side of canvas in gap between dia1 and step6
const CONTRA_W = 140;
const CONTRA_H = 86;
const CONTRA_X = BX + 2; // flush left

// Narrow box width — leaves right rail clear
const NARROW_W = BW - HOLD_W - 14;

// ─── Colours ──────────────────────────────────────────────────────────────────
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
  critSub:    '#c9734a',
  decBg:      '#1f3a5f',
  decBorder:  '#185FA5',
  decText:    '#79c0ff',
  adultDrug:  '#f0883e',
  adultDose:  '#d29922',
  secBg:      '#161b22',
  arrow:      '#6e7681',
  label:      '#8b949e',
  muted:      '#6e7681',
  discText:   '#6e7681',
  destBg:     '#3a1010',
  destBorder: '#d62828',
  destText:   '#f85149',
  warnBg:     '#1a1400',
  warnBorder: '#9e6a03',
  warnText:   '#d29922',
  warnMuted:  '#7a6030',
};

// ─── Layout types ─────────────────────────────────────────────────────────────
type BB = { top: number; bot: number };
type Layouts = {
  step1?: BB; step2?: BB; step3?: BB;
  paraBar?: BB;
  step4?: BB; step5?: BB;
  dia1?: BB;
  step6?: BB;
  dia2?: BB;
  step7?: BB; step8?: BB;
};

const REQUIRED_KEYS: (keyof Layouts)[] = [
  'step1','step2','step3','paraBar',
  'step4','step5','dia1','step6',
  'dia2','step7','step8',
];

// ─── StepBox ──────────────────────────────────────────────────────────────────
type SBProps = {
  stepLabel: string; stepLabelColor: string;
  scope: string; scopeColor: string; scopeBorderColor: string;
  title: string; titleColor: string;
  bg: string; border: string;
  children?: React.ReactNode;
  onLayout?: (top: number, bot: number) => void;
  style?: object;
};
function StepBox({ stepLabel, stepLabelColor, scope, scopeColor, scopeBorderColor,
  title, titleColor, bg, border, children, onLayout, style }: SBProps) {
  return (
    <View style={[styles.stepBox, { backgroundColor: bg, borderColor: border }, style]}
      onLayout={e => {
        if (onLayout) {
          const { y, height } = e.nativeEvent.layout;
          onLayout(y, y + height);
        }
      }}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepLabel, { color: stepLabelColor }]}>{stepLabel}</Text>
        <View style={[styles.scopePill, { borderColor: scopeBorderColor }]}>
          <Text style={[styles.scopeText, { color: scopeColor }]}>{scope}</Text>
        </View>
      </View>
      <Text style={[styles.stepTitle, { color: titleColor }]}>{title}</Text>
      {children}
    </View>
  );
}

function BulletRow({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color }]}>•</Text>
      <Text style={[styles.bulletText, { color }]}>{text}</Text>
    </View>
  );
}

function DrugRow({ drug, dose }: { drug: string; dose: string }) {
  return (
    <View style={styles.drugRow}>
      <Text style={[styles.drugName, { color: C.adultDrug }]}>{drug}</Text>
      <Text style={[styles.drugDose, { color: C.adultDose }]}>{dose}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChestPainFlowchart() {
  const [L, setL] = useState<Layouts>({});
  const [containerH, setContainerH] = useState(0);
  const ready = REQUIRED_KEYS.every(k => L[k] !== undefined) && containerH > 0;

  const measure = useCallback((key: keyof Layouts) => (top: number, bot: number) => {
    setL(prev => prev[key] ? prev : { ...prev, [key]: { top, bot } });
  }, []);

  const tip = (x: number, y: number) =>
    `M${x - 6},${y - 10} L${x},${y} L${x + 6},${y - 10}`;

  function ArrDown({ x, from, to }: { x: number; from: number; to: number }) {
    return (
      <>
        <Line x1={x} y1={from} x2={x} y2={to - 10} stroke={C.arrow} strokeWidth={1.5} />
        <Path d={tip(x, to)} stroke={C.arrow} strokeWidth={1.5} fill="none" />
      </>
    );
  }

  function Dia({ topY, h, label, sub }: { topY: number; h: number; label: string; sub?: string }) {
    const midY = topY + h / 2;
    const dLeft  = BX + (BW - DW) / 2;
    const dRight = BX + (BW + DW) / 2;
    const pts = `${cx},${topY} ${dRight},${midY} ${cx},${topY + h} ${dLeft},${midY}`;
    return (
      <>
        <Polygon points={pts} fill={C.decBg} stroke={C.decBorder} strokeWidth={1.5} />
        <SvgText x={cx} y={sub ? midY - 7 : midY + 5}
          textAnchor="middle" fill={C.decText} fontSize={13} fontWeight="600">{label}</SvgText>
        {sub && <SvgText x={cx} y={midY + 10} textAnchor="middle" fill={C.decText} fontSize={11}>{sub}</SvgText>}
      </>
    );
  }

  function Lbl({ x, y, t }: { x: number; y: number; t: string }) {
    return <SvgText x={x} y={y} textAnchor="middle" fill={C.label} fontSize={11} fontStyle="italic">{t}</SvgText>;
  }

  function Overlay() {
    if (!ready) return null;
    const { step1, step2, step3, paraBar, step4, step5, dia1, step6, dia2, step7, step8 } =
      L as Required<Layouts>;

    const d1Top  = dia1.top;
    const d1Bot  = dia1.bot;
    const d1Mid  = (dia1.top + dia1.bot) / 2;
    const d1Right = BX + (BW + DW) / 2;

    const d2Top  = dia2.top;
    const d2Bot  = dia2.bot;
    const d2Mid  = (dia2.top + dia2.bot) / 2;
    const d2Right = BX + (BW + DW) / 2;

    // HOLD NTG box — below and left, angled NO line from diamond right vertex
    const holdH = 40;
    const holdY = d1Bot + 16; // well below diamond bottom
    const holdX = HOLD_X - 20; // shift left for cleaner angle

    // CONTRAINDICATION box
    const gapMid = (d1Bot + step6.top) / 2;
    const contraY = gapMid - CONTRA_H / 2;

    return (
      <Svg width={W} height={containerH} style={StyleSheet.absoluteFill} pointerEvents="none">

        {/* Title */}
        <SvgText x={cx} y={28} textAnchor="middle" fill={C.emtTitle} fontSize={15} fontWeight="700">
          Chest Pain / ACS / STEMI
        </SvgText>
        <SvgText x={cx} y={46} textAnchor="middle" fill={C.muted} fontSize={11}>Adult</SvgText>

        {/* EMT section bar */}
        <Rect x={BX} y={56} width={BW} height={20} fill={C.secBg} rx={3} />
        <SvgText x={cx} y={70} textAnchor="middle" fill={C.emtSub}
          fontSize={10} fontWeight="700" letterSpacing={2}>EMT</SvgText>

        {/* Steps 1 → 2 → 3 */}
        <ArrDown x={cx} from={step1.bot} to={step2.top} />
        <ArrDown x={cx} from={step2.bot} to={step3.top} />

        {/* Step 3 → PARAMEDIC bar */}
        <ArrDown x={cx} from={step3.bot} to={paraBar.top} />
        <Rect x={BX} y={paraBar.top} width={BW} height={PARA_BAR_H} fill={C.secBg} rx={3} />
        <SvgText x={cx} y={paraBar.top + 15} textAnchor="middle" fill={C.paraTitle}
          fontSize={10} fontWeight="700" letterSpacing={2}>PARAMEDIC</SvgText>

        {/* PARAMEDIC bar sits flush against Step 4 — no arrow */}
        <ArrDown x={cx} from={step4.bot} to={step5.top} />
        <ArrDown x={cx} from={step5.bot} to={d1Top} />

        {/* Diamond 1: SBP > 100? */}
        <Dia topY={d1Top} h={DH1} label="SBP > 100 mmHg?" />

        {/* YES: down → Step 6 */}
        <ArrDown x={cx} from={d1Bot} to={step6.top} />
        <Lbl x={cx - 22} y={d1Bot + 14} t="YES" />

        {/* NO: angled line from diamond right vertex down-left to HOLD NTG box */}
        <Line x1={d1Right} y1={d1Mid}
          x2={holdX + HOLD_W / 2} y2={holdY - 10}
          stroke={C.arrow} strokeWidth={1.5} />
        <Path d={tip(holdX + HOLD_W / 2, holdY)} stroke={C.arrow} strokeWidth={1.5} fill="none" />
        <Lbl x={d1Right + 26} y={d1Mid + 20} t="NO" />

        {/* HOLD NTG box — RED critical callout */}
        <Rect x={holdX} y={holdY} width={HOLD_W} height={holdH}
          fill={C.destBg} stroke={C.destBorder} strokeWidth={1.5} rx={4} />
        <SvgText x={holdX + HOLD_W / 2} y={holdY + 15}
          textAnchor="middle" fill={C.destText} fontSize={10} fontWeight="700">HOLD NTG</SvgText>
        <SvgText x={holdX + HOLD_W / 2} y={holdY + 29}
          textAnchor="middle" fill={C.destText} fontSize={9}>Monitor BP</SvgText>

        {/* Dashed line: from center-bottom of HOLD NTG box → down → Diamond 2 top vertex */}
        <Line x1={holdX + HOLD_W / 2} y1={holdY + holdH}
          x2={holdX + HOLD_W / 2} y2={d2Top + 2}
          stroke={C.destBorder} strokeWidth={1.5} strokeDasharray="5,4" />
        <Line x1={holdX + HOLD_W / 2} y1={d2Top + 2}
          x2={cx + 2} y2={d2Top + 2}
          stroke={C.destBorder} strokeWidth={1.5} strokeDasharray="5,4" />

        {/* CONTRAINDICATION box — RED critical callout, larger font */}
        <Rect x={CONTRA_X} y={contraY} width={CONTRA_W} height={CONTRA_H}
          fill={C.destBg} stroke={C.destBorder} strokeWidth={1.5} rx={4} />
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 14}
          textAnchor="middle" fill={C.destText} fontSize={9.5} fontWeight="700">⚠ CONTRAINDICATION</SvgText>
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 27}
          textAnchor="middle" fill={C.destText} fontSize={9}>Do NOT give NTG if</SvgText>
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 39}
          textAnchor="middle" fill={C.destText} fontSize={9}>PDE5 inhibitor taken</SvgText>
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 51}
          textAnchor="middle" fill={C.destText} fontSize={9}>within 48 hours</SvgText>
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 64}
          textAnchor="middle" fill={C.destText} fontSize={8} fontStyle="italic">(sildenafil, tadalafil,</SvgText>
        <SvgText x={CONTRA_X + CONTRA_W / 2} y={contraY + 76}
          textAnchor="middle" fill={C.destText} fontSize={8} fontStyle="italic">epoprostenol, treprostinil)</SvgText>

        {/* Step 6 → Diamond 2 */}
        <ArrDown x={cx} from={step6.bot} to={d2Top} />

        {/* Diamond 2: STEMI confirmed? */}
        <Dia topY={d2Top} h={DH2} label="STEMI / OMI confirmed?" sub="(12-lead ECG)" />

        {/* YES: down → Step 7 */}
        <ArrDown x={cx} from={d2Bot} to={step7.top} />
        <Lbl x={cx - 22} y={d2Bot + 14} t="YES" />

        {/* NO: right → down → Diamond 2 right vertex (solid gray, inside the dashed orange) */}
        <Line x1={d2Right} y1={d2Mid} x2={RAIL_X - 8} y2={d2Mid}
          stroke={C.arrow} strokeWidth={1.5} />
        <Lbl x={d2Right + 20} y={d2Mid - 8} t="NO" />
        <Line x1={RAIL_X - 8} y1={d2Mid} x2={RAIL_X - 8} y2={step8.top - 10}
          stroke={C.arrow} strokeWidth={1.5} />
        <Path d={tip(RAIL_X - 8, step8.top)} stroke={C.arrow} strokeWidth={1.5} fill="none" />

        {/* Step 7 → Step 8 */}
        <ArrDown x={cx} from={step7.bot} to={step8.top} />

      </Svg>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.canvas, { width: W }]}
      onLayout={e => setContainerH(e.nativeEvent.layout.height)}>

      <View style={{ height: 80 }} />

      {/* STEP 1 */}
      <StepBox stepLabel="STEP 1" stepLabelColor={C.emtSub}
        scope="ALL PROVIDERS" scopeColor={C.emtSub} scopeBorderColor={C.emtBorder}
        title="Initiate Universal Care" titleColor={C.emtTitle}
        bg={C.emtBg} border={C.emtBorder} onLayout={measure('step1')}>
        <BulletRow text="Scene safety, BSI, patient assessment" color={C.emtSub} />
        <BulletRow text="History: onset, quality, radiation, severity, timing" color={C.emtSub} />
        <BulletRow text="Vital signs, SpO₂, history of cardiac disease" color={C.emtSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* STEP 2 */}
      <StepBox stepLabel="STEP 2" stepLabelColor={C.emtSub}
        scope="EMT" scopeColor={C.emtSub} scopeBorderColor={C.emtBorder}
        title="Oxygen (if indicated)" titleColor={C.emtTitle}
        bg={C.emtBg} border={C.emtBorder} onLayout={measure('step2')}>
        <BulletRow text="If short of breath, hypoxic, or signs of heart failure" color={C.emtSub} />
        <BulletRow text="Administer O₂ — titrate to SpO₂ ≥ 94%" color={C.emtSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* STEP 3 */}
      <StepBox stepLabel="STEP 3" stepLabelColor={C.emtSub}
        scope="EMT" scopeColor={C.emtSub} scopeBorderColor={C.emtBorder}
        title="Aspirin" titleColor={C.emtTitle}
        bg={C.emtBg} border={C.emtBorder} onLayout={measure('step3')}>
        <DrugRow drug="Aspirin" dose="325 mg PO  or  324 mg chewed" />
        <BulletRow text="Contraindicated: active GI bleed, taken within 24 hr, ASA allergy" color={C.emtSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* PARAMEDIC bar — measured so SVG places it precisely */}
      <View style={{ height: PARA_BAR_H }}
        onLayout={e => {
          const y = e.nativeEvent.layout.y;
          measure('paraBar')(y, y + PARA_BAR_H);
        }} />

      {/* STEP 4 — sits directly below PARAMEDIC bar, no gap */}
      <StepBox stepLabel="STEP 4" stepLabelColor={C.paraTitle}
        scope="PARAMEDIC" scopeColor={C.paraTitle} scopeBorderColor={C.paraBorder}
        title="12-Lead ECG" titleColor={C.paraTitle}
        bg={C.paraBg} border={C.paraBorder} onLayout={measure('step4')}>
        <BulletRow text="Obtain and transmit — goal within 5 min of patient contact" color={C.paraSub} />
        <BulletRow text="Serial ECGs if inconclusive or condition changes" color={C.paraSub} />
        <BulletRow text="Provide copy to receiving facility at transfer of care" color={C.paraSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* STEP 5 */}
      <StepBox stepLabel="STEP 5" stepLabelColor={C.paraTitle}
        scope="PARAMEDIC" scopeColor={C.paraTitle} scopeBorderColor={C.paraBorder}
        title="IV Access + Monitoring" titleColor={C.paraTitle}
        bg={C.paraBg} border={C.paraBorder} onLayout={measure('step5')}>
        <BulletRow text="Establish IV/IO access" color={C.paraSub} />
        <BulletRow text="Continuous cardiac monitoring" color={C.paraSub} />
        <BulletRow text="Pulse ox + waveform capnography as indicated" color={C.paraSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* Diamond 1 spacer */}
      <View style={{ height: DH1 }}
        onLayout={e => {
          const y = e.nativeEvent.layout.y;
          measure('dia1')(y, y + DH1);
        }} />

      {/* Gap for CONTRAINDICATION box + HOLD NTG dashed line space */}
      <View style={{ height: CONTRA_H + 20 }} />

      {/* STEP 6 — orange, narrow right to keep rail clear */}
      <StepBox stepLabel="STEP 6" stepLabelColor={C.critTitle}
        scope="PARAMEDIC" scopeColor={C.critTitle} scopeBorderColor={C.critBorder}
        title="Nitroglycerin" titleColor={C.critTitle}
        bg={C.critBg} border={C.critBorder} onLayout={measure('step6')}
        style={{ width: NARROW_W }}>
        <DrugRow drug="Nitroglycerin" dose="0.4 mg SL tablet or 1 full spray" />
        <BulletRow text="May repeat every 3–5 min until pain resolves" color={C.critSub} />
        <BulletRow text="Continue as blood pressure allows" color={C.critSub} />
        <BulletRow text="Monitor hemodynamics — be prepared to resuscitate if hypotension" color={C.critSub} />
        <BulletRow text="Location of infarct does not preclude NTG use" color={C.critSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* Diamond 2 spacer */}
      <View style={{ height: DH2 }}
        onLayout={e => {
          const y = e.nativeEvent.layout.y;
          measure('dia2')(y, y + DH2);
        }} />

      <View style={{ height: GAP }} />

      {/* STEP 7 — narrow right for NO rail */}
      <StepBox stepLabel="STEP 7" stepLabelColor={C.paraTitle}
        scope="PARAMEDIC" scopeColor={C.paraTitle} scopeBorderColor={C.paraBorder}
        title="STEMI / OMI Confirmed — Activate" titleColor={C.paraTitle}
        bg={C.paraBg} border={C.paraBorder} onLayout={measure('step7')}
        style={{ width: NARROW_W }}>
        <BulletRow text="Notify receiving facility IMMEDIATELY" color={C.paraSub} />
        <BulletRow text="Transmit 12-lead ECG to receiving facility if possible" color={C.paraSub} />
        <BulletRow text="Transport to Cardiac Receiving or Referral Center" color={C.paraSub} />
        <View style={styles.divider} />
        <Text style={[styles.subLabel, { color: C.critTitle }]}>Pain unresponsive to NTG?</Text>
        <DrugRow drug="Fentanyl" dose="0.5 mcg/kg IN/IV/IO" />
        <BulletRow text="Max initial dose: 50 mcg" color={C.paraSub} />
        <BulletRow text="Max total dose: 200 mcg" color={C.paraSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* STEP 8 — full width terminus, both YES and NO branches converge here */}
      <StepBox stepLabel="STEP 8" stepLabelColor={C.emtSub}
        scope="ALL PROVIDERS" scopeColor={C.emtSub} scopeBorderColor={C.emtBorder}
        title="Transport" titleColor={C.emtTitle}
        bg={C.emtBg} border={C.emtBorder} onLayout={measure('step8')}>
        <BulletRow text="Transport to Cardiac Receiving Center or Referral Center" color={C.emtSub} />
        <BulletRow text="Reassess vitals, pain level, and ECG en route" color={C.emtSub} />
        <BulletRow text="Document 12-lead — transmit to receiving facility" color={C.emtSub} />
        <BulletRow text="Non-STEMI: continue monitoring, serial ECGs, symptom management" color={C.emtSub} />
      </StepBox>

      <View style={{ height: GAP }} />

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
        </Text>
        <Text style={styles.disclaimerText}>
          Reference aid only — does not replace online medical direction or clinical judgment.
        </Text>
      </View>

      <View style={{ height: 32 }} />
      <Overlay />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  canvas: {
    backgroundColor: C.bg,
    paddingHorizontal: BX,
    position: 'relative',
  },
  stepBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: STEP_PADDING_V,
    width: BW,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scopePill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scopeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 12,
    marginRight: 5,
    lineHeight: 17,
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  drugRow: {
    marginBottom: 5,
    paddingLeft: 4,
  },
  drugName: {
    fontSize: 13,
    fontWeight: '600',
  },
  drugDose: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0883e',
    opacity: 0.3,
    marginVertical: 8,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  disclaimer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    color: C.discText,
    textAlign: 'center',
    lineHeight: 16,
  },
});
