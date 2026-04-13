# EMS Protocol App — Claude Session State
Last updated: April 12, 2026

## Stack
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- Supabase + Claude API for Scenario AI (not yet needed)
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Dev server: npx expo start (port auto-assigned)
- Testing: Expo Go on Android

## Current Architecture: SeizureFlowchart.tsx
- SVG layer renders shapes, arrows, lines only — NO text in SVG for boxes
- RN View/Text overlay layer renders ALL box text (foreignObject unsupported on Android)
- StepBoxLabel: left-aligned text, vertically centered, paddingLeft 16
- BoxLabel: center-aligned text, vertically centered
- Badge rendering ONLY from StepBoxLabel overlay — never from SVG StepBox shape
- All StepBox SVG shapes have NO hasBadge prop

## Key Layout Constants (SeizureFlowchart.tsx)
- W = 540, H = 3800
- BW = 390, BX = 75, BR = 465
- DW = 240, DCX = BX + DW/2 = 195
- CBW = 110, CBX = BR - CBW = 355
- STEP_H = 130, STEP6_H = 200
- BENZO_COL_H = 220

## Viewer: app/protocol/[id].tsx
- FLOWCHART_W = 540, FLOWCHART_H = 3800
- INITIAL_SCALE = SCREEN_W / FLOWCHART_W
- Transform order: scale first, then translate
- translateX = 0, translateY = 0 at initial load
- Pinch/pan gestures via react-native-gesture-handler

## SeizureFlowchart Status: NEARLY COMPLETE
Remaining fixes needed:
1. Step 5 PARAMEDIC badge still showing double border — SVG rect 
   near Y_STEP5 with x={BX + BW - 112} still exists, needs deletion
2. Step 6 PARAMEDIC badge same issue
3. Arrow pointing into "→ Hypoglycemia protocol" text in callout box 
   — remove the → from the BoxLabel text, it's redundant with the arrow
4. Verify pregnancy note and disclaimer render at bottom

## Completed Work
- Full 7-step seizure flowchart built and rendering
- SVG text → RN overlay rewrite (Android foreignObject fix)
- Diamond geometry: DCX left-shifted, callouts flush with BR
- YES/NO labels on arrows working
- All callout boxes inside canvas bounds
- Badge double-border fixed on Steps 1, 2, 3, 7
- Benzo column font increased to 13px
- Screen-filling scale on load

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
