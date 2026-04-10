import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Path,
  Polygon,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

const W = 700;
const H = 2600;

const C = {
  bg: '#0d1117',
  start: '#1c2128',
  startBorder: '#d62828',
  startText: '#e6edf3',
  decision: '#1c2128',
  decisionBorder: '#d29922',
  decisionText: '#e6edf3',
  action: '#1c2128',
  actionBorder: '#30363d',
  actionText: '#e6edf3',
  emt: '#1c2128',
  emtBorder: '#238636',
  emtText: '#3fb950',
  para: '#1c2128',
  paraBorder: '#d62828',
  paraText: '#f85149',
  drug: '#161b22',
  drugBorder: '#58a6ff',
  drugText: '#58a6ff',
  arrow: '#6e7681',
  label: '#8b949e',
  muted: '#6e7681',
  sectionHeader: '#21262d',
  sectionText: '#8b949e',
  warning: '#9e6a03',
  warningBorder: '#d29922',
  warningText: '#d29922',
};

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface BoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  rx?: number;
  lines: string[];
  textColor: string;
  fontSize?: number;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
}

function Box({ x, y, w, h, fill, stroke, rx = 8, lines, textColor, fontSize = 13, badge, badgeColor, badgeBg, badgeBorder }: BoxProps) {
  const lineH = fontSize * 1.5;
  const totalTextH = lines.length * lineH;
  const startY = y + h / 2 - totalTextH / 2 + lineH * 0.55;

  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={rx} />
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={x + w / 2}
          y={startY + i * lineH}
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
          <Rect x={x + w - 64} y={y + 6} width={58} height={18} fill={badgeBg ?? '#161b22'} stroke={badgeBorder ?? '#30363d'} strokeWidth={1} rx={4} />
          <SvgText x={x + w - 35} y={y + 19} textAnchor="middle" fontSize={10} fill={badgeColor ?? '#8b949e'} fontWeight="700">
            {badge}
          </SvgText>
        </>
      )}
    </G>
  );
}

function Diamond({ cx, cy, w, h, fill, stroke, lines, textColor, fontSize = 12 }: { cx: number; cy: number; w: number; h: number; fill: string; stroke: string; lines: string[]; textColor: string; fontSize?: number }) {
  const hw = w / 2;
  const hh = h / 2;
  const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
  const lineH = fontSize * 1.5;
  const totalH = lines.length * lineH;
  const startY = cy - totalH / 2 + lineH * 0.55;

  return (
    <G>
      <Polygon points={points} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.map((line, i) => (
        <SvgText key={i} x={cx} y={startY + i * lineH} textAnchor="middle" fontSize={fontSize} fill={textColor} fontWeight="600">
          {line}
        </SvgText>
      ))}
    </G>
  );
}

function Arrow({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const ax1 = x2 - ux * 10 - uy * 5;
  const ay1 = y2 - uy * 10 + ux * 5;
  const ax2 = x2 - ux * 10 + uy * 5;
  const ay2 = y2 - uy * 10 - ux * 5;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.arrow} strokeWidth={1.5} />
      <Polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={C.arrow} />
      {label && (
        <SvgText x={midX + 6} y={midY} fontSize={11} fill={C.label} fontWeight="600">
          {label}
        </SvgText>
      )}
    </G>
  );
}

function SectionHeader({ x, y, w, text }: { x: number; y: number; w: number; text: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={26} fill={C.sectionHeader} rx={4} />
      <SvgText x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={11} fill={C.sectionText} fontWeight="700" letterSpacing={1}>
        {text.toUpperCase()}
      </SvgText>
    </G>
  );
}

