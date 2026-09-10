# PathoLogix site evaluation and to-do list

Evaluated September 9, 2026 against the local working version at `http://localhost:3000`.

## Fix status — September 9, 2026

Implemented the release fixes and navigation/accessibility improvements below. The full feature roadmap remains open; this is not a claim that every planned feature has been built.

- SickCity awards now validate known call/step IDs and use the configured server-side reward. The API is covered with a mocked database integration test; a real cross-device account test remains under item 17.
- Answers are shuffled once per accepted call. Replay counters and completion labels respect local duplicate awards.
- Public assets are now 22.47 MiB and models 12.46 MiB; original source files are preserved outside public downloads. SickCity has dedicated model and initial-JavaScript budgets.
- Added an All training page, a compact tablet header, accurate saving descriptions, and updated available-lab labels.
- Added map/menu dialog focus behavior and Escape support. Added regression coverage for the single hero preview, training navigation, local model decoder, and dispatch switching.
- Production build, lint, typecheck, and 20 unit checks passed. Browser regressions resolved to 141 passes and five skips across the full run and targeted reruns (135 existing cases plus six new cases passed). CI now runs unit tests and checks bundle budgets after its production build. No deployment or push was performed.

## Assessment

PathoLogix has a strong foundation: useful scenario feedback, several distinct practice formats, readable study guides, interactive examination labs, and a recognizable visual identity. SickCity gives the product a distinctive direction. The biggest next step is connecting those experiences into a reliable learning journey. Adding more visual detail alone will not resolve inconsistent progress tracking, predictable answers, or the gap between finishing a quiz and completing an EMS call.

The landing page now shows genuine SickCity previews, and the highlighted scenario image appears once. It still spends several sections explaining similar benefits, while important distinctions between modes and progress-saving behavior remain unclear.

## Coverage and evidence

| Area | What was evaluated | Result / limitation |
| --- | --- | --- |
| Landing, navigation, responsive layout | Live desktop inspection; phone and tablet captures; navigation regression checks | Clear CTAs, no horizontal overflow in completed checks; header wraps at 900px |
| Scenario Trainer | Live question, correct answer, distractor explanations, guest save prompt; implementation review | Core answer-feedback loop worked |
| Flashcards | Route checks and reveal/advance regression checks | Passed; regression tests use a mocked question API |
| SickCity | Live garage and dispatch UI; responsive shell; game, scoring, progression, and question data review | Confirmed answer-order and account-XP integration defects; not a full driving endurance test |
| EMT Scene | Live desktop scene; source and responsive shell inspection | Desktop scene rendered; generic network-idle checks timed out, so those timeouts are not treated as proof of a broken page |
| MCI Triage | Live briefing and mode selection interface; route and source review | Briefing is clear; complete incident scoring was not replayed in this audit |
| Focused Exam Labs | Catalog and all four routes; live ankle lab; persistence review | Labs load; no durable attempt-saving integration found in lab components |
| Learn | Index and all five article routes; article structure and source links in code | Public pages load; clinical statements and external citations were not independently revalidated |
| Account and protected tools | Login/signup/reset UI tests; signed-out redirects for exam, progress, profile, saved scenarios, welcome, and admin | Gates worked; no account was created and authenticated completion, email delivery, or database policies were not verified |
| Support and site metadata | Contact, privacy, terms, 404, sitemap, robots, shared SEO component | Public pages load; this is not a legal compliance review |

Checks performed:

- `npm run typecheck`: passed.
- `npx eslint src scripts tests --quiet`: passed.
- `npm run check:budgets`: failed. Public assets are **36.08 MiB / 28 MiB**; models are **26.81 MiB / 16 MiB**. These are repository asset totals, not bytes downloaded on every page.
- Selected desktop/mobile Playwright suite: **23 passed, 6 failed, 1 skipped**. All six failures concern obsolete heading assertions in three tests, repeated on both viewport projects. The progress/back test reaches its final heading assertion, so its failure does not establish a broken redirect.
- Read-only route sweep: **28 routes × 2 viewports = 56 checks**. Fifty-four completed without reported page errors, broken loaded images, or horizontal overflow. The two EMT Scene checks timed out waiting for network idle. Separate DOM/canvas checks found no overflow at 393px, 900px, and 1280px for the homepage, SickCity, and EMT Scene.
- No production deployment, Lighthouse/Core Web Vitals benchmark, exhaustive accessibility audit, full security audit, or authenticated end-to-end examination was performed.

## P1 — Fix before the next release

