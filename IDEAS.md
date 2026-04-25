# EMS Protocol App — Ideas Backlog

> Single source of truth for features, improvements, and random ideas. Committed to repo so Claude Chat and Cursor both see it alongside the code.

---

## 🔥 Next Up (active work)

- [ ] Finish visual tweaks on `CardiacArrestShockableFlowchart.tsx`
- [ ] Build Cardiac Arrest Non-Shockable protocol (purple theme, H's & T's grid)
- [ ] Continue through high-priority protocol list (Pain Management, Pediatric Cardiac Arrest, etc.)

---

## 📋 Backlog — Fleshed-Out Feature Ideas

### Recertification Reminder
**What:** User inputs their cert cards; app reminds them before expiration.
**Details:**
- Supported certs: NREMT, State EMT/Paramedic, ACLS, PALS, PHTLS/ITLS, CPR/BLS, AMLS, EPC, and agency-specific (e.g., Avondale-required).
- Stored per cert: issuing body, cert number, issue date, expiration date, optional photo of card.
- Reminder cadence: 90 / 60 / 30 / 7 days before expiration + day-of.
- Nice-to-have: link to renewal portal for each cert type.
**Dependencies:** Supabase user profile OR local storage (AsyncStorage); Expo Notifications for push; date math.
**Effort:** M (2–3 sessions)
**Good time to build:** After core protocols are done, before AI Scenario layer. Also makes a strong selling point for valley-wide pitch — every medic I know tracks this on paper or in their wallet.

### Offline Mode
**What:** App works fully without signal — critical for calls in dead zones (rural AZ, basements, parking garages).
**Details:**
- Protocol flowcharts already render locally (React components), so those are fine offline.
- Drug Reference needs to ship with data bundled, not fetched.
- AI Scenario layer is the hard part — needs a fallback ("no connection; here are your matched protocols from keyword search").
- Consider: cache last N Scenario AI responses locally.
**Dependencies:** Audit what currently calls Supabase; decide what's bundled vs. synced.
**Effort:** M–L
**Good time to build:** Before any valley-wide pitch. Non-negotiable for field use.

### Dark Mode Confirmation / Theming
**What:** Verify dark mode is solid across every screen; add a manual toggle.
**Details:**
- Default to system setting, but allow override.
- Night-call use: bright white screens are a real hazard, blow out night vision.
- Audit every protocol's color tokens (critBg, destBg, etc.) against a true dark background.
**Dependencies:** None major — cleanup work.
**Effort:** S
**Good time to build:** After Cardiac Arrest protocols done. Do a sweep before moving to Pain Mgmt.

### Scenario AI — Voice Input
**What:** Speak the patient presentation instead of typing.
**Details:**
- On scene, typing with gloves on is miserable.
- Expo has speech-to-text; or send audio to Whisper via API.
- Transcript shows so medic can verify before submitting.
**Dependencies:** Scenario AI text version working first.
**Effort:** M
**Good time to build:** Phase 2 of Scenario AI (after text input is solid).

---

## 💡 Raw Ideas (not yet fleshed out — capture fast, flesh out later)

- Shift schedule integration (import from Telestaff / Crewsense / whatever Avondale uses)
- Favorite / pin protocols for fast access
- Search across all protocols (text search in addition to visual browser)
- Pediatric weight-based dose calculator that autopopulates into the drug card
- Handtevy-style color-coded pediatric mode
- "Recent protocols" list — last 5 viewed, one tap away
- Patient handoff / SBAR generator from the scenario input
- Agency-specific addendums layer (Avondale-only tweaks on top of regional Red Book)
- Integration with cardiac monitor data (LifePak / Zoll) — far future
- Training mode: scenario drills with feedback
- Protocol changelog / diff view when new Red Book drops (huge for every-two-years Red Book updates)
- QR code on fire engines pointing to the app for new hires
- Anonymous call review — log the call, app suggests what protocols applied, good for CE

---

## ✅ Shipped

- Seizure protocol (master template — v2 architecture reference)
- Chest Pain / ACS / STEMI
- Stroke / TIA
- RSI
- Airway Management
- (Cardiac Arrest Shockable — in final polish)

---

## 📝 How to use this file

**Fast capture (phone, mid-shift):** Open in GitHub mobile → edit → drop under "Raw Ideas" → commit. 20 seconds.

**In a Claude Chat:** Say "add this to IDEAS.md: [idea]" — Claude generates the updated file, you drop it in.

**In Cursor:** Tell the agent to update the file directly.

**Weekly review:** Flesh out Raw Ideas into real entries. Move shipped features to the Shipped section. Re-rank Next Up.
