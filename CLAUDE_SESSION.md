# EMS Protocol App — Claude Session State
Last updated: April 16, 2026

---

## Tools & Workflow
- **Claude Chat (claude.ai)** — protocol content research, flowchart component generation
- **Claude Code (terminal)** — wiring, routing, debugging, Git pushes
- **GitHub** — version control, source of truth
- **Expo Go (Android, Samsung Note 10+)** — live device testing

## How to Resume Development
1. Open **Command Prompt** (Windows key → type `cmd` → Enter). NOT PowerShell.
2. Launch Expo (Window 1):
   ```
   cd C:\Users\KyleW\ems-protocol-app
   npm run dev
   ```
   Then scan QR code fresh with Expo Go — always re-scan, never use cached connection.
3. Open a second Command Prompt window for Claude Code (Window 2):
   ```
   cd C:\Users\KyleW\ems-protocol-app
   npx @anthropic-ai/claude-code
   ```
   (type y if prompted — select "Yes, I trust this folder")
4. Claude Code reads the full project automatically — paste your instruction and go.
5. If you need to run any other commands, open a third CMD window.

## Environment Notes
- Use `npm run dev` NOT `npx expo start`
- Tunnel mode does NOT work — Windows ARM64, no ngrok binary support
- Using --lan mode instead
- Always re-scan QR code at start of each session — laptop IP can change mid-session too
- PowerShell blocks npx — always use Command Prompt (cmd)
- Static IP assigned to laptop: `192.168.68.100` (set in Network Adapter IPv4 settings)

---

## Stack
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- react-native-gesture-handler + react-native-reanimated for pinch zoom
- Supabase + Claude API for Scenario AI
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Testing: Expo Go on Android (Samsung Note 10+)

---

## App Structure (4 screens)

### 1. Protocols Tab
- `app/protocol/[id].tsx` — viewer screen for all protocol flowcharts
  - ScrollView (vertical, native scroll) wrapping the flowchart component
  - Pinch-to-zoom via GestureDetector + Animated.View (scale only, no pan)
  - FLOWCHART_W = 470 (matches canvas W in flowchart components)
  - No fixed FLOWCHART_H — wraps to content height naturally
  - Zoom in/out/reset buttons in header
  - Hint bar: "Scroll to navigate · Pinch to zoom"

### 2. Drug Reference Tab
- Functional — search + category filter + scope badges
- Currently using Bolt-generated dataset (~24 drugs)
- TODO: replace with full 40-drug Red Book dataset

### 3. Drug Calculation Tab
- Functional — weight-based dose calculator
- kg/lbs toggle, pediatric detection (age < 15)
- TODO: verify all doses match Red Book exactly

### 4. Scenario AI Tab
- Was functional (Claude API grounded on Red Book)
- May need API key re-check if broken

---

## Protocol Flowcharts — Status

| Protocol | Status | File |
|---|---|---|
| Seizures | ✅ Complete | `SeizureFlowchart.tsx` |
| Chest Pain / ACS / STEMI | ✅ Complete | `ChestPainFlowchart.tsx` |
| Stroke / TIA | ✅ Complete | `StrokeTIAFlowchart.tsx` |
| RSI (Rapid Sequence Intubation) | ✅ Complete | `RSIFlowchart.tsx` |
| Airway Management | ✅ Complete | `AirwayManagementFlowchart.tsx` |
| Cardiac Arrest — Shockable (VF/VT) | 🔲 Next | rebuild from `cardiac-arrest-shockable.html` |
| Cardiac Arrest — Non-Shockable (Asystole/PEA) | 🔲 Next | rebuild from `cardiac-arrest-non-shockable.html` |

---

## Flowchart Architecture — v2 (ALL protocols follow this)

**SeizureFlowchart.tsx is the master template.**

### Core Pattern
- Plain `<View>` container, no fixed height
- RN layout column — step boxes stack naturally
- SVG overlay (`StyleSheet.absoluteFill`) draws all arrows, shapes, bars, text
- `onLayout` measurements feed real Y positions to SVG
- Layouts: `{ top: number, bot: number }` per key
- `ready` flag: `REQUIRED_KEYS.every(k => L[k] !== undefined)`
- Null guard in renderSVG: `if (REQUIRED_KEYS.some(k => !L[k])) return null;`

