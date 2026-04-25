# CLAUDE_SESSION.md
**EMS Protocol App — Session Continuity Doc**
Last updated: April 25, 2026

---

## How to use this doc

Paste the full contents of this file at the start of every new Claude chat, along with the full source code of `SeizureFlowchart.tsx` (the v2 master template). This prevents formatting drift caused by Claude reconstructing patterns from description rather than copying from the real file.

---

## Strategic foundation

**Product category:** Reference tool. Same shelf as Tarascon, Limmer, pocket guides — not enterprise medical software.

**Business model:** B2C paramedic-direct, ~$5–10/month. Departments are a Phase 8 upsell, not the foundation. Build for individual paramedics first, agencies later.

**Geographic scope:** National from launch via region selector. Do NOT architect AZ-only assumptions into anything. Region selector + protocol pack swap is the model.

**Three content tiers:**
1. **Tier 1 — Hand-built visual flowcharts.** Demand-driven expansion. Currently Central AZ Red Book 2026.
2. **Tier 2 — State protocol text reference.** Searchable text from each state's protocols.
3. **Tier 3 — NASEMSO + universal pharmacology.** Available to all users regardless of region.

**Legal protection model:** Disclaimers + attribution + version dates + source links. NOT signed agency permissions. We are a reference publisher. Do not chase per-agency approval workflows.

**Toolkit:** Cursor (primary IDE going forward) + optional Claude.ai (this) + Perplexity. No additional AI subscriptions. No tool stacking.

---

## Current build state — Phase 1 progress

### Completed protocols (8)
| Protocol | Status | Notes |
|---|---|---|
| Seizures | ✅ DONE | **Master template — reference for v2 architecture** |
| Chest Pain / ACS / STEMI | ✅ DONE | |
| Stroke / TIA | ✅ DONE | |
| RSI | ✅ DONE | Paramedic-only, special training callout |
| Airway Management | ✅ DONE | |
| Cardiac Arrest — Shockable (VF/VT) | ✅ DONE | Sister to Non-Shockable |
| Cardiac Arrest — Non-Shockable (Asystole/PEA) | ✅ DONE | **NEW — purple H's & T's grid** |
| Non-Traumatic TOR | ✅ DONE | Paramedic-first restructure with new entryBox / two-column checklist / olmdBox patterns |

### Up next per Phase 1 plan
1. **Pain Management** — next protocol to build
2. Bring older protocols (Seizure, Chest Pain, Stroke, Airway, RSI) up to v2 visual standards retroactively if needed (only after Phase 1–7 ships — do NOT pre-refactor)

### Three known bugs (Apr 25, 2026 — screenshots in this session)

**BUG #1 — Bottom nav covered by Android system gesture bar (CRITICAL)**
- Symptom: Samsung Note 10+ system navigation (3-bar/home pill/back arrow) overlaps the bottom tab bar. "Drug Ref / Dose Calc / Scenario AI / Protocols" labels get partially obscured. After a few taps, the system back gesture activates instead of the tab tap.
- Root cause: Missing `bottom` safe-area inset on the tab bar layout. App is rendering edge-to-edge but tab bar is not respecting bottom inset.
- Likely fix location: `app/(tabs)/_layout.tsx` — Tab bar `tabBarStyle` needs to incorporate `useSafeAreaInsets().bottom` as paddingBottom, OR remove `edges={['top']}` from the screens and let the tab bar handle bottom inset itself.
- Severity: Blocks usage. Highest priority bug.

**BUG #2 — Scenario AI returns "Network error. Please check your connection and try again."**
- Symptom: Was working at one point. Now any analyze attempt returns network error banner. Tested with: "35 Yom difficulty breathing, sweaty, left arm numbness. No hx" + age 35 + weight 190. Surface Pro on home WiFi, phone on same network via Expo Go.
- Kyle has made NO changes to the Scenario AI tab or API integration since the one-time setup.
- Likely root causes (in order of probability):
  1. Anthropic API key expired or hit a usage cap on the dashboard
  2. API key never got added to the production build env (was working in dev only)
  3. The fetch URL or model name in the API call is stale (Anthropic deprecates old model identifiers)
  4. Less likely: CORS / network policy issue with LAN mode
