# EMS Protocol App — Claude Session State
Last updated: April 20, 2026 (v2 — strategic refresh)

---

## How to Use This Document

Paste this doc at the start of every new Claude Chat session along with the source files you're working on. It gives Claude (a) the operational context to do code work without rebuilding it, and (b) the strategic context to make recommendations aligned with the locked-in plan.

For the full end-to-end execution plan, see **`EMS_Protocol_App_Build_Plan_v2.docx`** (kept in the project files alongside this doc).

---

## Strategic Foundation (NEW — v2 lock-in)

These decisions are settled. Don't relitigate them in new chats unless the underlying facts change.

**Product category.** Clinical reference tool for individual EMS providers. Same category as printed pocket guides, Limmer Education, Paramedic Tutor, Tarascon Pocket Pharmacopoeia. NOT enterprise medical software, NOT a diagnostic device, NOT requiring per-agency procurement or signed permissions.

**Business model.** B2C, paramedic-direct subscriptions. Free tier + paid tier (~$5–10/month). Departments are an upsell layer in Phase 8, not the foundation. Target market: 270K+ paramedics, 1M+ EMTs nationally.

**Content tier model.**
- **Tier 1 — Visual Decision Trees.** Hand-built React flowcharts (SeizureFlowchart-style). Premium experience. Slow to build. Currently Central Arizona only.
- **Tier 2 — State Protocol Reference.** Searchable text version of state-published protocols. Faster to add per state. Sourced from public state EMS websites with proper attribution.
- **Tier 3 — National EMS Reference.** NASEMSO National Model EMS Clinical Guidelines + universal pharmacology (drug calculator, drug reference). Available to every user regardless of region.

**National scope from launch.** Region selector on first launch routes user to the appropriate tier mix. Out-of-region users get Tier 3 + universal tools (still useful and safe). In-region users get Tier 1 + Tier 2 + Tier 3.

**Legal protection model.** Disclaimers + attribution + version dates + source links. The same model every reputable EMS reference publisher uses. NOT signed permissions from agencies (agencies don't and won't issue these — the standard EMS posture is "use any tool, you're held to your protocols").

**Content acquisition.** State protocols are public reference documents. Process them, attribute them properly, version-date them, link to the original source. Same as any EMS textbook publisher does. NASEMSO Guidelines verify license terms once and document.

---

## Tools & Workflow

**Currently in use:**
- **Claude Chat (claude.ai)** — protocol content research, flowchart component generation, strategic conversations
- **File Explorer (drag & drop)** — move generated files from Downloads into local project directory
- **Command Prompt** — Expo dev server and npm commands only (PowerShell blocks npx)
- **GitHub** — version control, source of truth
- **Expo Go (Android, Samsung Note 10+)** — live device testing

**Transitioning to (Phase 0 of build plan):**
- **Cursor (cursor.com, $20/mo)** — replaces Claude Chat → drag-and-drop loop. AI sees full codebase automatically, edits files in place, supports multi-file changes in one prompt.
- **Perplexity Pro ($20/mo)** — content discovery for state protocol research in Phase 1.5
- **EAS dev build** — replaces Expo Go on the Note 10+ once region gating and Sentry are added (those need custom native code)

**Planned for production (per build plan phases):**
- **EAS Build / Submit / Update** (Phase 2) — cloud builds + over-the-air JS updates
- **Sentry** (Phase 2) — crash reporting
- **PostHog** (Phase 5) — analytics, free tier
- **Supabase** (Phase 2/6) — currently planned, will scale to paid tier in Phase 6
- **RevenueCat** (Phase 7) — subscription billing when monetization launches

---

## Project Workflow Quirks

- **File handoff (current):** Claude Chat generates component files → Kyle downloads → drags into `C:\Users\KyleW\ems-protocol-app`. No Claude Code, no terminal file ops. *This changes once Cursor is set up in Phase 0.*
- **Commands:** Always Command Prompt, never PowerShell. (PowerShell blocks npx on this machine.)
- **Expo start:** `npm run dev` (mapped to LAN mode with static IP `192.168.68.100`). Working on Surface Pro only for now. Tunnel mode was attempted to support multi-machine workflow (Surface Pro + home PC) but isn't fully working — staying on LAN/single-machine. Don't suggest tunnel unless revisiting multi-machine setup.
- **Device:** Always re-scan QR code fresh each session — never rely on cached Expo Go connection.
- **Git:** Kyle pushes to `main` via Command Prompt when each protocol is complete. Don't write git commands assuming knowledge — spell out every flag.
- **Adding a new protocol requires THREE file edits — always provide all three in the same response:**
  1. Create `components/protocols/[Name]Flowchart.tsx`
  2. Edit `app/protocol/[id].tsx` (import + routing)
  3. Edit `app/(tabs)/protocols.tsx` (PROTOCOLS array + CATEGORIES if new category)
  Skipping #3 means the protocol won't appear in the list.
