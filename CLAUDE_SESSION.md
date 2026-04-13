# EMS Protocol App — Claude Session State
Last updated: April 12, 2026 (end of day)

## Stack
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- Supabase + Claude API for Scenario AI (not yet needed)
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Dev server: npx expo start (port auto-assigned)
- Testing: Expo Go on Android

## Current Architecture: SeizureFlowchart.tsx
- SVG layer renders shapes, arrows, diamonds, lines ONLY — no box rects or text
- RN View/Text overlay renders ALL step box borders, backgrounds, and text
- StepBoxLabel: owns its own border + background (borderWidth 1.5, borderRadius 10)
  - fill/stroke props set backgroundColor and borderColor
  - Self-sizing (no fixed h prop) — paddingVertical 10, paddingLeft 16
  - titleFontSize prop (default 16), subtitleFontSize prop (default 14)
  - Badge rendered only in RN overlay, never in SVG
- BoxLabel: center-aligned text, vertically centered, fixed height
- All SVG StepBox shape calls removed — StepBoxLabel is the single source of truth

## Key Layout Constants (SeizureFlowchart.tsx)
- W = 540
- BW = 390, BX = 75, BR = 465
- DW = 240, DCX = BX + DW/2 = 195
- CBW = 110, CBX = BR - CBW = 355
- STEP_H = 90 (used for SVG arrow spacing; step boxes self-size via RN)
- STEP6_H = 125 (still used for arrow y1 from Step 6 bottom)
- BENZO_COL_H = 220
- All arrow gaps between steps and diamonds: 24px (standardized)

## Viewer: app/protocol/[id].tsx
- FLOWCHART_W = 540, FLOWCHART_H = 3800
- INITIAL_SCALE = SCREEN_W / FLOWCHART_W
- Transform order: scale first, then translate
- translateX = 0, translateY = 0 at initial load
- Pinch/pan gestures via react-native-gesture-handler

## SeizureFlowchart Step Text (current)
- Step 1: "Initiate Universal Care" / subtitleFontSize 10
- Step 2: "Check Blood Glucose" / subtitleFontSize 10
- Step 3: "IV/IO Access\n+ Cardiac & EtCO₂ Monitoring" / subtitleFontSize 12
- Step 5: "Repeat Benzodiazepine\n1 repeat dose max" / titleFontSize 17, subtitleFontSize 11
- Step 6: "Postictal Care" / subtitleFontSize 11 (3-line \n subtitle)
- Step 7: "Transport" / subtitleFontSize 11

## SeizureFlowchart Status: NEARLY COMPLETE
Remaining work:
- On-device test to verify no text wrapping and arrow alignment looks correct
- STEP_H and STEP6_H may need minor tuning once self-sizing boxes are tested
  (SVG arrows use these constants; RN boxes size to content independently)
- Verify pregnancy note and disclaimer render cleanly at bottom

## Completed Work
- Full 7-step seizure flowchart built and rendering
- SVG text → RN overlay rewrite (Android foreignObject fix)
- Diamond geometry: DCX left-shifted, callouts flush with BR
- YES/NO labels on arrows
- All callout boxes inside canvas bounds
- Badge double-border fully resolved — SVG StepBox shapes eliminated entirely
- StepBoxLabel converted to self-sizing with RN border/background
- subtitleFontSize and titleFontSize props added to StepBoxLabel
- stepLabel simplified: "STEP 5", "STEP 6" (no · PARAMEDIC suffix)
- Step 5 and 6 subtitle line breaks controlled via \n
- Benzo column font 13px
- Screen-filling scale on load
- All arrow gaps standardized to 24px
- SectionHeader font increased to 13px

## Remaining Tasks (after SeizureFlowchart complete)
1. Fix Android nav bar covering bottom tabs
2. Replace 24-drug dataset with 40-drug Red Book dataset
3. Build Stroke/TIA flowchart (clone SeizureFlowchart as template)
4. Build Cardiac Arrest flowchart
5. EAS Build / App Store submission

## How to Resume in New Chat
Paste this file contents and say: "Continue EMS protocol app development.
Read CLAUDE_SESSION.md and pick up where we left off."
Or fetch from: github.com/kwinter247/ems-protocol-app/blob/main/CLAUDE_SESSION.md