### Canvas Constants
```
W = 470, cx = 235
BW = 440, BX = 15, BR = 455
GAP = 24
STEP_PADDING_V = 10
DW = 240, DCX = 135, DXR = 255
CBW = 140, CBX = 315
```

### Section Bar Pattern (CRITICAL)
**No arrow between any bar and its adjacent step. No GAP spacer after bars.**

EMT bar:
```tsx
<View onLayout={measure('emtBar')} style={{ height: 20, marginHorizontal: BX }} />
{E('step1', ...)}   // NO gap, NO arrow
```

PARAMEDIC bar — arrow INTO bar from above, nothing out:
```tsx
// SVG: arrow terminates at bar top
<Arrow x1={cx} y1={L.stepN.bot} x2={cx} y2={L.paraBar.top} />
<Rect x={BX} y={L.paraBar.top} ... />  // draw bar

// RN layout:
<View onLayout={measure('paraBar')} style={{ height: 20, marginHorizontal: BX }} />
{P('step5', ...)}   // NO gap, NO arrow
```

### Diamond Arrow Routing (CRITICAL)
ALL vertical arrows touching diamonds stay at DCX (not cx):
```tsx
// Into diamond top
<Arrow x1={DCX} y1={L.prevStep.bot} x2={DCX} y2={L.dec1.top} />

// Out of diamond bottom
<Arrow x1={DCX} y1={L.dec1.bot} x2={DCX} y2={L.nextStep.top} />

// Out of diamond right tip — horizontal only
<Arrow x1={DXR} y1={d1mid} x2={CBX} y2={d1mid} label="NO" />
```

### YES/NO Labels (vertical arrows)
Manual SvgText, never use Arrow label prop for vertical arrows:
```tsx
<Arrow x1={DCX} y1={Y1} x2={DCX} y2={Y2} />
<SvgText x={DCX + 14} y={(Y1 + Y2) / 2 + 4}
  fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle">YES</SvgText>
```

### Diamond + Callout RN Layout
Diamond measured inline, callout is a 4px stub (not measured for positioning):
```tsx
<View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />
<View onLayout={measure('callout1')} style={{ height: 4 }} />
<View style={{ height: GAP }} />
```
Callout keys are NOT in REQUIRED_KEYS.

### Callout Box — Compute Height from Text (never hardcode)
```tsx
const CALLOUT_LINE_H = 12;
const CALLOUT_PAD = 8;
function Callout(midY: number, lines: string[], bg, border, tc) {
  const textBlockH = (lines.length - 1) * CALLOUT_LINE_H + 10;
  const boxH = textBlockH + CALLOUT_PAD * 2;  // 3 lines = 50px
  const top = midY - boxH / 2;
  const firstBaselineY = top + CALLOUT_PAD + 8;
  return (
    <>
      <Rect x={CBX} y={top} width={CBW} height={boxH} rx={6} ... />
      {lines.map((line, i) => (
        <SvgText ... y={firstBaselineY + i * CALLOUT_LINE_H}>{line}</SvgText>
      ))}
    </>
  );
}
```

### STEP Label Color
Use `bodyColor` (not `border`) for STEP N text:
```tsx
<Text style={[styles.stepLabel, { color: bodyColor }]}>{stepNum}</Text>
```

### Colour Tokens
```
bg:          '#0d1117'
emtBg:       '#21262d'   emtBorder:  '#484f58'   emtTitle:  '#e6edf3'   emtSub:   '#8b949e'
paraBg:      '#1b3a2d'   paraBorder: '#0F6E56'   paraTitle: '#56d364'   paraSub:  '#8fcca0'
critBg:      '#2a1a0a'   critBorder: '#f0883e'   critTitle: '#f0883e'   critSub:  '#d29922'
decBg:       '#1f3a5f'   decBorder:  '#185FA5'   decText:   '#79c0ff'
destBg:      '#3a1010'   destBorder: '#d62828'   destText:  '#f85149'
pedsBg:      '#0a1a2a'   pedsBorder: '#1f6feb'   pedsDrug:  '#58a6ff'   pedsDose: '#a5d6ff'
warnBg:      '#1a1400'   warnBorder: '#9e6a03'   warnText:  '#d29922'
secBg:       '#161b22'   secText:    '#6e7681'
arrow:       '#6e7681'   label:      '#8b949e'   discText:  '#6e7681'
```

