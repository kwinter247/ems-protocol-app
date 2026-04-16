# EMS Protocol App — Claude Session State
Last updated: April 15, 2026

---

## Tools & Workflow
- **Claude Chat (claude.ai)** — protocol content research, flowchart component generation
- **Claude Code (terminal)** — wiring, routing, debugging, Git pushes
- **GitHub** — version control, source of truth
- **Expo Go (Android, Samsung Note 10+)** — live device testing

## How to Resume Development
1. Open **Command Prompt** (Windows key → type `cmd` → Enter). NOT PowerShell.
2. Launch Expo (Window 1):
   cd C:\Users\KyleW\ems-protocol-app
   npm run dev
   Then scan QR code fresh with Expo Go — always re-scan, never use cached connection.
3. Open a second Command Prompt window for Claude Code (Window 2):
   cd C:\Users\KyleW\ems-protocol-app
   npx @anthropic-ai/claude-code
   (type y if prompted)
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
  - No fixed FLOWCHART_H — Animated.View wraps to content height naturally
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
- Was functional at one point (Claude API grounded on Red Book)
- May need API key re-check if broken

---

## Protocol Flowcharts — Status

| Protocol | Status | File |
|---|---|---|
| Seizures | ✅ Complete | `SeizureFlowchart.tsx` |
| Chest Pain / ACS / STEMI | ✅ Complete | `ChestPainFlowchart.tsx` |
| Stroke / TIA | ✅ Complete | `StrokeTIAFlowchart.tsx` |
| Airway Management | 🔲 Next | — |
| Cardiac Arrest — Shockable (VF/VT) | 🔲 Needs RN rebuild | was `cardiac-arrest-shockable.html` |
| Cardiac Arrest — Non-Shockable (Asystole/PEA) | 🔲 Needs RN rebuild | was `cardiac-arrest-non-shockable.html` |

### Build Priority Order
1. Airway Management
2. Cardiac Arrest — Shockable (rebuild from HTML → RN v2 architecture)
3. Cardiac Arrest — Non-Shockable (rebuild from HTML → RN v2 architecture)

---

## Flowchart Architecture — v2 (Template for ALL protocols)

**SeizureFlowchart.tsx is the master template. Always copy it as the starting point.**

### Core Pattern
- Overall container: plain `<View>` with no fixed height
- RN layout column drives all vertical positioning — step boxes stack naturally via flex
- SVG overlay (`StyleSheet.absoluteFill`) draws ALL arrows, diamonds, lines, callout boxes, title, section headers
- SVG reads real Y positions via `onLayout` measurements from RN elements
- Layouts store **top AND bottom Y** of each box (`{ top: number, bot: number }`)
- `ready` flag uses explicit key check: `REQUIRED_KEYS.every(k => L[k] !== undefined)` — never count keys
- Arrows draw from `box.bot` to `nextBox.top` — never through content

### Canvas Constants
```
W = 470, cx = W/2 = 235
BW = 440, BX = cx - BW/2 = 15, BR = BX + BW = 455
GAP = 24 (standard gap between all elements)
STEP_PADDING_V = 10
DW = 240 (diamond width)
DCX = BX + DW/2 = 135 (diamond center X)
CBW = 110 (callout box width)
CBX = BR - CBW = 345 (callout box left edge)
```

### YES/NO Label Pattern (updated standard — apply to ALL new protocols)
Downward arrows do NOT use the Arrow `label` prop. Instead render a manual `SvgText` immediately after the Arrow call:
```
<Arrow x1={DCX} y1={Y_START} x2={DCX} y2={Y_END} />
<SvgText
  x={DCX + 14}
  y={(Y_START + Y_END) / 2 + 4}
  fontSize={11} fill={C.label} fontWeight="700" textAnchor="middle"
>NO</SvgText>
```
- Offset 14px right of center so label doesn't overlap arrow shaft
- y offset +4 from midpoint pushes it slightly below center, away from diamond tip
- Horizontal arrows (going left/right to callout boxes) keep labels inline as normal

### Colour Tokens (C object) — use for ALL protocols
```
bg: '#0d1117'
emtBg/Border/Title/Sub: '#21262d' / '#484f58' / '#e6edf3' / '#8b949e'
paraBg/Border/Title/Sub: '#1b3a2d' / '#0F6E56' / '#56d364' / '#8fcca0'
critBg/Border/Title/Sub: '#2a1a0a' / '#f0883e' / '#f0883e' / (varies)
decBg/Border/Text: '#1f3a5f' / '#185FA5' / '#79c0ff'
destBg/Border/Text: '#3a1010' / '#d62828' / '#f85149'  ← RED critical callouts
adultDrug/Dose: '#f0883e' / '#d29922'
pedsBg/Border/Drug/Dose: '#0a1a2a' / '#1f6feb' / '#58a6ff' / '#a5d6ff'
secBg/Text: '#161b22' / '#6e7681'
arrow: '#6e7681', label: '#8b949e', muted: '#6e7681'
warnBg/Border/Text: '#1a1400' / '#9e6a03' / '#d29922'  ← AMBER warnings
inclBg/Border/Text: '#1c2128' / '#8b949e' / '#c9d1d9'
discText: '#6e7681'
```