- **Session continuity:** Start each new chat by pasting (1) this doc, (2) the full source of `SeizureFlowchart.tsx`, (3) the source of the protocol being edited. Do not reconstruct files from descriptions — always paste actual source.

---

## End Goal

Ship to **iOS App Store and Google Play** as the production artifact, **launched nationally** with tiered content from day one. Long-term: defensible national reference tool for paramedics, monetized via individual subscriptions, with department-tier upsell in Phase 8.

This shapes near-term decisions:
- No localStorage shortcuts — all data bundled (Tier 1, drugs, calculator) or in Supabase (region selection, waitlist, future user data)
- All protocol assets bundled for offline use (EMS often works in cell-dead zones)
- Medical disclaimer visible on every protocol screen + first-launch full-screen acknowledgment
- Attribution + version date + source link on every Tier 2 / Tier 3 entry
- No hardcoded secrets (API keys live in EAS Secrets, not in source)
- EAS Build pipeline configured before feature-complete (Phase 2)

**Distribution phases (per Build Plan v2):**
- **Phase 5:** Avondale Fire internal trial (TestFlight iOS / Google Play internal testing)
- **Phase 6:** National public launch with bottom-up adoption + demand-driven Tier 1 expansion
- **Phase 7:** Monetization layer (RevenueCat, free + paid tiers, LLC formed)
- **Phase 8:** Architectural maturity — protocols-as-data, department-tier B2B upsell, framework reusability across other regulated industries

Every architecture decision should pass the "does this hold up in App Store review and in a cell-dead basement on a code" test.

---

## How to Resume Development

1. Open **Command Prompt** (Windows key → type `cmd` → Enter). NOT PowerShell.
2. Launch Expo (Window 1):
   ```
   cd C:\Users\KyleW\ems-protocol-app
   npm run dev
   ```
   Then scan QR code fresh with Expo Go (or dev build, post-Phase 2) — always re-scan, never use cached connection.
3. If you need to run any other npm/expo commands, open a second CMD window.
4. **To add new files generated by Claude Chat (current workflow):**
   - Download the file from Claude Chat
   - Drag and drop into the correct folder in File Explorer (e.g. `components/protocols/`)
   - Expo hot-reloads automatically

> **Workflow transition coming:** Once Cursor is set up (Build Plan Phase 0.4), the drag-and-drop workflow is replaced by in-editor edits. Update this doc when the transition is complete.

## Environment Notes
- Use `npm run dev` (mapped to LAN mode in package.json)
- LAN mode with static IP `192.168.68.100` set in Network Adapter IPv4 settings
- Currently Surface Pro only — multi-machine setup (also using home PC) attempted via tunnel but not fully working; revisit if/when needed
- PowerShell blocks npx — always use Command Prompt (cmd)
- Always re-scan QR code at start of each session — IP can shift mid-session

## Starting a New Chat
Paste in this order at the start of any new Claude Chat session:
1. This session state doc (`CLAUDE_SESSION.md`)
2. The full source of `SeizureFlowchart.tsx` (master template)
3. The source of whichever protocol file you are editing
4. Your build/edit request

Do not ask Claude Chat to reconstruct files from description — always paste the actual source.

---

## Stack (current + planned)

**Currently installed:**
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- react-native-gesture-handler + react-native-reanimated for pinch zoom
- Supabase + Claude API for Scenario AI
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Testing: Expo Go on Android (Samsung Note 10+)

**Planned additions (per Build Plan v2):**
- @sentry/react-native (Phase 2)
- expo-secure-store + AsyncStorage (Phase 2 — for region selection persistence)
- posthog-react-native (Phase 5)
- react-native-purchases (RevenueCat, Phase 7)

---

## App Structure (currently 4 tabs, expanding to first-launch flow + 4 tabs)

**Coming in Phase 2 — first-launch region selector:**
- Three sequential dropdowns: State → County → Agency
- Role selection (EMT-B / EMT-A / AEMT / Paramedic / Critical Care)
- Optional waitlist email if region doesn't have Tier 1 content yet
- Stored in expo-secure-store + synced to Supabase
- Editable from Settings later

