# SickCity career shift — first pass

SickCity now starts with Unit 07 at the hospital garage, followed by an incoming dispatch. Dispatch assigns a level-eligible case. SickCity has one career flow; Training Mode and the manual scenario picker have been removed. An accepted assignment is locked until it is cleared or restarted from the shift menu.

## Call lifecycle

Starting shift / available → dispatch → en route → on scene → patient contact → clearing → available. After five completed encounters, clearing the fifth opens the shift summary. Starting the next shift resets the shift counters and returns the unit to the garage. Clearing individual calls preserves the player and ambulance position.

`TRANSPORTING` and `AT HOSPITAL` are supported status values, but are not displayed merely because the player chose a transport plan. Actual patient loading and hospital delivery are not implemented in this pass.

Full calls use the shared clinical logic as an in-world control overlay. SickCity keeps the same city canvas, patient location, medic, and ambulance mounted throughout care; the camera frames the patient. No EMT Scene environment is loaded. Clinical actions, scoring, progression awards, and attempt history remain shared with the standalone skills lab. Stepping back closes the care controls without counting a completed call. The care header and next-shift action keep players inside SickCity.

## Data and progression

- `sickCityLocations.ts`: reusable existing world locations; both quick and full calls reference these coordinates.
- `sickCityShift.ts`: dispatch-safe reports, level eligibility, difficulty, call type, priority, reward metadata, objectives, skill categories, assignment selection, and score aggregation.
- Clinical diagnoses remain separate from dispatch reports. Dispatch displays only reported information.
- Existing introductory quick calls remain available at level 1. Full medical calls begin at level 2; more complex clinical scenes at level 3. These thresholds fit the currently small catalog and existing 250-XP level curve; future authored cases can choose higher thresholds.
- Existing XP award IDs and server validation are preserved. Quick-call replay does not mint duplicate XP; the UI displays the XP actually awarded. Full care retains the original clinical attempt awards.
- Shift state is session-local. Existing learner XP and clinical attempt history retain their existing persistence behavior. Reloading the page starts a new shift; resumable shifts are future work.

## Scoring

Quick encounters record every chosen action by skill. Each category is correct choices divided by recorded choices, so a reconsidered answer affects that score even when the objective is ultimately completed. Full clinical encounters use the existing engine's seven category scores. Shift scores average only the calls that actually measured a category. Missing categories are omitted, never filled with sample percentages.

The post-call review retains clinical explanations and the original full-scene debrief. Quick calls defer explanatory feedback to the call review. The shift summary leads directly into the next career shift. Clinical review remains inside the care overlay.

## Presentation and audio

Dark neutral HUD, amber actions, red dispatch accent, compact mobile bottom sheet, unit status and shift counters. Dispatch, status, and XP transitions respect reduced motion. `useDispatchRadio` supplies short low-volume tones after the user explicitly enables audio. Audio starts muted and has no network asset dependency.

## Deliberately deferred

Dynamic dispatch updates, persistent shift saves, MCI generation, random city events, and large city expansion. Existing city movement, clinical content, and backend integrations remain in use.

## Verification

Production build, TypeScript, lint, and asset/JavaScript budgets pass. All 28 unit tests pass. Fourteen desktop/mobile browser checks cover career-only dispatch, local model decoding, keyboard dialogs, clinical care/debrief, and approaching the city teen without lab animal hazards. Duplicate-XP prevention remains covered by unit tests; the former manual-picker five-call browser loop was replaced by career dispatch checks.

In-world care verification: full desktop and mobile care walkthroughs assert that the original city canvas remains connected through patient contact and debrief, that only one canvas/main exists, and that no EMT Scene navigation link is exposed. Both pass.

Care consistency: quick and full encounters use a patient-focused camera and shared lettered action buttons. The crash driver uses the seated pose; action panels leave the patient visible on desktop and mobile. SickCity radio selection opens explicit authored resource choices, while the standalone lab retains its existing radio behavior. Desktop/mobile crash regression checks cover scene safety, rescue requests, driver assessment, stable action order, and preservation of the city canvas.

## World interaction pilot

The hypoglycemia clinical call uses the existing skinned, animated lying patient and optimized medical bag. Contextual markers attach to head, chest, and hand bones or sit above equipment; selecting them opens a compact in-world action menu using the original engine and shuffled choices. A side camera keeps the medic out of the patient's silhouette. The large selection cards are replaced by a small objective card with a patient-findings drawer. All clinical calls and quick encounters now use the same floating marker and compact action-menu presentation. Patients without skeletons use a torso-height anchor. Quick encounters keep their original scoring and continuation rules inside the menu. This reuses existing assets; it does not yet add treatment-specific animations, new patient models, or transport loading.

## City-specific scene requirements

The teen breathing call uses `sickCityClinicalScenarios.ts` for its sidewalk setup, inspection, and approach prerequisites. No dog or animal-control requirement is imported into this city encounter, including scoring and debrief. Clinical actions are reused without requiring lab props. The standalone EMT Scene dog encounter is unchanged. Automated career tests seed progression and dispatch randomness rather than adding a player-facing scenario picker.