### Step Box Layout (v2 standard)
- Top-left: `STEP N` label — color matches box accent
- Top-right: scope badge in bordered pill (`borderWidth: 1, borderRadius: 4`)
- Below: title + content
- EMT boxes: gray (`emtBg/Border/Title/Sub`)
- Paramedic boxes: green (`paraBg/Border/paraTitle/paraSub`)
- Drug intervention boxes: orange (`critBg/Border/critTitle/critSub`)
- Critical/destination callout boxes: RED (`destBg/Border/destText`)

### Inline Reference Blocks (established in Stroke/TIA)
Fixed-height SVG blocks used for inline educational/reference content between steps:
- **FAST block**: 4-column card grid (F/A/S/T), T column in orange. Header bar in `secBg`. Constants: `FAST_HDR_H=28, FAST_CARD_H=110, FAST_TOTAL=146`
- **VAN block**: 3-column card grid (V/A/N) in `decBg/decBorder`. Header in `paraBg`. Constants: `VAN_HDR_H=28, VAN_SUB_H=22, VAN_CARD_H=100, VAN_TOTAL=162`
- Pattern: RN `<View onLayout={measure('blockkey')} style={{ height: BLOCK_TOTAL }}>` spacer + SVG draws content at measured Y
- Use connector `<Line>` (no arrowhead) into reference blocks, `<Arrow>` out of them

### Section Bars
- EMT bar: drawn in SVG at Y=56, height 20, `secBg`, text `emtSub`
- PARAMEDIC bar: measured RN `<View>` with `onLayout` — SVG draws rect at exact measured Y
- No arrow between PARAMEDIC bar and first paramedic step

### How to Build a New Protocol Flowchart
1. In Claude Chat, paste this session state + ask for the new protocol
2. Claude Chat reads the Red Book PDF (stored in the Claude project) for protocol content
3. Claude Chat generates the complete `.tsx` file
4. Download → verify in Notepad (search for a unique string from the new version) → copy to `components/protocols/`
5. Open Claude Code and say: "Wire up [ProtocolName]Flowchart to the protocol router — follow the same pattern as StrokeTIAFlowchart"
6. Test in Expo Go — expect 1-2 rounds of layout fixes before it's clean
7. Push to GitHub from Claude Code when done

---

## Remaining Build Tasks (priority order)
1. Airway Management flowchart
2. Cardiac Arrest — Shockable (VF/VT) flowchart — rebuild from HTML to RN v2
3. Cardiac Arrest — Non-Shockable (Asystole/PEA) flowchart — rebuild from HTML to RN v2
4. Reconcile minor formatting differences between Seizure and Chest Pain protocols
5. Apply offset YES/NO label pattern to ChestPainFlowchart (done via Claude Code session Apr 15)
6. Replace Drug Reference dataset with full 40-drug Red Book data
7. Verify Drug Calculation doses match Red Book exactly
8. Fix Android nav bar covering bottom tabs (known issue)
9. EAS Build / App Store submission

---

## Key Clinical Rules (Red Book 2026)
- Pediatric = under 15 years old
- Defibrillation joules: reference "per monitor settings" only — never hardcode joules
- Max epinephrine doses: 3 doses per cardiac arrest protocol
- NTG contraindicated if PDE5 inhibitor taken within 48 hours
- NTG requires SBP > 100 mmHg
- Aspirin indicated for adult ACS only — not pediatric
- Fentanyl for STEMI chest pain unresponsive to NTG: 0.5 mcg/kg IN/IV/IO, max initial 50 mcg, max total 200 mcg
- Stroke destination: onset < 4 hrs → nearest stroke center; onset > 4 hrs → VAN screen → Comprehensive/Thrombectomy capable (unless > 30 min then closest)
- Stroke scales not validated in pediatric patients

---

## Source Document
- Red Book: Central Arizona Regional EMS Guidelines, Chapter 3
- Updated November 2025, effective January 12, 2026
- PDF stored in the Claude project (available to Claude Chat automatically)
- 186 pages, fully text-extractable

---

## Last GitHub Commit
- Commit `b4aaf75` — April 15, 2026
- "Add Stroke/TIA flowchart with FAST and VAN blocks, update YES/NO label positioning across all protocols"
- 4 files: StrokeTIAFlowchart.tsx (new), app/protocol/[id].tsx, app/(tabs)/protocols.tsx, SeizureFlowchart.tsx