### 1. Protocols Tab
- `app/protocol/[id].tsx` — viewer screen for all protocol flowcharts
  - ScrollView (vertical, native scroll) wrapping the flowchart component
  - Pinch-to-zoom via GestureDetector + Animated.View (scale only, no pan)
  - FLOWCHART_W = 470 (matches canvas W in flowchart components)
  - No fixed FLOWCHART_H — wraps to content height naturally
  - Zoom in/out/reset buttons in header
  - Hint bar: "Scroll to navigate · Pinch to zoom"
- **Phase 2 addition:** conditional rendering based on user's region tier
  - Tier 1 region: show all visual flowcharts
  - Tier 2 region: show state protocol text reference
  - Tier 3 only: show NASEMSO National Guidelines + waitlist banner

### 2. Drug Reference Tab
- Functional — search + category filter + scope badges
- Currently using Bolt-generated dataset (~24 drugs)
- TODO (Phase 1.5): replace with full Red Book dataset + universal pharmacology baseline
- Available to ALL users regardless of region (universal pharmacology)

### 3. Drug Calculation Tab
- Functional — weight-based dose calculator
- kg/lbs toggle, pediatric detection (age < 15)
- TODO (Phase 1.6): verify all doses match Red Book exactly
- Available to ALL users regardless of region

### 4. Scenario AI Tab
- Was functional (Claude API grounded on Red Book)
- Phase 1.8: verify API key + run test scenarios
- Phase 2.4: add privacy guardrails (disclaimer modal, no input logging)
- Region-aware: prompt grounding includes user's regional protocol context

---

## Protocol Flowcharts — Status

| Protocol | Status | File |
|---|---|---|
| Seizures | ✅ Complete | `SeizureFlowchart.tsx` |
| Chest Pain / ACS / STEMI | ✅ Complete | `ChestPainFlowchart.tsx` |
| Stroke / TIA | ✅ Complete | `StrokeTIAFlowchart.tsx` |
| RSI (Rapid Sequence Intubation) | ✅ Complete | `RSIFlowchart.tsx` |
| Airway Management | ✅ Complete | `AirwayManagementFlowchart.tsx` |
| Cardiac Arrest — Shockable (VF/VT) | ✅ Complete (v2 standards + Step 10 / ROSC refactor Apr 19) | `CardiacArrestShockableFlowchart.tsx` |
| Non-Traumatic TOR | 🔲 Next (Phase 1.1) — needed for both cardiac arrest protocols to jump out to | `NonTraumaticTORFlowchart.tsx` |
| Cardiac Arrest — Non-Shockable (Asystole/PEA) | 🔲 After TOR (Phase 1.2) | `CardiacArrestNonShockableFlowchart.tsx` |
| Pain Management | 🔲 Phase 1.3 | `PainManagementFlowchart.tsx` |