- [x] **01. Make SickCity XP save correctly to accounts.** Confirmed code defect. `SickCityGame.tsx` sends `sickcity:` award IDs, while `api/progression.ts` accepts only `emt-scene:`. Completion rewards are also 80–110 XP in SickCity but fixed at 40 on the API. Define server-validated awards for each supported activity and one consistent reward policy. **Done when:** completing a call, refreshing, and opening another signed-in device show matching XP; replays follow an explicit duplicate-award policy. Touchpoints: `src/components/SickCityGame.tsx`, `src/pages/api/progression.ts`, `src/lib/progression.ts`, `src/lib/sickCity.ts`.

- [x] **02. Remove the always-A answer pattern.** Confirmed across all **20 SickCity decisions**: the correct option is first, and the UI renders the source order. Shuffle once per question attempt while retaining stable option IDs and order during feedback. **Done when:** correct answers appear in varied positions, feedback remains attached to the selected answer, and rerenders do not reorder choices. Touchpoints: `src/lib/sickCity.ts`, `src/components/SickCityGame.tsx`.

- [x] **03. Restore passing performance budgets.** Optimize or deduplicate assets and measure per-route downloads, especially SickCity. Introduce explicit SickCity model/JavaScript budgets; avoid merely increasing the global limits without measured justification. **Done when:** the budget check passes with documented cold-load measurements. Touchpoints: `public/models`, `scripts/check-performance-budgets.mjs`.

- [x] **04. Repair stale regression assertions and cover the new flows.** Homepage tests expect an H1 named “PathoLogix”; trainer tests expect “Practice the call before exam day.” Both have changed. Update expectations to the intended UI and add focused checks for one hero preview, SickCity preview links, dispatch switching, and persisted XP. **Done when:** the six observed failures pass and the full CI suite is green. Touchpoints: `tests/e2e/core-flows.spec.ts`, `.github/workflows/quality.yml`.

- [x] **05. Correct the landing page's progress-saving claim.** The page says every lab uses the same account and progress system, but focused labs do not record durable attempts and SickCity account awards currently fail. State the actual save behavior until integration is complete. **Done when:** each mode clearly explains guest/local/account persistence, and marketing copy matches it. Touchpoints: `src/components/LandingPage.tsx:326`, focused lab components, `src/pages/progress.tsx`.

## P2 — Connect and polish the existing product

- [ ] **06. Give every completed activity a useful history entry.** Add SickCity and focused-lab attempts to Progress: case, first-attempt accuracy, missed actions, time, completion date, and recommended follow-up. The current simulation history type covers five EMT Scene cases. **Done when:** one completed activity from each mode appears with its own meaningful debrief and replay link.

- [x] **07. Make displayed shift XP agree with awarded XP.** SickCity increments `shiftXp` on every correct replay even when `awardProgress` deduplicates its fixed award ID. Use the award result, or clearly distinguish practice score from account XP. **Done when:** replaying a completed call never promises account XP that was not awarded.

- [ ] **08. Add shift save/resume.** SickCity's active call, care step, completed-call list, ambulance pose, and shift counters live in component state. Persist a versioned checkpoint and offer Resume/New shift. **Done when:** refresh or accidental navigation can recover a valid shift; incompatible saves reset gracefully.

- [x] **09. Unify navigation and mode selection.** The primary header exposes seven destinations but omits EMT Scene and Triage. Add a Training hub or grouped menu with a short purpose, duration, device requirements, and save status for every mode. Keep Home and return-to-training access consistent in game layouts. **Done when:** every mode is discoverable from any primary training page without returning to the long homepage.

- [x] **10. Fix the tablet header breakpoint.** At 900px the header grows to 125px and moves Practice/Sign in to a second row; it is 69px at 1280px. Use the compact navigation earlier or simplify the desktop items. **Done when:** 768–1024px widths retain a deliberate, uncluttered header in both themes.

- [ ] **11. Shorten the landing page and clarify the two starting paths.** Keep a clear choice between quick clinical practice and an interactive SickCity shift. Consolidate overlapping Clinical reasoning, Scenario flow, and Why it sticks copy. Add a compact mode comparison including sign-in requirements. **Done when:** a new visitor can choose the appropriate first activity without reading the whole page.

- [x] **12. Update the lab catalog and homepage descriptions.** The homepage describes ankle and knee labs, while wrist/hand and neuro are also available. The catalog groups these under “Next in the lab,” which can read as planned content. Give available labs consistent cards/status and useful previews. **Done when:** all four labs look equally available and accurately described.

- [x] **13. Complete the keyboard behavior of SickCity overlays.** The shift-menu/map overlays do not use the existing modal-focus helper or dialog semantics. Audit focus entry, containment where modal, Escape, focus return, and hidden controls behind overlays. Add a stable page heading for the game. **Done when:** dispatch → map → menu → resume can be operated without a mouse or accidental movement.

