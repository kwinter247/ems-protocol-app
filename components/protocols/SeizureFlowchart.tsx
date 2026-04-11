import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Polygon,
  G,
} from 'react-native-svg';

const W = 860;
const H = 3600;
const cx = W / 2;
const BW = 560;
const BX = cx - BW / 2;

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

// ── Primitives ─────────────────────────────────────────────────
interface BoxProps {
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string; rx?: number;
  lines: string[]; textColor: string; fontSize?: number;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
}

function Box({ x, y, w, h, fill, stroke, rx = 8, lines, textColor, fontSize = 14, badge, badgeColor, badgeBg, badgeBorder }: BoxProps) {
  const lh = fontSize * 1.5;
  const totalTextH = (lines.length - 1) * lh;
  // y= is the baseline in react-native-svg; cap-height sits ~35% of fontSize above baseline
  const firstLineY = y + h / 2 - totalTextH / 2 + fontSize * 0.35;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={rx} />
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={x + w / 2}
          y={firstLineY + i * lh}
          textAnchor="middle"
          fontSize={fontSize}
          fill={textColor}
          fontWeight="500"
        >
          {line}
        </SvgText>
      ))}
      {badge && (
        <>
          <Rect x={x + w - 72} y={y + 7} width={66} height={19} fill={badgeBg ?? '#161b22'} stroke={badgeBorder ?? '#484f58'} strokeWidth={1} rx={4} />
          <SvgText x={x + w - 39} y={y + 16} textAnchor="middle" fontSize={10} fill={badgeColor ?? '#8b949e'} fontWeight="700">
            {badge}
          </SvgText>
        </>
      )}
    </G>
  );
}

interface StepBoxProps {
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string;
  stepLabel: string; stepNum: number;
  title: string; subtitle?: string;
  titleColor: string; subtitleColor: string;
  badge?: string; badgeColor?: string; badgeBg?: string; badgeBorder?: string;
}