> **Note:** The v2 Visual Standards (scope badges, label tones, YES/NO convention, orange drug-box treatment, destSub color token) were established on `CardiacArrestShockableFlowchart.tsx` during the April 18 refactor. The older protocols (Seizure, Chest Pain, Stroke/TIA, RSI, Airway) already implemented most of these patterns but may not have all of them exactly — when editing an older protocol, bring it up to the v2 Visual Standards section below (Phase 1.4 in build plan).

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
CBW = 140, CBX = 315        // standard callout
CBW_D1 = 170, CBX_D1 = 285  // wide callout (ROSC care, Passive O₂)
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
<Arrow x1={DXR} y1={d1mid} x2={CBX} y2={d1mid} />
```

### Diamond + Callout RN Layout
Diamond measured inline, callout is a 4px stub (not measured for positioning):
```tsx
<View onLayout={measure('dec1')} style={{ height: 72, marginHorizontal: BX }} />
<View onLayout={measure('callout1')} style={{ height: 4 }} />
<View style={{ height: GAP }} />
```
Callout keys are NOT in REQUIRED_KEYS.

### Diamond Text Centering (CRITICAL — Apr 18, 2026)
Two-line diamond text must be visually centered on the diamond midpoint.
Main line baseline at `dCY - 3`, sub line baseline at `dCY + 12`:
```tsx
<SvgText x={dCX} y={subText ? dCY - 3 : dCY + 4} fontSize={textSize}
  fill={C.decText} textAnchor="middle" fontWeight="700">{text}</SvgText>
{subText && (
  <SvgText x={dCX} y={dCY + 12} fontSize={subTextSize}
    fill={C.emtTitle} textAnchor="middle" fontWeight="600">{subText}</SvgText>
)}
```
Diamond `subText` uses `emtTitle` (near-white) at 11pt default — the old muted sub was too dim to read on the blue diamond.

**NEW — Apr 19, 2026:** Diamond component now accepts optional `textSize` and `subTextSize` props (default 11) for diamonds where the main question needs emphasis. Example: Shockable Diamond 3 uses `textSize={14}` (bigger ROSC?) with `subTextSize={10}` (smaller "(After 4 rounds)" qualifier).

### Callout Box — Standard vs Wide
Two helpers coexist:

**`calloutBox(midY, lines, bg, border, tc)`** — standard, single-color, `CBW=140` wide. All lines render at 9.5pt weight 600 in the same color. Legacy helper retained for cross-protocol compatibility.

**`wideCalloutBox(midY, lines, bg, border)`** — NEW Apr 19. Per-line styling, `CBW_D1=170` wide. Each line carries its own color + weight. Used for ROSC Care callouts (dec2 & dec3 YES) so "→ ROSC Care Protocol" (green) and "Transport to CRC (or closest if >15 min)" (bold grey) render with different emphasis in the same box.

```tsx
interface CalloutLine { text: string; color: string; weight: '400' | '600' | '700' }
```

**When using wide callouts, arrow endpoints must use `CBX_D1` (285) not `CBX` (315).**

For callouts with mixed typography or section breaks (multi-color, bigger title, warning lines), render inline rather than shoehorn it into the generic helper. Example: the Shockable protocol Passive O₂ callout on Diamond 1.

### Footer (all protocols)
**Updated Apr 19, 2026** — disclaimers now render in RN `<Text>` instead of SVG, so they can sit below RN-rendered clinical reminder blocks.

```tsx
<View style={{ height: 20 }} />
<Text style={styles.footerLine}>
  Central Arizona Regional EMS Guidelines · Chapter 3 · Effective Jan 12, 2026
</Text>
<Text style={styles.footerLine}>
  Reference aid only — does not replace online medical direction or clinical judgment.
