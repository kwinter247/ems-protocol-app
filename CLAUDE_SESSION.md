# EMS Protocol App — Claude Session State
Last updated: April 13, 2026

## Stack
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- react-native-gesture-handler + react-native-reanimated for pinch zoom
- Supabase + Claude API for Scenario AI
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Dev server: npx expo start (port auto-assigned)
- Testing: Expo Go on Android (Samsung Note 10+)

## How to Resume Development
1. Open Command Prompt on laptop
2. `cd C:\Users\KyleW\ems-protocol-app`
3. `claude` to launch Claude Code
4. Claude Code reads the full project automatically — paste your instruction and go

---

## App Structure (4 screens)

### 1. Protocols Tab
- `app/protocol/[id].tsx` — viewer screen for all protocol flowcharts
  - ScrollView (vertical, native scroll) wrapping the flowchart component
  - Pinch-to-zoom via GestureDetector + Animated.View (scale only, no pan)
  - FLOWCHART_W = 470 (matches canvas W in flowchart components)
  - No fixed FLOWCHART_H — Animated.View wraps to content height naturally
  - Zoom in/out/reset buttons in header
  - Hint bar: "Scroll to navigate · Pinch to zoom"
  - bounces={false} + overScrollMode="never" on ScrollView
- Only protocol built so far: Seizures (see below)

### 2. Drug Reference Tab
- Functional — search + category filter + scope badges
- Currently using Bolt-generated dataset (~24 drugs)
- TODO: replace with full 40-drug Red Book dataset

### 3. Drug Calculation Tab
- Functional — weight-based dose calculator
- kg/lbs toggle
- Pediatric detection (age < 15 per Red Book)
- Blue peds / red adult color coding
- TODO: verify all doses match Red Book exactly

### 4. Scenario AI Tab
- Was functional at one point (Claude API grounded on Red Book)
- May need API key re-check if broken
- kg/lbs toggle present
- Pediatric badge when age < 15 or weight suggests peds

---

## SeizureFlowchart — COMPLETE ✅
### Architecture (v2 — this is the template for ALL future protocols)

**The core pattern:**
- Overall container: plain `<View>` with no fixed height
- RN layout column drives all vertical positioning — step boxes stack
  naturally via flex, self-sizing based on content
- SVG overlay (StyleSheet.absoluteFill) draws ALL arrows, diamonds,
  lines, callout box shapes, title, section headers
- SVG reads real Y positions via `onLayout` measurements from RN elements
- No fixed STEP_H, STEP6_H, or Y_* coordinate constants
- `ready` flag gates SVG rendering until all onLayout measurements are in

**Key files:**
- `components/protocols/SeizureFlowchart.tsx` — the flowchart (v2 architecture)
- `components/protocols/SeizureFlowchart_v1.tsx` — original backup (keep, don't touch)
- `components/protocols/SeizureFlowchart_OLD.tsx` — pre-v2 backup (can delete)
- `app/protocol/[id].tsx` — viewer/scroll/zoom screen

**Canvas constants:**
- W = 470, cx = W/2 = 235
- BW = 440, BX = cx - BW/2 = 15, BR = BX + BW = 455
- DW = 240, DCX = BX + DW/2 = 135
- CBW = 110, CBX = BR - CBW = 345
- GAP = 24 (standard gap between all elements)
- STEP_PADDING_V = 10 (paddingVertical on step boxes)

**Colour tokens (C object) — use for ALL future protocols:**
- bg: '#0d1117' — canvas background
- emtBg/Border/Title/Sub: '#21262d' / '#484f58' / '#e6edf3' / '#8b949e'
- paraBg/Border/Title/Sub: '#1b3a2d' / '#0F6E56' / '#56d364' / '#8fcca0'
- critBg/Border/Title: '#2a1a0a' / '#f0883e' / '#f0883e' (critical/orange)
- decBg/Border/Text: '#1f3a5f' / '#185FA5' / '#79c0ff' (decision diamonds)
- destBg/Border/Text: '#3a1010' / '#d62828' / '#f85149' (redirect/danger)
- pregBg/Border/Text: '#2a1020' / '#993556' / '#f9a8d4' (pregnancy)
- adultBg/Border/Drug/Dose: '#1c1208' / '#9e6a03' / '#f0883e' / '#d29922'
- pedsBg/Border/Drug/Dose: '#0a1a2a' / '#1f6feb' / '#58a6ff' / '#a5d6ff'
- secBg/Text: '#161b22' / '#6e7681' (section headers)
- arrow: '#6e7681', label: '#8b949e', muted: '#6e7681'
- inclBg/Border/Text: '#1c2128' / '#8b949e' / '#c9d1d9'
- discText: '#6e7681'

**Step box badge system:**
- EMT steps: badge="EMT", emtTitle color, emtBg/Border
- Paramedic steps: badge="PARAMEDIC", paraTitle color, paraBg/Border
- Critical steps: badge="PARAMEDIC", critTitle color, critBg/Border
- All providers: badge="ALL PROVIDERS", emtTitle color, emtBg/Border

**Benzo column layout (Step 4):**
- colW = BW/2 - 5
- Two side-by-side SVG rects: adult (adultBg/Border) + peds (pedsBg/Border)
- BENZO_COL_H = 195
- SectionHeader text color for Step 4 header: C.critTitle (#f0883e)
- "Administer Benzodiazepine" header fontSize={18}
- Drug name fontSize={13}, dose fontSize={14}

**Diamond sizes:**
- DIA1_H = 100 (BGL < 60?)
- DIA2_H = 120 (Pregnant > 20 wk?)
- DIA3_H = 100 (Seizure stopped? post-benzo)
- DIA4_H = 100 (Seizure stopped? post-repeat)

**onLayout measurement keys:**
step1, step2, spacer1, step3, spacer2, benzospace, spacer3, step5,
spacer4, step6, step7, pregnote, disc

---

## How to Build a New Protocol Flowchart

1. Copy `SeizureFlowchart.tsx` → rename to e.g. `StrokeFlowchart.tsx`
2. Keep all architecture, helpers, colour tokens, and canvas constants
3. Replace: step content, diamond content, callout box content,
   benzo section (or remove if not applicable), onLayout keys,
   diamond height constants, and section headers
4. Add the new flowchart to the protocol list/router so it appears
   in the Protocols tab
5. Test on device — verify onLayout measurements produce clean arrow alignment

---

## Remaining Build Tasks (priority order)
1. Chest Pain / ACS / STEMI flowchart
2. Stroke / TIA flowchart
3. Airway Management flowchart
4. Cardiac Arrest flowchart (shockable + non-shockable — previously
   built as HTML, needs to be rebuilt in RN using v2 architecture)
5. Replace Drug Reference dataset with full 40-drug Red Book data
6. Verify Drug Calculation doses match Red Book exactly
7. Fix Android nav bar covering bottom tabs (known issue)
8. EAS Build / App Store submission

---

## Key Clinical Rules (Red Book 2026)
- Pediatric = under 15 years old
- Defibrillation joules: reference "per monitor settings" only
  (Philips MRx, Stryker LIFEPAK, Zoll X Series) — never hardcode joules
- Max epinephrine doses: 3 doses per cardiac arrest protocol