- [ ] **14. Add explicit 3D loading failure and recovery states.** Keep load progress visible outside the canvas, distinguish loading from a failed asset/WebGL context, and provide Retry plus another training option. SickCity's current scene loader is inside Canvas/Suspense. **Done when:** simulated model failure or unavailable WebGL produces an actionable screen rather than an empty game area.

- [ ] **15. Offer graphics settings and verify real-device controls.** SickCity currently requests high-performance rendering, shadows, and antialiasing with a fixed DPR range. Add low/standard quality options, then test touch steering, braking, dispatch, care panels, portrait/landscape, and sustained play on a physical phone. **Done when:** a documented device matrix covers frame rate, loading, heat, and reachable controls. Do not equate “no horizontal overflow” with a playable mobile game.

- [ ] **16. Add a consistent content-review trail and reporting shortcut.** Study guides include sources, but SickCity's question schema lacks reviewer/source/version fields. Expose review metadata and a report-this-question action that carries the case and step ID. Separate EMT/paramedic scope clearly in content labels. **Done when:** every clinical learning item has an accountable review path and the learner can flag the exact item. A qualified clinical review remains separate work.

- [ ] **17. Verify authenticated journeys with a dedicated test account.** Exercise signup, verification, password reset, timed exam completion, saved scenarios, profile updates, and cross-device progress. Test expired sessions and failed saves with visible recovery. **Done when:** completion survives sign-out/sign-in and errors never appear as successful saves. This audit checked the gates and UI, not those account transactions.

- [ ] **18. Keep saved state and learning recommendations consistent.** Define what guests retain, what transfers on sign-in, and which event creates a streak or completion. Link debriefs to relevant guides, labs, or targeted questions. **Done when:** the next-practice recommendation reflects actual mistakes rather than just accumulated XP.

## P3 — Make SickCity a fuller EMT game

- [ ] **19. Finish the dispatch-to-handoff loop.** Today care is four multiple-choice steps per call, followed by debrief and a reset to dispatch. Add equipment retrieval, patient interaction, loading the patient, transport, reassessment en route, receiving-hospital handoff, and restocking. **Done when:** one polished call is playable from garage departure through hospital handoff before expanding the whole catalog.

- [ ] **20. Add patient state that responds to decisions.** Introduce changing observations/vitals and scenario-specific consequences, with separate guided and assessment modes. Preserve first-choice performance instead of only counting retries. **Done when:** decisions meaningfully change a call while feedback explains the causal relationship and supports learning.

- [ ] **21. Improve city navigation and driving confidence.** Add road-following route guidance, clearer turn/intersection cues, destination access/parking, and a recover-vehicle action. Extend regression checks to all five patient routes and long trips across streamed districts. **Done when:** users can reach, park near, leave, and return from every patient without unexplained obstructions. This is a validation/feature task, not a claim that the current map direction is broken.

- [ ] **22. Establish one consistent visual and audio style.** Align pedestrian, patient, ambulance, hospital, road, and prop detail levels; tune world-label scale/occlusion; add restrained dispatch radio, engine, environment, and interaction sounds with independent controls and captions where relevant. **Done when:** the game reads as a coherent environment and important visual information remains legible during play.

- [ ] **23. Expand replay value after the core loop works.** Vary dispatch circumstances, patient presentations, locations, and difficulty; add shift objectives and unlocks tied to demonstrated skills. Start from the five existing calls and twenty decisions. **Done when:** repeats require fresh assessment rather than memorizing the same answer position or fixed sequence.

## P3 — Discoverability and ongoing quality

- [ ] **24. Refresh SEO and sharing assets.** Update manually maintained sitemap modification dates when pages change. Review the signed-in-only exam route's presence in the public sitemap. Add route-specific sharing images and correct image dimensions instead of the shared default everywhere. **Done when:** public routes have accurate titles, canonical URLs, index policy, dates, and previews.

- [ ] **25. Measure where learners stop.** Extend existing privacy-conscious telemetry to SickCity call acceptance, vehicle entry, patient arrival, care completion, abandonment, and load failures. Add equivalent completion events for labs. **Done when:** a dashboard can identify the largest drop-off without collecting patient narratives or answer free text.

## Recommended order

1. Fix XP persistence, answer order, performance budgets, stale tests, and inaccurate save claims (01–05).
2. Connect histories and navigation; improve resume, accessibility, and loading recovery (06–18).
3. Build one complete garage-to-hospital SickCity call, then expand depth, variety, and presentation (19–23).
4. Maintain discoverability and measure whether the changes improve completion (24–25).

The initial audit was read-only. The fix status above records subsequent implementation; unchecked entries remain planned work.