### Footer (all protocols)
```tsx
<SvgText x={cx} y={L.lastStep.bot + 20} fontSize={10} fill={C.discText} textAnchor="middle">
  Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
</SvgText>
<SvgText x={cx} y={L.lastStep.bot + 36} fontSize={10} fill={C.discText} textAnchor="middle">
  Reference aid only — does not replace online medical direction or clinical judgment.
</SvgText>
```
Bottom padding before renderSVG: `<View style={{ height: 56 }} />`

### Inline Reference Blocks (Stroke/TIA)
- FAST: `FAST_TOTAL=146`
- VAN: `VAN_TOTAL=162`
- RN: `<View onLayout={measure('key')} style={{ height: TOTAL }} />`
- Use `<Line>` (no arrowhead) into blocks, `<Arrow>` out

---

## Protocol Details

### Seizures (`SeizureFlowchart.tsx`)
- Adult & Pediatric
- Includes BGL decision, pregnancy decision, benzodiazepine ladder

### Chest Pain / ACS / STEMI (`ChestPainFlowchart.tsx`)
- Adult only
- Aspirin, 12-lead ECG, NTG ladder, Fentanyl, STEMI alert/destination

### Stroke / TIA (`StrokeTIAFlowchart.tsx`)
- Adult & Pediatric
- FAST reference block, VAN reference block
- Destination decisions: onset < 4hrs → nearest SC; onset > 4hrs → VAN → Comprehensive

### RSI (`RSIFlowchart.tsx`)
- Age ≥ 15, STR protocol
- EMT section: Universal Care + Indications + Contraindications
- PARAMEDIC section: RSI 1-5
- Etomidate & Succinylcholine: ONE-TIME only
- Rocuronium: requires agency/medical director approval
- Post-intubation: Fentanyl, Morphine, Midazolam, Lorazepam, Ketamine (all repeatable)

### Airway Management (`AirwayManagementFlowchart.tsx`)
- Adult & Pediatric
- 10 steps: EMT 1-4, PARAMEDIC 5-10
- Decision 1: Respiratory Failure/Arrest? → NO → Position of Comfort/Suction PRN/OPA NPA Adjuncts
- Decision 2: BVM/NIPPV Effective? → YES → Continue & Monitor / EtCO2, SpO2 / Vitals
- Pediatric Exception block (age < 8): OPA+SGA only, NO ETI, needle cric only
- PEDS_H = 80
- Airway pediatric threshold: age < 8 (different from other protocols)

---

## Remaining Build Tasks
1. Cardiac Arrest — Shockable (VF/VT) — rebuild HTML → RN v2
2. Cardiac Arrest — Non-Shockable (Asystole/PEA) — rebuild HTML → RN v2
3. Replace Drug Reference with full 40-drug Red Book dataset
4. Verify Drug Calculation doses match Red Book
5. Fix Android nav bar covering bottom tabs
6. EAS Build / App Store submission

---

## Key Clinical Rules (Red Book 2026)
- Pediatric (general): under 15 years old
- Pediatric (airway): under 8 years old
- Defibrillation joules: "per monitor settings" — never hardcode
- Epinephrine: max 3 doses per cardiac arrest protocol
- NTG: contraindicated if PDE5 inhibitor within 48 hrs; requires SBP > 100
- Aspirin: adult ACS only
- Fentanyl (STEMI): 0.5 mcg/kg, max initial 50 mcg, max total 200 mcg
- RSI Etomidate & Succinylcholine: ONE-TIME dose only
- RSI Rocuronium: requires agency/medical director approval
- Stroke onset < 4hrs → nearest stroke center
- Stroke onset > 4hrs → VAN screen → Comprehensive/Thrombectomy capable (unless > 30 min → closest)

---

## Last GitHub Commit
- RSI + Airway Management — April 16, 2026
- "Add RSI and Airway Management flowcharts with standardized section bar pattern, diamond routing, and tight callout boxes"
- Previous: `b4aaf75` — April 15, 2026 — Stroke/TIA + YES/NO label updates