- Likely fix location: Whatever component handles the Scenario AI submit (probably `app/(tabs)/scenario.tsx` or `services/claudeApi.ts` or similar). Console log will reveal the actual error — "network error" is generic, the real status code matters.
- First debug step: Add console.log on the catch block to see the real fetch error/status code.

**BUG #3 — Drug Reference category filter pills are vertically clipped**
- Symptom: On Drug Ref tab, the horizontal filter row (All / Cardiac / Airway-RSI / Pain-Sedation / Seiz...) is cut off vertically — only the top half of each pill is visible. Pills are present and tappable but you can't read them until you tap one.
- Root cause: Container above the pills (likely the search bar) is overflowing into the pill row, OR the pill ScrollView height is too short.
- Likely fix location: `app/(tabs)/drugs.tsx` (or wherever the drug list lives) — check the marginTop / paddingTop on the filter ScrollView, and check the height/padding of the search input above it.
- Severity: Cosmetic but degrades UX.

---

## On the horizon (immediate)

1. **Migrate workflow to Cursor** (Cursor account is set up but unused). This is the next major strategic shift — replaces drag-and-drop file workflow.
2. Fix the three bugs above
3. Build Pain Management protocol (next on Phase 1 list)

---

## Active workflow — CURRENT (drag-and-drop, pre-Cursor)