export default function SeizureFlowchart() {
  const cx = W / 2;
  const bw = 580;
  const bx = cx - bw / 2;
  const dw = 420;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={C.bg} />

      {/* ── TITLE ── */}
      <SvgText x={cx} y={36} textAnchor="middle" fontSize={18} fill={C.startText} fontWeight="800">
        Seizure Protocol
      </SvgText>
      <SvgText x={cx} y={56} textAnchor="middle" fontSize={11} fill={C.muted} fontWeight="500">
        Central Arizona Red Book 2026 · Adult &amp; Pediatric
      </SvgText>

      {/* ── START ── */}
      <Box x={bx} y={72} w={bw} h={52} fill={C.start} stroke={C.startBorder} rx={26}
        lines={['Patient Presenting with Seizure Activity']} textColor={C.startText} fontSize={14} />

      <Arrow x1={cx} y1={124} x2={cx} y2={148} />

      {/* ── SCENE SIZE-UP ── */}
      <SectionHeader x={bx} y={148} w={bw} text="Scene Size-Up & Safety" />
      <Box x={bx} y={182} w={bw} h={72} fill={C.emt} stroke={C.emtBorder}
        lines={['BSI / PPE', 'Ensure scene safety — protect patient from injury', 'Note: time seizure started / duration']}
        textColor={C.emtText} fontSize={12}
        badge="EMT" badgeColor={C.emtText} badgeBg="rgba(35,134,54,0.12)" badgeBorder="rgba(35,134,54,0.35)" />

      <Arrow x1={cx} y1={254} x2={cx} y2={276} />

      {/* ── INITIAL ASSESSMENT ── */}
      <SectionHeader x={bx} y={276} w={bw} text="Initial Assessment" />
      <Box x={bx} y={310} w={bw} h={86} fill={C.emt} stroke={C.emtBorder}
        lines={['LOC / Responsiveness', 'Airway — position, secretions, airway adjunct PRN', 'Breathing — rate, quality, SpO₂', 'Circulation — pulse, skin color/temp/moisture']}
        textColor={C.emtText} fontSize={12}
        badge="EMT" badgeColor={C.emtText} badgeBg="rgba(35,134,54,0.12)" badgeBorder="rgba(35,134,54,0.35)" />

      <Arrow x1={cx} y1={396} x2={cx} y2={418} />

      {/* ── STILL SEIZING? ── */}
      <Diamond cx={cx} cy={460} w={dw} h={80} fill={C.decision} stroke={C.decisionBorder}
        lines={['Is the patient', 'STILL seizing?']} textColor={C.decisionText} fontSize={13} />

      {/* YES branch */}
      <Arrow x1={cx} y1={500} x2={cx} y2={526} label="YES" />

      <SectionHeader x={bx} y={526} w={bw} text="Active Seizure Management" />
      <Box x={bx} y={560} w={bw} h={86} fill={C.emt} stroke={C.emtBorder}
        lines={['Protect airway — lateral recumbent position', 'Suction PRN · BVM/NRB if SpO₂ < 94%', 'DO NOT restrain patient / do not put anything in mouth', 'Monitor: SpO₂, ETCO₂, ECG, BGL']}
        textColor={C.emtText} fontSize={12}
        badge="EMT" badgeColor={C.emtText} badgeBg="rgba(35,134,54,0.12)" badgeBorder="rgba(35,134,54,0.35)" />

      <Arrow x1={cx} y1={646} x2={cx} y2={668} />

      {/* ── BGL ── */}
      <Diamond cx={cx} cy={710} w={dw} h={80} fill={C.decision} stroke={C.decisionBorder}
        lines={['Blood Glucose', '< 60 mg/dL?']} textColor={C.decisionText} fontSize={13} />

      {/* BGL YES */}
      <Arrow x1={cx + dw / 2} y1={710} x2={cx + dw / 2 + 20} y2={710} />
      <Line x1={cx + dw / 2 + 20} y1={710} x2={cx + dw / 2 + 20} y2={750} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={cx + dw / 2 + 20} y1={750} x2={cx + 170} y2={750} label="YES →" />
      <Box x={cx + 170} y={726} w={160} h={48} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['Dextrose / Glucagon', 'per hypoglycemia protocol']} textColor={C.drugText} fontSize={10} />

      {/* BGL NO */}
      <Arrow x1={cx} y1={750} x2={cx} y2={774} label="NO" />

      {/* ── PARAMEDIC IV/IO ── */}
      <SectionHeader x={bx} y={774} w={bw} text="ALS Interventions (Paramedic)" />
      <Box x={bx} y={808} w={bw} h={52} fill={C.para} stroke={C.paraBorder}
        lines={['Establish IV/IO access', 'Consider fluid bolus if hypotensive']}
        textColor={C.paraText} fontSize={12}
        badge="PARAMEDIC" badgeColor={C.paraText} badgeBg="rgba(214,40,40,0.12)" badgeBorder="rgba(214,40,40,0.35)" />

      <Arrow x1={cx} y1={860} x2={cx} y2={882} />

      {/* ── BENZO CHOICE ── */}
      <SectionHeader x={bx} y={882} w={bw} text="Benzodiazepine Administration" />

      {/* Adult drug box */}
      <Box x={bx} y={916} w={bw / 2 - 6} h={100} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['ADULT', 'Midazolam 5 mg IM/IN', 'or 2.5 mg IV/IO', '– OR –', 'Diazepam 5–10 mg IV slow']}
        textColor={C.drugText} fontSize={11} />

      {/* Peds drug box */}
      <Box x={bx + bw / 2 + 6} y={916} w={bw / 2 - 6} h={100} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['PEDIATRIC', 'Midazolam 0.1 mg/kg IM/IN', '(max 5 mg)', '– OR –', 'Diazepam 0.2–0.5 mg/kg IV']}
        textColor={C.drugText} fontSize={11} />

      <Arrow x1={cx} y1={1016} x2={cx} y2={1040} />

      {/* ── WAIT 5 MIN ── */}
      <Diamond cx={cx} cy={1082} w={dw} h={80} fill={C.decision} stroke={C.decisionBorder}
        lines={['Seizure resolved', 'after 5 min?']} textColor={C.decisionText} fontSize={13} />

      {/* NO — repeat benzo */}
      <Line x1={cx - dw / 2} y1={1082} x2={cx - dw / 2 - 20} y2={1082} stroke={C.arrow} strokeWidth={1.5} />
      <Line x1={cx - dw / 2 - 20} y1={1082} x2={cx - dw / 2 - 20} y2={1150} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={cx - dw / 2 - 20} y1={1150} x2={cx - dw / 2 + 10} y2={1150} />
      <Box x={bx} y={1126} w={220} h={48} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['Repeat benzo × 1', '(same dose — NO ×3)']} textColor={C.drugText} fontSize={11} />
      <SvgText x={cx - dw / 2 - 36} y={1120} fontSize={10} fill={C.label} fontWeight="700" transform={`rotate(-90, ${cx - dw / 2 - 36}, ${1120})`}>
        NO
      </SvgText>

      {/* YES */}
      <Arrow x1={cx} y1={1122} x2={cx} y2={1148} label="YES" />

      {/* ── POST-ICTAL ── */}
      <SectionHeader x={bx} y={1148} w={bw} text="Post-Ictal Care" />
      <Box x={bx} y={1182} w={bw} h={72} fill={C.emt} stroke={C.emtBorder}
        lines={['Reassess ABC — airway, breathing, vitals', 'Lateral recumbent; oxygen maintain SpO₂ ≥ 94%', 'Monitor LOC, reorientation, GCS trend']}
        textColor={C.emtText} fontSize={12}
        badge="EMT" badgeColor={C.emtText} badgeBg="rgba(35,134,54,0.12)" badgeBorder="rgba(35,134,54,0.35)" />

      <Arrow x1={cx} y1={1254} x2={cx} y2={1276} />

      {/* ── RED FLAGS ── */}
      <SectionHeader x={bx} y={1276} w={bw} text="Red Flag Assessment" />

      <Diamond cx={cx} cy={1338} w={dw} h={80} fill={C.decision} stroke={C.decisionBorder}
        lines={['Any RED FLAG', 'present?']} textColor={C.decisionText} fontSize={13} />

      {/* Red flags list */}
      <Box x={bx} y={1432} w={bw} h={130} fill={'#1c1410'} stroke={C.warningBorder} rx={8}
        lines={[
          'Status epilepticus (≥ 5 min or no recovery between)',
          'First-time seizure · Pregnant · Head trauma',
          'Fever + seizure in adult · Altered mental status',
          'Focal deficit post-ictally · Unknown cause',
          'Hypoxia (SpO₂ < 90%) refractory to O₂',
        ]}
        textColor={C.warningText} fontSize={11} />

      {/* YES — Red flag → ALS/Notify */}
      <Arrow x1={cx + dw / 2} y1={1338} x2={cx + dw / 2 + 20} y2={1338} />
      <Line x1={cx + dw / 2 + 20} y1={1338} x2={cx + dw / 2 + 20} y2={1380} stroke={C.arrow} strokeWidth={1.5} />
      <Box x={cx + dw / 2 + 20} y={1370} w={158} h={48} fill={C.para} stroke={C.paraBorder} rx={8}
        lines={['ALS intercept', 'Notify medical control']} textColor={C.paraText} fontSize={11} />
      <SvgText x={cx + dw / 2 + 26} y={1354} fontSize={10} fill={C.label} fontWeight="700">
        YES
      </SvgText>

      <Arrow x1={cx} y1={1378} x2={cx} y2={1432} label="NO" />

      <Arrow x1={cx} y1={1562} x2={cx} y2={1584} />

      {/* ── TRANSPORT ── */}
      <SectionHeader x={bx} y={1584} w={bw} text="Transport Decision" />

      <Diamond cx={cx} cy={1636} w={dw} h={80} fill={C.decision} stroke={C.decisionBorder}
        lines={['History of seizures', '+ returned to baseline?']} textColor={C.decisionText} fontSize={13} />

      {/* YES — Stable transport */}
      <Arrow x1={cx} y1={1676} x2={cx} y2={1700} label="YES" />
      <Box x={bx} y={1700} w={bw} h={52} fill={C.action} stroke={C.actionBorder}
        lines={['Transport to ED — routine', 'Continue monitoring en route']} textColor={C.actionText} fontSize={13} />

      {/* NO — Priority transport */}
      <Arrow x1={cx - dw / 2} y1={1636} x2={cx - dw / 2 - 20} y2={1636} />
      <Line x1={cx - dw / 2 - 20} y1={1636} x2={cx - dw / 2 - 20} y2={1726} stroke={C.arrow} strokeWidth={1.5} />
      <Arrow x1={cx - dw / 2 - 20} y1={1726} x2={bx} y2={1726} />
      <SvgText x={cx - dw / 2 - 36} y={1690} fontSize={10} fill={C.label} fontWeight="700" transform={`rotate(-90, ${cx - dw / 2 - 36}, ${1690})`}>
        NO
      </SvgText>

      <Box x={bx} y={1760} w={bw} h={52} fill={C.para} stroke={C.paraBorder}
        lines={['Priority transport — ALS', 'Early medical control notification']} textColor={C.paraText} fontSize={13}
        badge="PARAMEDIC" badgeColor={C.paraText} badgeBg="rgba(214,40,40,0.12)" badgeBorder="rgba(214,40,40,0.35)" />

      <Arrow x1={cx} y1={1752} x2={cx} y2={1760} />
      <Arrow x1={cx} y1={1812} x2={cx} y2={1836} />

      {/* ── EN ROUTE ── */}
      <SectionHeader x={bx} y={1836} w={bw} text="Ongoing Management En Route" />
      <Box x={bx} y={1870} w={bw} h={86} fill={C.emt} stroke={C.emtBorder}
        lines={['Reassess every 5 min — vitals, LOC, GCS', 'Maintain SpO₂ ≥ 94% · ETCO₂ 35–45 mmHg', 'Document: seizure type, duration, frequency, medications given', 'ETA notification with MIVT report']}
        textColor={C.emtText} fontSize={12}
        badge="EMT" badgeColor={C.emtText} badgeBg="rgba(35,134,54,0.12)" badgeBorder="rgba(35,134,54,0.35)" />

      <Arrow x1={cx} y1={1956} x2={cx} y2={1978} />

      {/* ── PEDS SPECIAL ── */}
      <SectionHeader x={bx} y={1978} w={bw} text="Pediatric Special Considerations" />
      <Box x={bx} y={2012} w={bw} h={130} fill={'#0f1720'} stroke={'rgba(88,166,255,0.4)'} rx={8}
        lines={[
          'Febrile seizure: most common cause in < 5 yrs',
          'Weight-based dosing: Midazolam 0.1 mg/kg IM (max 5 mg)',
          'Diazepam rectal 0.5 mg/kg (max 20 mg) if no IV access',
          'Lorazepam 0.1 mg/kg IV/IO (max 4 mg) — ALS',
          'Consider ALTE, meningitis, metabolic in neonates/infants',
          'Broselow tape for weight estimation if unknown',
        ]}
        textColor={'#58a6ff'} fontSize={11} />

      <Arrow x1={cx} y1={2142} x2={cx} y2={2164} />

      {/* ── DRUG REFERENCE ── */}
      <SectionHeader x={bx} y={2164} w={bw} text="Drug Reference Summary" />

      <Box x={bx} y={2198} w={bw / 2 - 6} h={110} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['MIDAZOLAM', 'Adult: 5 mg IM / 2.5 mg IV/IO', 'Peds: 0.1 mg/kg IM (max 5 mg)', 'IN: same dose via atomizer', 'Onset: 2–5 min IM']}
        textColor={C.drugText} fontSize={11} />

      <Box x={bx + bw / 2 + 6} y={2198} w={bw / 2 - 6} h={110} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['DIAZEPAM', 'Adult: 5–10 mg IV slow push', 'Peds: 0.2–0.5 mg/kg IV (max 10 mg)', 'Rectal: 0.5 mg/kg (peds)', 'Onset: 1–3 min IV']}
        textColor={C.drugText} fontSize={11} />

      <Box x={bx} y={2318} w={bw / 2 - 6} h={100} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['LORAZEPAM (ALS)', 'Adult: 2–4 mg IV/IO slow', 'Peds: 0.1 mg/kg IV/IO (max 4 mg)', 'Onset: 2–5 min IV']}
        textColor={C.drugText} fontSize={11} />

      <Box x={bx + bw / 2 + 6} y={2318} w={bw / 2 - 6} h={100} fill={C.drug} stroke={C.drugBorder} rx={8}
        lines={['DEXTROSE', 'D50: 25 g IV (adult hypoglycemia)', 'D25: 0.5–1 g/kg IV (peds)', 'Glucagon 1 mg IM (no IV access)']}
        textColor={C.drugText} fontSize={11} />

      <Arrow x1={cx} y1={2418} x2={cx} y2={2440} />

      {/* ── DOCUMENTATION ── */}
      <SectionHeader x={bx} y={2440} w={bw} text="Documentation Requirements" />
      <Box x={bx} y={2474} w={bw} h={86} fill={C.action} stroke={C.actionBorder}
        lines={['Seizure onset time, type, duration, frequency', 'Medications admin: drug, dose, route, time, response', 'Neurological assessment: GCS, pupils, focal deficits', 'Vitals trend including SpO₂ and ETCO₂']}
        textColor={C.actionText} fontSize={12} />

      {/* ── END ── */}
      <Box x={bx} y={2572} w={bw} h={12} fill={'#1c2128'} stroke={'#30363d'} rx={6} lines={[]} textColor={C.muted} />
      <SvgText x={cx} y={2597} textAnchor="middle" fontSize={10} fill={C.muted}>
        Central Arizona Red Book 2026 · For authorized EMS personnel only
      </SvgText>
    </Svg>
  );
}