After the final care action, quick and full encounters enter stretcher retrieval, patient transfer, loading, ambulance transport, and hospital handoff. The call counter and shift result update once after handoff; quick-call completion XP is deferred until then. Clinical assessment XP remains awarded by the clinical engine. Clear Call remains on the debrief to return the unit to dispatch.

The hypoglycemia pilot now publishes successful equipment use from the clinical engine into the city. A cuff and pulse-ox clip follow the rigged patient's arm and hand; a compact monitor beside the bag shows only measured vitals. The existing distress animation slows after successful medication. These are procedural equipment props and an animation-speed response, not new treatment animations. Equipment clears on leaving care or automatic completion. Other patient models and transport remain future work.

Equipment presentation now supports all full clinical calls, with named head, chest, arm, and hand attachment points on seated/standing/supine city patients. Oxygen success reveals a cylinder and patient mask; measured BP and pulse oximetry reveal the corresponding attachments and monitor. City body markers use those same attachment points. The teen's initial visual description matches its sidewalk pose. This does not replace the remaining stylized patient meshes with new character assets or alter clinical action prerequisites.

All remaining shape-based patients now use a cloned skinned character from the existing standing civilian asset. Its cloned bind skeleton is posed at the arm and leg joints for standing, seated, or supine encounters, normalized to human scale, and grounded using posed vertex bounds. The teen uses a smaller stature. The original animated lying patient remains for the park-fall and hypoglycemia encounters. Equipment and markers follow the skeleton; a side care camera frames the new torso heights. This is shared character art with procedural poses and subtle breathing, not a set of unique scanned patients or bespoke treatment clips.


## Patient transport and hospital handoff

Retrieve the stretcher within reach of the parked ambulance, roll it to the patient, transfer the patient, and return to Unit 07 to load. The stretcher follows walking movement and preserves the original patient appearance. Enter the ambulance and drive to the marked receiving bay at [22, 0, -34], on the hospital's accessible front apron. Handoff starts only when the occupied ambulance stops within five world units of that bay. It finishes automatically after seven active seconds; pause or map opening pauses the handoff. There is no Complete Call button. The patient is removed from the original scene once transferred, and the call remains open until hospital handoff. The map follows the current transport destination; nearby patient markers are replaced by stretcher/vehicle controls. Loading and handoff animate the cot and rear doors; coordinated lifting and receiving-staff animations remain future work.

### Animated transport actions

Patient transfer takes 2.4 seconds with a visible lift onto the cot. Ambulance loading takes 2.8 seconds: the cot approaches the rear and slides into the compartment. Both actions lock movement and disable repeat interaction. The same active-time clock drives animation and completion; the shift menu and map freeze progress until play resumes. The medic bends and reaches during transfer. Hinged rear doors open for loading and close before driving; the ambulance has a hollow compartment with cot rails and equipment storage. Hand-to-patient contact and coordinated partner lifting remain future animation work.

### Visible hospital handoff

The seven-second hospital handoff opens the rear doors, unloads the patient on the cot, and moves it toward receiving. An elevated apron camera follows the sequence. The shared active-time clock freezes animation and completion in the shift menu or map, then resumes from the same point. Completion and XP remain guarded against duplicate awards. A receiving medic now accompanies the cot; finger wrapping and coordinated lifting remain future work.

### Driving and handoff visibility

If steering would clip the ambulance footprint into a boundary, safe travel at the existing heading is preserved; if neither path fits, the ambulance still stops. The collision footprint and drivable boundaries are unchanged. During hospital handoff, the existing temporary-material fading follows the stretcher, then restores nearby ambulance/street objects when handoff ends. This keeps shared model materials intact.

### Stretcher partner

A second rigged medic accompanies the cot during retrieval and transport, reaches beside it during patient transfer, and stays outside the ambulance as loading finishes. Walking follows cot movement, with a wider transport camera framing both medics and the patient. Finger wrapping and partner approach/exit transitions remain future work.

### Hospital receiver

During handoff, a receiving medic waits outside the rear-door area and then walks alongside the stretcher to receiving. The receiver shares the rigged medic asset, uses the handling pose, stays grounded as the cot lowers, and stops walking when the cot stops. Placement is checked across ambulance headings. Wrist targets now follow the side rails and end handles. Finger wrapping and full-body lifting remain future work.

### Handle targeting

A two-bone arm solver targets world-space cot grips after the walking animation. It preserves upper-arm and forearm length, clamps unreachable targets, and supports rotated/scaled rigs. Rear handles are used when pushing, front handles during loading, and side rails during transfer and receiving. Receiving staff use a relaxed handling pose while waiting outside the doors.

### Consecutive-call stability

Accepting a dispatch clears prior care targets, equipment, menus, and transport animation progress. Clearing a completed call also clears those transient values while retaining the parked unit, shift totals, and earned progression. The consecutive-call regression uses a full five-call shift in one session (four quick calls plus clinical hypoglycemia), with real care and transport controls. It checks fresh care menus, removal of clinical equipment, increasing call counts, exact XP totals, the final shift review, no sixth dispatch, and a new shift at the garage with earned progression preserved. Navigation chooses the nearest of eight keyboard directions relative to the current camera (rather than treating a tiny secondary component as full diagonal input), reads position and view heading atomically, and allows the scene's 120ms telemetry interval to settle. Routes go around the parked ambulance after exiting rather than through its collision footprint.
