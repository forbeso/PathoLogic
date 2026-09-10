# SickCity career shift — first pass

SickCity now starts with Unit 07 at the hospital garage, followed by an incoming dispatch. Career Shift assigns a level-eligible case; Training Mode exposes the existing quick and full clinical calls. An accepted assignment is locked until it is cleared or restarted from the shift menu.

## Call lifecycle

Starting shift / available → dispatch → en route → on scene → patient contact → clearing → available. After five completed encounters, clearing the fifth opens the shift summary. Starting the next shift resets the shift counters and returns the unit to the garage. Clearing individual calls preserves the player and ambulance position.

`TRANSPORTING` and `AT HOSPITAL` are supported status values, but are not displayed merely because the player chose a transport plan. Actual patient loading and hospital delivery are not implemented in this pass.

Full calls use the shared clinical logic as an in-world control overlay. SickCity keeps the same city canvas, patient location, medic, and ambulance mounted throughout care; the camera frames the patient. No EMT Scene environment is loaded. Clinical actions, scoring, progression awards, and attempt history remain shared with the standalone skills lab. Stepping back closes the care controls without counting a completed call. The care header and post-shift practice button keep players inside SickCity.

## Data and progression

- `sickCityLocations.ts`: reusable existing world locations; both quick and full calls reference these coordinates.
- `sickCityShift.ts`: dispatch-safe reports, level eligibility, difficulty, call type, priority, reward metadata, objectives, skill categories, assignment selection, and score aggregation.
- Clinical diagnoses remain separate from dispatch reports. Dispatch displays only reported information.
- Existing introductory quick calls remain available at level 1. Full medical calls begin at level 2; more complex clinical scenes at level 3. These thresholds fit the currently small catalog and existing 250-XP level curve; future authored cases can choose higher thresholds.
- Existing XP award IDs and server validation are preserved. Quick-call replay does not mint duplicate XP; the UI displays the XP actually awarded. Full care retains the original clinical attempt awards.
- Shift state is session-local. Existing learner XP and clinical attempt history retain their existing persistence behavior. Reloading the page starts a new shift; resumable shifts are future work.

## Scoring

Quick encounters record every chosen action by skill. Each category is correct choices divided by recorded choices, so a reconsidered answer affects that score even when the objective is ultimately completed. Full clinical encounters use the existing engine's seven category scores. Shift scores average only the calls that actually measured a category. Missing categories are omitted, never filled with sample percentages.

The post-call review retains clinical explanations and the original full-scene debrief. Career quick calls defer explanatory feedback to the call review; Training retains immediate teaching feedback. Post-shift practice starts a new Training shift inside SickCity. Clinical review remains inside the care overlay.

## Presentation and audio

Dark neutral HUD, amber actions, red dispatch accent, compact mobile bottom sheet, unit status and shift counters. Dispatch, status, and XP transitions respect reduced motion. `useDispatchRadio` supplies short low-volume tones after the user explicitly enables audio. Audio starts muted and has no network asset dependency.

## Deliberately deferred

Patient loading / transport driving, dynamic dispatch updates, persistent shift saves, MCI generation, random city events, and large city expansion. Existing city movement, clinical content, and backend integrations remain in use.

## Verification

Production build, TypeScript, lint, and asset/JavaScript budgets pass. All 27 unit tests pass. The eight SickCity browser checks cover desktop/mobile dispatch, local model decoding, keyboard dialogs, the full clinical handoff, and the five-call lifecycle with duplicate-XP prevention. Two duplicate mobile lifecycle runs are intentionally skipped; full clinical integration runs at a mobile viewport. The original clinical route and scoring checks pass, including the desktop anaphylaxis walkthrough after adding a scene-interaction control for HUD-obscured targets.

In-world care verification: full desktop and mobile care walkthroughs assert that the original city canvas remains connected through patient contact and debrief, that only one canvas/main exists, and that no EMT Scene navigation link is exposed. Both pass.

Care consistency: quick and full encounters use a patient-focused camera and shared lettered action buttons. The crash driver uses the seated pose; action panels leave the patient visible on desktop and mobile. SickCity radio selection opens explicit authored resource choices, while the standalone lab retains its existing radio behavior. Desktop/mobile crash regression checks cover scene safety, rescue requests, driver assessment, stable action order, and preservation of the city canvas.