</Text>
```

Where:
```tsx
footerLine: { color: C.discText, fontSize: 10, textAlign: 'center', lineHeight: 16 }
```

When using RN footer: tighten `svgH` to `l.lastStep.bot + 20` (was `+ 80` when footer lived in SVG).

### Inline Reference Blocks (Stroke/TIA)
- FAST: `FAST_TOTAL=146`
- VAN: `VAN_TOTAL=162`
- RN: `<View onLayout={measure('key')} style={{ height: TOTAL }} />`
- Use `<Line>` (no arrowhead) into blocks, `<Arrow>` out

---

## v2 Visual Standards (April 18, 2026)
**All protocols must follow these. Older protocols should be updated as they
are touched.**

### 1. Colour Tokens
```
bg:          '#0d1117'
emtBg:       '#21262d'   emtBorder:  '#484f58'   emtTitle:  '#e6edf3'   emtSub:   '#8b949e'
paraBg:      '#1b3a2d'   paraBorder: '#0F6E56'   paraTitle: '#56d364'   paraSub:  '#8fcca0'
critBg:      '#2a1a0a'   critBorder: '#f0883e'   critTitle: '#f0883e'   critSub:  '#d29922'
decBg:       '#1f3a5f'   decBorder:  '#185FA5'   decText:   '#79c0ff'
destBg:      '#3a1010'   destBorder: '#d62828'   destText:  '#f85149'   destSub:  '#e89b9b'
pedsBg:      '#0a1a2a'   pedsBorder: '#1f6feb'   pedsDrug:  '#58a6ff'   pedsDose: '#a5d6ff'
warnBg:      '#1a1400'   warnBorder: '#9e6a03'   warnText:  '#d29922'
secBg:       '#161b22'   secText:    '#6e7681'
arrow:       '#6e7681'   label:      '#8b949e'   discText:  '#6e7681'
```
**`destSub: '#e89b9b'`** (muted red for step labels on red boxes).

### 2. Scope Badges (top-right of every step box)
Every step box has an `EMT` or `PARAMEDIC` badge in the top-right corner. The badge color matches the box's colour theme, not the scope default.

```tsx
<ScopeBadge scope="PARAMEDIC" tone="orange" />
```
`tone` values:
- `'default'` (omit) → EMT white, PARAMEDIC green (for gray EMT boxes + green paramedic boxes)
- `'orange'` → used on orange drug-administration boxes
- `'red'` → used on red defibrillate / destination boxes

### 3. Step Label Colour Rule (CRITICAL)
**Step label uses the MUTED variant of the box's colour family; title uses the bright variant.** This creates visual hierarchy.

| Box type | Title color | Step label color |
|---|---|---|
| EMT (gray) | `emtTitle` white | `emtSub` gray |
| Paramedic (green) | `paraTitle` bright green | `paraSub` muted green |
| Drug / orange | `critTitle` orange | `critSub` muted yellow-orange |
| Defibrillate / red | `destText` bright red | `destSub` muted red |
| Destination (green title, red bg) | `paraTitle` green | `paraSub` muted green |

### 4. Drug-Administration Boxes → ORANGE
Any box that administers a drug uses the **orange** treatment (critBg / critBorder / critTitle / critSub).

**Exception — Defibrillate is RED**, not orange. Electrical therapy is destination/alert-coded, not pharmacologic.

### 5. Inline Sub-Boxes Inside Larger Boxes
When a box has sub-sections (Torsades, Reversible Causes, TOR jump-out) they use a wrapper with gray or colored bg + internal highlights. See Shockable Step 8 (Torsades / Reversible Causes) and Step 10 (TOR jump-out, red palette).

### 6. Title/Subtext Hierarchy for Busy Boxes
White title + grey subtext to separate box identity from drug action headers. Example: Shockable Step 8.

### 7. YES/NO Label Convention (CRITICAL)
- **Horizontal arrows** → label **above** the line, centered along length
- **Vertical arrows** → label **slightly right** of the line, `textAnchor="start"`
- Never use the `Arrow` component's `label=` prop for vertical arrows

### 8. Section Bars
20px height, `BX` horizontal margin, no arrow/gap between bar and adjacent step.

### 9. Transport / Disposition Boxes (Apr 19, 2026 — clarified)
**Final Transport/Disposition boxes use the grey EMT palette**, not red destination. The red destination palette is reserved for defibrillation / true alert endpoints. Using grey for Transport Decision lets color-coded key terms (green ROSC, red refractory VF/VT, white CRC bypass) pop against the neutral background.

Reference: Seizure STEP 7 Transport, Shockable STEP 10 Transport Decision.

### 10. Back-References (NEW — Apr 19, 2026)
When a step re-uses actions defined earlier in the flowchart, add a muted italic back-reference at the end of the bullet: `→ Step N`. Example: Shockable Step 9 cycle bullets reference back to Step 1 (compressions), Step 6 (defib), Step 7 (Epi).

Style:
```tsx
backRef: { fontSize: 10, fontStyle: 'italic', color: '#6e7681', fontWeight: '400' }
```

### 11. Cycle Indicator Icon (NEW — Apr 19, 2026)
When a step describes a repeating cycle, append `🔄` emoji at 16pt next to the endpoint title. Use `endpointRow` flex container to hold the text + icon side-by-side. Example: Shockable Step 9 "4 Rounds OR until ROSC 🔄".

### 12. Acronym Glossary Footer (NEW — Apr 19, 2026)
Protocols with heavy acronym use (ROSC, CRC, TOR, OLMD) include a centered acronym list at the bottom, above the standard disclaimer footer. Format: `**ACRONYM** — Full Name` with bold white key + muted body.

### 13. TOR Reminder Footer (NEW — Apr 19, 2026)
Cardiac arrest protocols include a centered amber warning block above the disclaimer footer:
- "⚠ TOR Exclusions — Do not terminate without OLMD"
- Exclusion list: "Hypothermia · Lightning strike · Submersion / drowning · Age < 18"
- Bold red final line: "All TOR requires on-line medical direction."

Uses `warnBg`/`warnBorder`/`warnText` palette. All three lines center-aligned.

---

## Protocol Details

### Seizures (`SeizureFlowchart.tsx`)
Master template. Adult & Pediatric. BGL decision, pregnancy decision, benzodiazepine ladder.

### Chest Pain / ACS / STEMI (`ChestPainFlowchart.tsx`)
Adult only. Aspirin, 12-lead ECG, NTG ladder, Fentanyl, STEMI alert/destination.

### Stroke / TIA (`StrokeTIAFlowchart.tsx`)
Adult & Pediatric. FAST + VAN reference blocks. Destination decisions.

### RSI (`RSIFlowchart.tsx`)
Age ≥ 15, STR protocol. One-time Etomidate/Succinylcholine, post-intubation sedation.

### Airway Management (`AirwayManagementFlowchart.tsx`)
Adult & Pediatric, 10 steps. Peds airway threshold < 8 (not 15).

### Cardiac Arrest — Shockable (`CardiacArrestShockableFlowchart.tsx`)

**Step numbering:**
| Display | Internal key | Content | Scope | Box color |
|---|---|---|---|---|
| STEP 1 | step1 | Compressions | EMT | gray |
| STEP 2 | step2 | AED | EMT | gray |
| STEP 3 | step3 | Airway / Oxygenation | EMT | gray |
| Diamond 1 | dec1 | Witnessed cardiac arrest, ≥8 yrs? | — | blue |
| STEP 4 | step6 | Manual Ventilation + orange "Consider cause" note | EMT | gray |
| STEP 5 | step7 | IV/IO Access + Monitor | PARAMEDIC | green |
| STEP 6 | step8 | Defibrillate | PARAMEDIC | red |
| STEP 7 | step9 | Epinephrine | PARAMEDIC | orange |
| STEP 8 | step10 | Refractory VF / Pulseless VT | PARAMEDIC | orange |
| Diamond 2 | dec2 | ROSC? | — | blue |
| STEP 9 | step11 | Continue Resuscitation (4 Rounds OR until ROSC 🔄) | PARAMEDIC | green |
| Diamond 3 | dec3 | ROSC? (After 4 rounds) | — | blue |
| STEP 10 | step12 | Transport Decision (grey, with TOR jump-out sub-box) | PARAMEDIC | gray |

**Diamond 3 YES/NO routing (Apr 19 refactor):**
- YES → right-side callout: ROSC Care Protocol / (Post-Arrest) / Transport to CRC
- NO → down to Step 10 Transport Decision

**Both Diamond 2 and Diamond 3 YES callouts use the wide callout pattern (`wideCalloutBox` helper)** — 4 lines, per-line styling: "→ ROSC Care Protocol" (green bold), "(Post-Arrest)" (green), "Transport to CRC" (bold white), "(or closest if >15 min)" (bold white).

**Step 10 content (Apr 19):**
- Grey palette (not red destination)
- Title: "Transport Decision"
- TOR jump-out sub-box FIRST (red palette): "No ROSC after 4 rounds, non-shockable rhythm? → See Non-Traumatic TOR protocol"
- Refractory VF/VT bullet (red key term): load & transport, continue up to 60 min from dispatch
- CRC bypass bullet (white key term): closest facility if CPR ongoing without ROSC OR >15 min
- ROSC achieved bullet (green key term): Transport to CRC, refer to Post-Cardiac Arrest / ROSC Care

**Below Step 10 (all RN-rendered):**
1. TOR Exclusions reminder box (warn/amber palette, centered text)
2. Acronym glossary (ROSC / CRC / TOR / OLMD)
3. Standard disclaimer footer lines

**Other details:**
- Exclusions: Newborns, DNR, Traumatic cardiac arrest
- Diamond 1: YES → Passive O₂ callout; NO → Step 4 BVM directly
- Passive O₂ callout uses wider dimensions: `CBW_D1=170`, `CBX_D1=285`
- STEP 4 BVM box includes orange `causeNote` at bottom
- Epinephrine: Adult 1 mg IV/IO q3-5 min (max 3); Peds 0.01 mg/kg IV/IO (max 1 mg, max 3)
- Shock-refractory: Amiodarone (Adult 300 mg, Peds 5 mg/kg max 300) or Lidocaine (1 mg/kg, max 3 mg/kg)
- Torsades sub-box: Mag Sulfate 50 mg/kg IV/IO max 2 g over 5 min
- Reversible Causes sub-box: H's & T's + Calcium Gluconate/Chloride for hyperkalemia
- Dead code: `CircleArrow` component remains in file (lines ~425) but is unused after cycle icon swap to 🔄 emoji. Safe to leave; may revisit.

---

## Remaining Build Tasks (aligned to Build Plan v2)

**Phase 0 — Workflow & Account Setup (start now)**
1. Apple Developer Program enrollment (Individual, $99/yr)
2. Google Play Developer Console ($25 one-time)
3. Domain registration (~$15/yr)
4. Cursor Pro setup ($20/mo) — replaces drag-and-drop workflow
5. Perplexity Pro setup ($20/mo) — content discovery for Phase 1.5

**Phase 1 — Finish Arizona Visual Decision Trees**
1. Non-Traumatic TOR flowchart (NEW, do first — both cardiac arrest protocols jump to it)
2. Cardiac Arrest Non-Shockable (purple, H's & T's grid, TOR jump-out)
3. Pain Management flowchart
4. Bring older protocols (Seizure, Chest Pain, Stroke/TIA, RSI, Airway) up to v2 Visual Standards
5. Replace Drug Reference with full Red Book dataset
6. Verify Drug Calculation doses against Red Book
7. Fix Android nav bar covering bottom tabs
8. Verify Scenario AI is functional

**Phase 1.5 — Content Sourcing & Processing (NEW phase from v2 plan)**
1. Process NASEMSO National Guidelines into Tier 3 reference (verify license terms)
2. Build the source-tracking spreadsheet (state, agency, doc URL, version, effective date)
3. Process the 10 state protocols Kyle already has into Tier 2
4. Use EMSprotocols.org + Perplexity to inventory 50+ source documents (don't process all — just inventory)
5. Document content currency policy (monthly source-check, 30-day update window)

**Phase 2 — Production Infrastructure**
1. Set up EAS (eas-cli, configure profiles)
2. Create Android development build (replaces Expo Go in workflow)
3. Add Sentry crash reporting
4. Add Scenario AI privacy guardrails (disclaimer modal, no input logging)
5. Lock down offline behavior (test in airplane mode)
6. Set up iOS testing (used iPhone, dev build)
7. **NEW: Region selector + tiered content rendering**
   - First-launch region selector flow (state/county/agency/role)
   - Supabase tables: regions, users, waitlist_signups
   - Conditional rendering based on user's region tier
   - Demand-signal dashboard (internal Supabase view)

**Phase 3 — Pre-Submission Polish**
1. Comprehensive disclaimer system (first-launch + persistent footers + version dates + source links)
2. App icon + splash screen
3. Store listing assets (screenshots, descriptions, positioned for national reach)
4. Privacy policy + terms of service
5. Internal testing tracks (TestFlight, Play Console)

**Phase 4 — Submit to Stores**
1. Production iOS build via EAS
2. Submit to App Store
3. Survive Apple review (expect rejection round 1)
4. Production Android build + submit to Google Play

**Phase 5 — Avondale Internal Trial**
1. Add PostHog analytics (event tracking, no PHI in payloads)
2. Distribute to crew via TestFlight + Play Console internal track
3. Set up feedback-to-fix loop (GitHub Project board, EAS Update for JS-only fixes)
4. Iterate based on field use
5. Brief medical director (verbal acknowledgment, not formal endorsement)

**Phase 6 — Public Launch & Growth**
1. Promote to public production on both stores
2. Watch demand-signal dashboard for state-level signups
3. Demand-driven Tier 1 expansion (250+ waitlist signups triggers buildout consideration)
4. Light-touch marketing (one-page Vercel site, LinkedIn, EMS subreddit, JEMS article)
5. Trigger Phase 7 prep when MAU > 1,000

**Phase 7 — Monetization & Scale**
1. Form Arizona LLC + EIN + business bank account
2. Get D-U-N-S Number, convert Apple Developer to Organization
3. Define free tier vs paid tier (suggested split in build plan)
4. Add RevenueCat ($7.99/mo or $59.99/yr, 14-day trial)
5. Build sustainable content currency operations
6. Track conversion + churn, optimize pricing

**Phase 8 — Architectural Maturity & SaaS (Year 2)**
1. Refactor protocols from hardcoded React components to data-driven JSON + generic renderer
2. Department-tier upsell (admin web tool, branded versions, training analytics)
3. Multi-tenant data architecture (RLS, custom protocol overrides per org)
4. Framework reusability evaluation (other regulated industries: aviation, maritime, OSHA, nursing)

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
- Stroke onset > 4hrs → VAN screen → Comprehensive/Thrombectomy capable
- Cardiac arrest: passive O₂ first for witnessed ≥8 yrs; active BVM immediately for unwitnessed / respiratory / OD / trauma / drowning / peds <8
- **Refractory VF/VT**: NOT TOR-eligible. Continue resuscitation up to 60 min from dispatch, load and transport.
- **Non-Traumatic TOR** requires OLMD. Two pathways exist (pathway 1: unwitnessed/no shock/no ROSC; pathway 2 adds witnessed arrests with 20min resus + EtCO₂<20 + non-shockable).
- TOR exclusions (all require OLMD): hypothermia, lightning strike, submersion/drowning, age <18.

---

## Operating Principles (locked-in from v2 strategic conversations)

These are the rules of engagement Claude should apply in any new chat about this project:

1. **Reference tool model.** Treat this as a reference publisher's product, not enterprise medical software. Don't over-engineer for procurement, partnerships, or regulatory compliance that doesn't apply.

2. **Disclaimers + attribution + version dates** are the legal protection. Apply consistently. Don't recommend pursuing per-agency permission for state protocols.

3. **B2C, paramedic-direct.** Recommendations should serve individual paramedic users. Departments are an upsell layer, not the foundation.

4. **National scope from launch.** Don't propose Arizona-only or regional-only architecture. Region selector + tiered content is the answer to "how do we handle out-of-region users."

5. **Build for proven demand, not hope.** Don't propose Phase 8 architectural refactors before Phases 1–7 ship and revenue exists.

6. **Stack discipline.** Don't recommend stacking AI subscriptions. Cursor + optionally Claude.ai for strategy + Perplexity for content research is the toolkit.

7. **Cursor is the code workflow once Phase 0 completes.** Don't recommend Claude Code for file operations.

---

## Reference Documents

- **`EMS_Protocol_App_Build_Plan_v2.docx`** — full execution plan, all 9 phases, costs, timelines (printable)
- **This doc (`CLAUDE_SESSION.md`)** — operational + strategic context for Claude in new sessions
- **`SeizureFlowchart.tsx`** — master template for all flowchart styling (always paste at session start)
- **`CONTENT_POLICY.md`** — content currency policy (created in Phase 1.5.5)
- **`LICENSE_NOTES.md`** — record of NASEMSO and state protocol license terms (created in Phase 1.5.1)

---

## Last Session
- **April 20, 2026** — Strategic refresh / v2 lock-in.
  - Locked product positioning: reference tool category, B2C subscriptions, national from launch, three content tiers (NASEMSO + State protocols + Visual flowcharts), disclaimers/attribution/version-dates as legal protection model.
  - Reframed away from per-agency partnerships (verbal medical director acknowledgment is sufficient; written endorsement isn't how this category works).
  - Generated `EMS_Protocol_App_Build_Plan_v2.docx` — 9 phases (0–8), 772 paragraphs, printable. Replaces v1.
  - Added Phase 1.5 (Content Sourcing & Processing) and Phase 2.7 (Region Selector + Tiered Rendering) as new infrastructure work.
  - Plan now includes LLC formation, RevenueCat subscription billing, and architectural reusability for other regulated-industry verticals (Phase 8).
- **April 19, 2026** — Cardiac Arrest Shockable bottom-half overhaul.
  - Step 9 Continue Resuscitation: added 🔄 cycle icon, italic subtitle "Compressions / rhythm / shock / Epi (max 3)", muted italic back-references `→ Step 1`, `→ Step 6`, `→ Step 7` on each action bullet. Color-coded key terms (red defib, orange Epi).
  - Diamond 3 refactor: text now "ROSC?" (14pt) with subtitle "(After 4 rounds)" (10pt). YES/NO routing flipped: YES → ROSC Care callout (right), NO → Step 10 (down).
  - Both ROSC Care callouts (dec2 & dec3) rebuilt using new `wideCalloutBox` helper: 4 lines with per-line styling, wider `CBW_D1=170` box. Added "Transport to CRC / (or closest if >15 min)" bold-grey lines below green title.
  - Step 10 rewritten: renamed "Transport Decision" (was "Transport / TOR Decision"). Switched from red destination palette to grey EMT palette. TOR jump-out sub-box moved to top, directly under title (red palette, references separate Non-Traumatic TOR protocol). Three colored bullets below: Refractory VF/VT (red), CRC bypass (white), ROSC achieved (green).
  - New RN content below Step 10: (1) TOR Exclusions reminder box with warn/amber palette, centered text, bold red final line; (2) Acronym glossary — ROSC, CRC, TOR, OLMD.
  - Footer disclaimers moved from SVG to RN so they render below the new reminder + acronym blocks. `svgH` tightened from `l.step12.bot + 80` to `l.step12.bot + 20`.
  - Diamond component extended with optional `textSize` / `subTextSize` props (default 11).
  - Orphaned `CircleArrow` component left in file as dead code — swapped out in favor of 🔄 emoji.
- **April 18, 2026** — v2 Visual Standards refactor; Step 9 "4 Rounds" yellow subtitle and Diamond 3 original implementation.
