# EMS Protocol App — Claude Session State
Last updated: April 12, 2026

## Stack
- React Native + Expo SDK 54, Expo Router
- react-native-svg for flowcharts
- Supabase + Claude API for Scenario AI
- Repo: github.com/kwinter247/ems-protocol-app
- Local: C:\Users\KyleW\ems-protocol-app
- Dev server: npx expo start (port auto-assigned)
- Testing: Expo Go on Android

## Current Architecture: SeizureFlowchart.tsx
- SVG layer renders all shapes, arrows, lines
- RN View/Text overlay layer renders all text (foreignObject unsupported on Android)
- StepBoxLabel component: left-aligned text, vertically centered, 100px height
- BoxLabel component: center-aligned text, vertically centered
- Canvas W=540, FLOWCHART_W=SCREEN_W in viewer
- Diamond center DCX = BX + DW/2 (left-shifted, not canvas center)
- Callout boxes: CBX = BR - CBW, flush with main box right edge

## Key Layout Constants (SeizureFlowchart.tsx)
- W = 540 (canvas width)
- BW = 390 (main box width)
- BX = 75 (box left edge)
- BR = 465 (box right edge)  
- DW = 240 (diamond width)
- DCX = BX + DW/2 = 195 (diamond center)
- CBW = 110 (callout box width)
- CBX = BR - CBW = 355 (callout box left edge)
- STEP_H = 100

## Viewer: app/protocol/[id].tsx
- FLOWCHART_W = SCREEN_W (fills screen width)
- FLOWCHART_H = 3800
- Transform order: scale first, then translate
- Initial translateX = 0 (no offset needed at scale=1)
- Pinch/pan gestures via react-native-gesture-handler

## Completed Work
- SeizureFlowchart.tsx fully built with all 7 steps
- SVG text → RN overlay rewrite (Android foreignObject fix)
- Layout shifted: diamonds left-aligned, callouts flush right
- YES/NO labels on horizontal branch arrows
- Screen-filling scale on load

## Remaining Tasks (in priority order)
1. Fix Android nav bar covering bottom tabs
2. Replace 24-drug dataset with 40-drug Red Book dataset
3. Build Stroke/TIA flowchart (use SeizureFlowchart as template)
4. Build Cardiac Arrest flowchart
5. EAS Build / App Store submission

## Active Punch List
1. Chart not filling screen correctly (FLOWCHART_W reverted to 540)
2. NO label should be right of arrow not above it
3. Double badge border on Steps 3, 5, 6 — fix in progress
4. Remove extra arrows above callout boxes
5. Benzo font size increase to 13
6. Step 5 and 6 need more height
7. Callout box vertical drop arrows removed

## Known Issues
- Step 2 subtitle wraps to 2 lines (box slightly narrow for long text)
- Step 3 title wraps to 2 lines at current font size

## Decisions Made
- Left-aligned text in StepBoxes (cleaner than centered)
- Title 17px, subtitle 14px
- Dark theme with color-coded protocol types (EMT=grey, Paramedic=green, Critical=orange)
- Diamonds narrower than boxes to make room for callout boxes
- SeizureFlowchart.tsx is the template for all future protocol flowcharts
