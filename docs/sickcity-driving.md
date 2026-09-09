# Sick City driving

A new shift starts at SickCity Medical, inside the rear ambulance garage next to Unit 07. Accept a dispatch, enter the ambulance, drive east out of the open garage bay onto the driveway, follow the streets to the patient, brake, exit, and begin the existing assessment flow.

## Controls

- On foot: WASD or arrow keys to walk; drag the scene to look.
- In the ambulance: W/up accelerates, S/down reverses, A/left and D/right steer, Space brakes.
- E enters a nearby ambulance, exits a stopped ambulance, or begins care when a patient is within reach.
- The on-screen interaction button performs the same contextual action. Mobile includes touch direction controls and a brake button.
- The map follows the active medic or ambulance. Opening the map or shift menu stops motion.

Entry requires proximity. Exit requires near-zero speed and a clear side of the vehicle. Care cannot start while driving. The parked ambulance remains where it was left and can be re-entered. Starting the next dispatch or restarting a call returns both the medic and ambulance to the hospital.

Vehicle dynamics and drivable-road geometry are in `src/lib/sickCityVehicle.ts`. Run the regression checks with `node --test tests/unit/sick-city-vehicle.test.cjs`.

Browser validation: hospital spawn, dispatch acceptance, ambulance entry, driving to City Plaza, braking, exit, and patient-care entry. Vehicle tests cover initial placement, acceleration, braking, reverse, steering direction, boundaries, exit clearance, and long-frame handling. Phone-sized rendering remains unverified in the current browser environment.

The garage sits behind the hospital, north of its main building. Its east-facing opening connects to the north-south street at x=36. Garage wall collisions and the full vehicle footprint are included in the regression tests.


## Continuous city streets

The previous +/-69 vehicle limit, +/-70 walking clamp, CityLink portals and detached skyline ring have been removed. Every original street continues into a procedural street grid. New avenues begin at +/-90 world units and repeat every 60 units; they connect into blocks and circuits in all directions. The hospital district and its calls retain their positions.

Street rendering, collision and the scrolling map use `src/lib/sickCityWorld.ts`. Neighborhood buildings have deterministic lots and collision, windows on all sides, roof trim, doors, canopies and streetlights. Geometry is instanced by material. A bounded neighborhood around the camera is rebuilt every 60 units, beyond the fog distance; terrain, sky and the shadow light follow the view. There is no fixed driving boundary or visible ground edge in normal play. Distant neighborhoods are currently procedural scenery; dispatches still take place in the original medical district.

Cornering automatically reduces forward speed, and vehicles can mount low curbs to complete urban turns. The chase camera shortens before buildings or garage walls. The map follows the active unit, shows vehicle heading and keeps hospital and off-screen call markers available.

Regression coverage now includes all 12 former street ends, driving beyond 1,200 world units, remote avenues, a full circuit, building/road separation, stable regeneration and the garage-to-avenue turn.


## Patient dispatch board

The compact dispatch panel sits on the right side of the screen. Its patient dropdown lists all five calls by code and title. Selecting a patient previews that patient's caller report, priority and location. The identifying description and training reward are available under “Patient & training details”. Accepting the selected call assigns its patient and waypoint to Unit 07. The radio button in the header and “Dispatch details & patient calls” in the driving HUD reopen the full board throughout a call.

Previewing or closing details does not change an assignment. Switching calls while responding requires the explicit “Switch to call” action and retains the medic/ambulance positions; opening the board pauses movement. During patient care, other briefings can be viewed but accepting another call is disabled until care is complete. Completed patients remain available for replay and carry a completed status in the current shift.

Browser checks: all five briefings and acceptance actions, preview without reassignment, reopening current details, and assignment changes while responding.