**File generation flow:**
1. Claude Chat (this) generates component files
2. Kyle downloads file from chat
3. Kyle opens in Notepad and verifies a unique string to confirm correct file
4. Kyle drag-and-drops into `C:\Users\KyleW\ems-protocol-app\components\protocols\` (or wherever appropriate)
5. Expo hot-reloads on Samsung Note 10+ via Expo Go

**Commands run in:** Command Prompt (NOT PowerShell)

**App start:** `npm run dev` (mapped to `--lan`) on Surface Pro — single dev machine, static local IP. **Do NOT recommend tunnel mode.** That was tried with two machines and abandoned.

**Devices:**
- Surface Pro — development, LAN mode
- Samsung Note 10+ — testing via Expo Go on Android

**Version control:** GitHub at `github.com/kwinter247/ems-protocol-app`. Local at `C:\Users\KyleW\ems-protocol-app`.

---

## Active workflow — TARGET (post-Cursor migration)

Once Cursor is set up:
- Cursor replaces the download → Notepad-verify → drag-and-drop loop
- Claude Chat (this) can still be used for strategic discussion and large component generation, but Cursor handles file edits in-IDE
- Expo + Command Prompt workflow stays the same
- GitHub workflow stays the same

**Cursor migration is the immediate next step** before further protocol work, IF Kyle wants to do it. The drag-and-drop workflow works but is slow and error-prone (e.g. the `[id].tsx` filename mangling issue from this session).

---

## CRITICAL — Adding a new protocol requires THREE file edits in the same response

1. Create `components/protocols/[Name]Flowchart.tsx`
2. Edit `app/protocol/[id].tsx` — add import + PROTOCOL_META entry + ternary case in JSX
3. Edit `app/(tabs)/protocols.tsx` — add entry to PROTOCOLS array (and CATEGORIES if new category)

**Skipping #3 means the protocol won't appear in the list. Skipping #2 means the route won't render the new component.**

**File-naming gotcha:** When sending `[id].tsx` from Claude's container, the brackets get mangled to `_id_.tsx`. Always rename on output side or warn Kyle to rename before dropping in.

---

## v2 Visual Standards (codified — as of Cardiac Arrest Non-Shockable session)

### Architecture
- Pure RN Views in a flex column for step boxes (no fixed Y constants)
- SVG overlay using `onLayout` measurements for arrows, diamonds, callout boxes
- `ready` flag gates SVG rendering until all measurements collected
- Canvas constants: `W = 470`, `BW = 440`, `GAP = 24`, `STEP_PADDING_V = 10`
- Diamond column constants: `DW = 240`, `DCX = 135`, `DXR = 255`
- Callout constants: `CBW = 140`, `CBX = 315`; wide variant: `CBW_D1 = 170`, `CBX_D1 = 285`

### Arrow routing
- All vertical arrows from a diamond use `DCX` (135), NOT `cx` (235) — diagonal arrows are a common error from wrong x-coords
- Section bar pattern: NO arrow between EMT bar and first step; arrow terminates at PARAMEDIC bar TOP with no arrow exiting bottom; no GAP spacers after bars
- Downward YES/NO arrow labels: manual `SvgText` elements offset 14px right of arrow shaft at midpoint+4 (NOT via Arrow component's label prop — prevents overlap with diamond tips)
- Horizontal YES labels (diamond → callout): SvgText centered above the line at `midpoint - 6`

### Step box visual rules
- Step label uses `subColor` (muted tone); step title uses `bodyColor`
- `ScopeBadge` uses `tone` prop so badge colors match the box's color theme — no green PARAMEDIC badges on orange/red boxes
- Drug-administration boxes: orange (`critBg` / `critBorder`)
- Defibrillate box: red (NOT orange — do not change this)
- Critical transport destination callouts: red (`destBg` / `destBorder` / `destText`)
- Callout box heights computed dynamically from text metrics, NOT hardcoded

### Color tokens (current)
```
EMT:           bg #21262d   border #484f58   title #e6edf3   sub #8b949e
Paramedic:     bg #1b3a2d   border #0F6E56   title #56d364   sub #8fcca0
Critical/Drug: bg #2a1a0a   border #f0883e   title #f0883e   sub #d29922
Decision:      bg #1f3a5f   border #185FA5   text  #79c0ff
Destination:   bg #3a1010   border #d62828   text  #f85149   sub  #e89b9b
Pediatric:     bg #0a1a2a   border #1f6feb   drug  #58a6ff   dose #a5d6ff
Warning/Amber: bg #1a1400   border #9e6a03   text  #d29922
Purple (NEW):  bg #1c1029   border #8957e5   title #d2a8ff   sub  #b083f0
```

### Purple — newest token (added Apr 25, 2026)
- Reserved for "this is the differentiating clinical move" sub-boxes
- Currently used on Cardiac Arrest Non-Shockable's H's & T's grid (the move that distinguishes non-shockable management from shockable)
- Use sparingly — if every protocol has a purple block, the signal becomes noise

---

## Operating principles

1. **SeizureFlowchart.tsx is the master template** — all new protocol flowcharts copy its v2 architecture exactly. Do NOT reconstruct from description.
2. Starting a new chat without pasting the actual source file causes formatting drift.
3. Reference publisher product, not enterprise software. Disclaimers/attribution/version dates as legal model — don't chase per-agency permissions.
4. National scope from launch — no AZ-only architecture decisions.
5. Build for proven demand. Do not refactor Phase 1–7 in anticipation of Phase 8 features.
6. Cursor + Claude.ai + Perplexity is the toolkit. No subscription stacking.
7. Kyle explicitly calls out errors — confirm routing logic and visual decisions BEFORE generating code rather than guessing.
8. Three-file rule for new protocols is non-negotiable.

---

## Communication preferences

- Direct, no hand-holding, no excessive disclaimers
- Concrete instructions: file paths, exact commands, exact strings to find
- Call it out when an idea is bad or over-engineered
- Don't re-suggest tried-and-failed solutions (e.g. tunnel mode)
- Use Command Prompt, not PowerShell
- Kyle generates all code through Claude Chat — does not write code himself
- Tests live on Samsung Note 10+ via Expo Go

---

## Tools & resources

- **Source of truth:** Central Arizona Red Book 2026 (PDF in project knowledge)
- **Defibrillation joule settings:** image-based in Red Book appendix — protocol correctly references "defibrillate per monitor settings"
- **Devices:** Surface Pro (dev, LAN mode), Samsung Note 10+ (Expo Go testing)
- **Version control:** GitHub (`github.com/kwinter247/ems-protocol-app`)
- **Key commands:** `npm run dev` (start, LAN mode) — Command Prompt only