function StepBox({ x, y, w, h, fill, stroke, stepNum, title, subtitle, titleColor, subtitleColor, badge, badgeColor, badgeBg, badgeBorder }: StepBoxProps) {
  // Row font sizes
  const fsLabel = 10;
  const fsTitle = 14;
  const fsSub = 12;
  const gap = 4; // px between rows
  const rowCount = subtitle ? 3 : 2;
  const rowSizes = subtitle ? [fsLabel, fsTitle, fsSub] : [fsLabel, fsTitle];
  // Total block height = sum of row cap-heights + gaps between rows
  // Cap-height ≈ fontSize * 0.7
  const totalBlockH = rowSizes.reduce((s, fs) => s + fs * 0.7, 0) + gap * (rowCount - 1);
  // Top of block so it's centred in the box
  const blockTop = y + (h - totalBlockH) / 2;
  // Baseline of each row = blockTop + cumulative cap-heights + gaps + this row's cap-height
  let cursor = blockTop;
  const baselines: number[] = [];
  rowSizes.forEach((fs) => {
    cursor += fs * 0.7;
    baselines.push(cursor);
    cursor += gap;
  });
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={10} />
      <SvgText x={x + 16} y={baselines[0]} fontSize={fsLabel} fill={subtitleColor} fontWeight="700" letterSpacing={0.8}>
        {`STEP ${stepNum}`}
      </SvgText>
      <SvgText x={x + 16} y={baselines[1]} fontSize={fsTitle} fill={titleColor} fontWeight="800">
        {title}
      </SvgText>
      {subtitle && (
        <SvgText x={x + 16} y={baselines[2]} fontSize={fsSub} fill={subtitleColor} fontWeight="400">
          {subtitle}
        </SvgText>
      )}
      {badge && (
        <>
          <Rect x={x + w - 112} y={y + 8} width={104} height={19} fill={badgeBg ?? '#161b22'} stroke={badgeBorder ?? '#484f58'} strokeWidth={1} rx={4} />
          <SvgText x={x + w - 60} y={y + 17} textAnchor="middle" fontSize={10} fill={badgeColor ?? '#8b949e'} fontWeight="700">
            {badge}
          </SvgText>
        </>
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
        <SvgText x={mx + off} y={my} fontSize={11} fill={C.label} fontWeight="700" alignmentBaseline="middle" textAnchor={labelSide === 'left' ? 'end' : 'start'}>
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
      <SvgText x={x + w / 2} y={y + 12} textAnchor="middle" alignmentBaseline="middle" fontSize={10} fill={C.secText} fontWeight="700" letterSpacing={1.2}>
        {text.toUpperCase()}
      </SvgText>
    </G>
  );
}

function HRule({ x, y, w }: { x: number; y: number; w: number }) {
  return <Line x1={x} y1={y} x2={x + w} y2={y} stroke={'#30363d'} strokeWidth={1} />;
}

// ── Main component ─────────────────────────────────────────────
export default function SeizureFlowchart() {
  const colW = BW / 2 - 5;

  // Benzo column layout constants
  // Column rect: y=812, h=200 → bottom=1012
  // Content rows (y = text baseline/centre positions):
  const colY = 812;
  const colH = 200; // reduced from 230 — 20px padding below last text at y=992
  const colBottom = colY + colH; // 1012

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={C.bg} />

      {/* ── TITLE ──────────────────────────────────────────── */}
      <SvgText x={cx} y={38} textAnchor="middle" alignmentBaseline="middle" fontSize={20} fill={'#e6edf3'} fontWeight="800">
        Seizure Protocol
      </SvgText>
      <SvgText x={cx} y={58} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.muted}>
        Central Arizona Red Book 2026 · Adult &amp; Pediatric
      </SvgText>

      {/* ── INCLUSION BOX ───────────────────────────────────── */}
      <Box x={BX} y={72} w={BW} h={72}
        fill={C.inclBg} stroke={C.inclBorder} rx={8}
        lines={[
          'INCLUDES:',
          'Ongoing seizure on arrival · Seizure > 5 min',
          '> 2 seizures/hr without recovery (Status Epilepticus)',
        ]}
        textColor={C.inclText} fontSize={12} />

      <Arrow x1={cx} y1={144} x2={cx} y2={168} />

      {/* ── STEP 1 — EMT ────────────────────────────────────── */}
      <StepBox x={BX} y={168} w={BW} h={72}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="EMT" stepNum={1}
        title="Initiate Universal Care"
        subtitle="Airway support · AVPU/GCS · O₂ as needed"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      <Arrow x1={cx} y1={240} x2={cx} y2={264} />

      {/* ── STEP 2 — EMT ────────────────────────────────────── */}
      <StepBox x={BX} y={264} w={BW} h={72}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="EMT" stepNum={2}
        title="Check Blood Glucose"
        subtitle="Fingerstick BGL · If pregnant → left lateral recumbent"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="EMT" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      <Arrow x1={cx} y1={336} x2={cx} y2={366} />

      {/* ── DECISION: BGL < 60? ─────────────────────────────── */}
      <Diamond cx={cx} cy={416} w={380} h={100}
        fill={C.decBg} stroke={C.decBorder}
        lines={['BGL < 60 mg/dL?']} textColor={C.decText} fontSize={14} />

      {/* YES — right branch */}
      <Line x1={cx + 190} y1={416} x2={720} y2={416} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={720} y1={416} x2={720} y2={450} />
      <SvgText x={724} y={410} fontSize={11} fill={C.label} fontWeight="700" alignmentBaseline="middle">YES</SvgText>
      <Box x={712} y={450} w={140} h={56}
        fill={C.destBg} stroke={C.destBorder} rx={8}
        lines={['→ Hypoglycemia', 'protocol']}
        textColor={C.destText} fontSize={11} />

      {/* NO — continues down */}
      <Arrow x1={cx} y1={466} x2={cx} y2={492} label="NO" />

      {/* ── STEP 3 — PARAMEDIC ──────────────────────────────── */}
      <StepBox x={BX} y={492} w={BW} h={72}
        fill={C.paraBg} stroke={C.paraBorder}
        stepLabel="PARAMEDIC" stepNum={3}
        title="IV/IO Access + Cardiac & EtCO₂ Monitoring"
        subtitle="Establish access · Continuous monitoring"
        titleColor={C.paraTitle} subtitleColor={C.paraSub}
        badge="PARAMEDIC" badgeColor={C.paraTitle} badgeBg="rgba(15,110,86,0.15)" badgeBorder={C.paraBorder} />

      <Arrow x1={cx} y1={564} x2={cx} y2={594} />

      {/* ── DECISION: PREGNANT? ─────────────────────────────── */}
      <Diamond cx={cx} cy={654} w={440} h={120}
        fill={C.decBg} stroke={C.decBorder}
        lines={['Pregnant > 20 wk', 'or postpartum < 6 wk?']} textColor={C.decText} fontSize={13} />

      {/* YES — right branch */}
      <Line x1={cx + 220} y1={654} x2={720} y2={654} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={720} y1={654} x2={720} y2={688} />
      <SvgText x={724} y={648} fontSize={11} fill={C.label} fontWeight="700" alignmentBaseline="middle">YES</SvgText>
      <Box x={712} y={688} w={140} h={88}
        fill={C.destBg} stroke={C.destBorder} rx={8}
        lines={['Mag Sulfate', '4 g IV/IO', '20 min slow push', '→ OB protocol']}
        textColor={C.destText} fontSize={11} />

      {/* NO — continues down */}
      <Arrow x1={cx} y1={714} x2={cx} y2={740} label="NO" />

      {/* ── STEP 4 — BENZO (critical) ───────────────────────── */}
      <SectionHeader x={BX} y={740} w={BW} text="Step 4 · Administer Benzodiazepine · Paramedic" />

      {/* Critical header bar: y=768, h=40 */}
      <Rect x={BX} y={768} width={BW} height={40} fill={C.critBg} stroke={C.critBorder} strokeWidth={1.5} rx={8} />
      <SvgText x={cx} y={788} textAnchor="middle" alignmentBaseline="middle" fontSize={14} fill={C.critTitle} fontWeight="800">
        Administer Benzodiazepine
      </SvgText>

      {/* ADULT column — y=812, h=200 → bottom=1012 */}
      <Rect x={BX} y={colY} width={colW} height={colH} fill={C.adultBg} stroke={C.adultBorder} strokeWidth={1.5} rx={8} />
      <SvgText x={BX + colW / 2} y={834} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.adultDrug} fontWeight="800">ADULT (age ≥ 15)</SvgText>

      <SvgText x={BX + colW / 2} y={856} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.adultDrug} fontWeight="700">Midazolam</SvgText>
      <SvgText x={BX + colW / 2} y={872} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.adultDose}>IM / IN: 0.2 mg/kg</SvgText>
      <SvgText x={BX + colW / 2} y={887} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.adultDose}>max 10 mg</SvgText>

      <HRule x={BX + 10} y={900} w={colW - 20} />

      <SvgText x={BX + colW / 2} y={916} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.adultDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
      <SvgText x={BX + colW / 2} y={932} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.adultDose}>IV / IO: 0.1 mg/kg</SvgText>
      <SvgText x={BX + colW / 2} y={947} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.adultDose}>max 4 mg</SvgText>

      <HRule x={BX + 10} y={960} w={colW - 20} />

      <SvgText x={BX + colW / 2} y={976} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={'#d29922'} fontWeight="600">Age &gt; 60: reduce dose by half</SvgText>
      <SvgText x={BX + colW / 2} y={992} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.adultDose}>Slow over 2 min via IV/IO</SvgText>

      {/* PEDS column — y=812, h=200 → bottom=1012 */}
      <Rect x={BX + colW + 10} y={colY} width={colW} height={colH} fill={C.pedsBg} stroke={C.pedsBorder} strokeWidth={1.5} rx={8} />
      <SvgText x={BX + colW + 10 + colW / 2} y={834} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.pedsDrug} fontWeight="800">PEDIATRIC (age &lt; 15)</SvgText>

      <SvgText x={BX + colW + 10 + colW / 2} y={856} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.pedsDrug} fontWeight="700">Midazolam</SvgText>
      <SvgText x={BX + colW + 10 + colW / 2} y={872} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.pedsDose}>IM / IN: 0.2 mg/kg</SvgText>
      <SvgText x={BX + colW + 10 + colW / 2} y={887} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.pedsDose}>max 10 mg</SvgText>

      <HRule x={BX + colW + 10 + 10} y={900} w={colW - 20} />

      <SvgText x={BX + colW + 10 + colW / 2} y={916} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fill={C.pedsDrug} fontWeight="700">Midazolam or Lorazepam</SvgText>
      <SvgText x={BX + colW + 10 + colW / 2} y={932} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.pedsDose}>IV / IO: 0.1 mg/kg</SvgText>
      <SvgText x={BX + colW + 10 + colW / 2} y={947} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.pedsDose}>max 4 mg</SvgText>

      <HRule x={BX + colW + 10 + 10} y={960} w={colW - 20} />

      <SvgText x={BX + colW + 10 + colW / 2} y={976} textAnchor="middle" alignmentBaseline="middle" fontSize={11} fill={C.pedsDose} fontWeight="600">Slow over 2 min via IV/IO</SvgText>

      {/* ── Arrow out of benzo section (colBottom=1012) ──────── */}
      <Arrow x1={cx} y1={colBottom} x2={cx} y2={1038} />

      {/* ── DECISION: SEIZURE STOPPED? (1) ──────────────────── */}
      {/* cy=1088, h=100 → top=1038, bottom=1138 */}
      <Diamond cx={cx} cy={1088} w={380} h={100}
        fill={C.decBg} stroke={C.decBorder}
        lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

      {/* YES — right branch → postictal note */}
      <Line x1={cx + 190} y1={1088} x2={720} y2={1088} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={720} y1={1088} x2={720} y2={1122} />
      <SvgText x={724} y={1082} fontSize={11} fill={C.label} fontWeight="700" alignmentBaseline="middle">YES</SvgText>
      <Box x={712} y={1122} w={140} h={46}
        fill={C.paraBg} stroke={C.paraBorder} rx={8}
        lines={['Postictal', '→ Step 6']}
        textColor={C.paraTitle} fontSize={11} />

      {/* NO — straight down */}
      <Arrow x1={cx} y1={1138} x2={cx} y2={1164} label="NO" labelSide="right" />

      {/* ── STEP 5 — REPEAT BENZO ───────────────────────────── */}
      {/* y=1164, h=100 → bottom=1264 */}
      <Rect x={BX} y={1164} width={BW} height={100} fill={C.critBg} stroke={C.critBorder} strokeWidth={1.5} rx={10} />
      <SvgText x={BX + 16} y={1185} fontSize={10} fill={C.critTitle} fontWeight="700" letterSpacing={0.8}>STEP 5 · PARAMEDIC</SvgText>
      <SvgText x={BX + 16} y={1204} fontSize={14} fill={C.critTitle} fontWeight="800">Repeat Benzodiazepine — 1 repeat dose max</SvgText>
      <SvgText x={BX + 16} y={1223} fontSize={11} fill={'#e6b87a'}>Same drug and dose · Max 2 total doses regardless of route</SvgText>
      <SvgText x={BX + 16} y={1241} fontSize={11} fill={'#e6b87a'}>Ketamine NOT indicated for postictal agitation</SvgText>

      <Arrow x1={cx} y1={1264} x2={cx} y2={1290} />

      {/* ── DECISION: SEIZURE STOPPED? (2) ──────────────────── */}
      {/* cy=1340, h=100 → top=1290, bottom=1390 */}
      <Diamond cx={cx} cy={1340} w={380} h={100}
        fill={C.decBg} stroke={C.decBorder}
        lines={['Seizure stopped?']} textColor={C.decText} fontSize={14} />

      {/* NO — right branch → Medical Direction */}
      <Line x1={cx + 190} y1={1340} x2={720} y2={1340} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={720} y1={1340} x2={720} y2={1374} />
      <SvgText x={724} y={1334} fontSize={11} fill={C.label} fontWeight="700" alignmentBaseline="middle">NO</SvgText>
      <Box x={712} y={1374} w={140} h={46}
        fill={C.destBg} stroke={C.destBorder} rx={8}
        lines={['Medical Direction']}
        textColor={C.destText} fontSize={12} />

      {/* YES — straight down */}
      <Arrow x1={cx} y1={1390} x2={cx} y2={1416} label="YES" />

      {/* ── STEP 6 — POSTICTAL CARE ─────────────────────────── */}
      {/* y=1416, h=100 → bottom=1516 */}
      <Rect x={BX} y={1416} width={BW} height={100} fill={C.paraBg} stroke={C.paraBorder} strokeWidth={1.5} rx={10} />
      <SvgText x={BX + 16} y={1437} fontSize={10} fill={C.paraSub} fontWeight="700" letterSpacing={0.8}>STEP 6 · PARAMEDIC</SvgText>
      <SvgText x={BX + 16} y={1456} fontSize={14} fill={C.paraTitle} fontWeight="800">Postictal Care</SvgText>
      <SvgText x={BX + 16} y={1475} fontSize={12} fill={C.paraSub}>Maintain airway · positioning · continuous monitoring</SvgText>
      <SvgText x={BX + 16} y={1491} fontSize={12} fill={C.paraSub}>If agitation: refer to Agitated/Violent Patient protocol</SvgText>
      <SvgText x={BX + 16} y={1507} fontSize={12} fill={C.paraSub}>Ketamine NOT indicated postictal</SvgText>
      <Rect x={BX + BW - 112} y={1424} width={104} height={19} fill="rgba(15,110,86,0.15)" stroke={C.paraBorder} strokeWidth={1} rx={4} />
      <SvgText x={BX + BW - 60} y={1433} textAnchor="middle" alignmentBaseline="middle" fontSize={10} fill={C.paraTitle} fontWeight="700">PARAMEDIC</SvgText>

      <Arrow x1={cx} y1={1516} x2={cx} y2={1540} />

      {/* ── STEP 7 — TRANSPORT ──────────────────────────────── */}
      {/* y=1540, h=72 → bottom=1612 */}
      <StepBox x={BX} y={1540} w={BW} h={72}
        fill={C.emtBg} stroke={C.emtBorder}
        stepLabel="ALL" stepNum={7}
        title="Transport — Notify Receiving Facility"
        subtitle="ALS intercept if not already on scene"
        titleColor={C.emtTitle} subtitleColor={C.emtSub}
        badge="ALL PROVIDERS" badgeColor={C.emtTitle} badgeBg="rgba(72,79,88,0.2)" badgeBorder={C.emtBorder} />

      {/* ── PREGNANCY NOTE ──────────────────────────────────── */}
      {/* y=1636, h=80 → bottom=1716 (24px gap after Step 7) */}
      <Box x={BX} y={1636} w={BW} h={80}
        fill={C.pregBg} stroke={C.pregBorder} rx={8}
        lines={[
          '⚠  PREGNANCY NOTE',
          'Mag sulfate is first-line for eclamptic seizure',
          'If etiology unclear: may give benzo simultaneously with mag',
        ]}
        textColor={C.pregText} fontSize={12} />

      {/* ── DISCLAIMER ──────────────────────────────────────── */}
      <Rect x={BX} y={1740} width={BW} height={1} fill={C.muted} />
      <SvgText x={cx} y={1762} textAnchor="middle" alignmentBaseline="middle" fontSize={10} fill={C.discText}>
        Reference aid only — not a substitute for clinical judgment or online medical direction
      </SvgText>
      <SvgText x={cx} y={1778} textAnchor="middle" alignmentBaseline="middle" fontSize={10} fill={C.discText}>
        Central AZ Red Book 2026 p.23
      </SvgText>

    </Svg>
  );
}
