import SickCityDispatch from "@/components/SickCityDispatch";
import { mapCoordinate, mapMarker, mapHeadingDegrees } from "@/lib/sickCityMap";
import { streetCoordinates, streetWidth } from "@/lib/sickCityWorld";
import { AMBULANCE_START_YAW, HOSPITAL_AMBULANCE_START, ambulanceExitPosition, type VehiclePose } from "@/lib/sickCityVehicle";
import styles from "./SickCityGame.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Ambulance, Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, GraduationCap, Map, Navigation, Radio, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { awardProgress } from "@/lib/progression";
import { getSickCityCall, SICK_CITY_CALLS, type SickCityCallId } from "@/lib/sickCity";
import {
  SICK_CITY_START_POSITION,
  type SickCityMovement,
} from "@/components/SickCityScene";

const SickCityScene = dynamic(() => import("@/components/SickCityScene"), {
  ssr: false,
});

type GamePhase = "dispatch" | "locate" | "assessment" | "complete";
type Point = [number, number, number];

const EMPTY_MOVEMENT: SickCityMovement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
};

function planarDistance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function ControlButton({
  label,
  direction,
  movementRef,
  icon,
}: {
  label: string;
  direction: keyof SickCityMovement;
  movementRef: React.MutableRefObject<SickCityMovement>;
  icon: React.ReactNode;
}) {
  const setPressed = (pressed: boolean) => {
    movementRef.current[direction] = pressed;
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="grid h-12 w-12 touch-none place-items-center rounded-md border border-white/25 bg-[#071b22]/90 text-white shadow-lg backdrop-blur-md active:border-teal-300 active:bg-teal-500/30"
    >
      {icon}
    </button>
  );
}

function CityMap({
  playerPosition,
  callPosition,
  vehicleHeading,
}: {
  playerPosition: Point;
  callPosition: Point;
  vehicleHeading?: number;
}) {
  const [centerX, , centerZ] = playerPosition;
  const offscreen = Math.abs(callPosition[0] - centerX) > 94 || Math.abs(callPosition[2] - centerZ) > 94;
  return (
    <div className="relative mt-2 aspect-square overflow-hidden rounded-md border border-white/10 bg-[#436f50] sm:mt-4" aria-label="Local street map">
      {streetCoordinates("z", centerZ - 100, centerZ + 100).map(z => (
        <div key={`road-z-${z}`} className="absolute inset-x-0 bg-[#414b51]" style={{ top: mapCoordinate(z, centerZ), height: `${streetWidth(z) / 2}%`, transform: "translateY(-50%)" }} />
      ))}
      {streetCoordinates("x", centerX - 100, centerX + 100).map(x => (
        <div key={`road-x-${x}`} className="absolute inset-y-0 bg-[#414b51]" style={{ left: mapCoordinate(x, centerX), width: `${streetWidth(x) / 2}%`, transform: "translateX(-50%)" }} />
      ))}
      <span className="absolute right-2 top-2 text-[9px] font-bold text-white/80">NORTH UP ↑</span>
      <span className="absolute rounded bg-slate-950/80 px-1 text-[9px] font-bold text-white"
        style={{ ...mapMarker(22, -62, centerX, centerZ), transform: "translate(-50%,-50%)" }} title="Hospital garage">H</span>
      <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 ring-4 ring-amber-300/25"
        style={mapMarker(callPosition[0], callPosition[2], centerX, centerZ)} title="Active call">
        {offscreen && <span className="absolute bottom-3 right-0 whitespace-nowrap rounded bg-slate-950/80 px-1 text-[8px] text-amber-200">CALL</span>}
      </div>
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 ring-4 ring-teal-300/25"
        title="You" data-world-x={centerX.toFixed(1)} data-world-z={centerZ.toFixed(1)}>
        {vehicleHeading !== undefined && <span className="absolute -inset-2" style={{ transform: `rotate(${mapHeadingDegrees(vehicleHeading)}deg)` }}>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-[4px] border-b-[6px] border-x-transparent border-b-teal-200" />
        </span>}
      </div>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-[#071b23]/70 px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.08em] text-white/75 sm:bottom-2 sm:left-2 sm:text-[9px]">
        Teal: you · Amber: call · H: hospital
      </span>
    </div>
  );
}

export default function SickCityGame() {
  const movementRef = useRef<SickCityMovement>({ ...EMPTY_MOVEMENT });
  const canMoveRef = useRef(false);
  const interactRef = useRef<() => void>(() => undefined);
  const [callIndex, setCallIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("dispatch");
  const [playerPosition, setPlayerPosition] = useState<Point>(SICK_CITY_START_POSITION);
  const [playerSpawn, setPlayerSpawn] = useState<Point>(SICK_CITY_START_POSITION);
  const [playerFacing, setPlayerFacing] = useState(Math.PI / 2);
  const [playerResetToken, setPlayerResetToken] = useState(0);
  const [inAmbulance, setInAmbulance] = useState(false);
  const [vehicleResetToken, setVehicleResetToken] = useState(0);
  const [vehiclePose, setVehiclePose] = useState<VehiclePose>({ position: HOSPITAL_AMBULANCE_START, yaw: AMBULANCE_START_YAW, speed: 0 });
  const vehiclePoseRef = useRef(vehiclePose);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dispatchBoardOpen, setDispatchBoardOpen] = useState(false);
  const [previewCallIndex, setPreviewCallIndex] = useState(0);
  const [completedCallIds, setCompletedCallIds] = useState<SickCityCallId[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shiftXp, setShiftXp] = useState(0);
  const [callsCompleted, setCallsCompleted] = useState(0);
  const { level } = useLearnerProgress();
  const activeCall = getSickCityCall(callIndex);
  const activeStep = activeCall.steps[stepIndex];
  const navigationPosition = inAmbulance ? vehiclePose.position : playerPosition;
  const ambulanceDistance = planarDistance(playerPosition, vehiclePose.position);
  const waypointDistance = planarDistance(navigationPosition, activeCall.position);
  const patientMarkerVisible = phase === "locate";
  const deltaX = activeCall.position[0] - navigationPosition[0];
  const deltaZ = activeCall.position[2] - navigationPosition[2];
  const waypointDirection = Math.abs(deltaX) > Math.abs(deltaZ)
    ? deltaX > 0 ? "east" : "west"
    : deltaZ > 0 ? "south" : "north";

  const progressPercent = (() => {
    if (phase === "complete") return 100;
    if (phase === "assessment") return 35 + Math.round(((stepIndex + (answerCorrect ? 1 : 0)) / activeCall.steps.length) * 65);
    if (phase === "locate") return 20;
    return 0;
  })();

  const canMove = phase === "locate" && !paused && !mapOpen && !dispatchBoardOpen;
  useEffect(() => {
    canMoveRef.current = canMove;
  }, [canMove]);

  const showToast = (message: string) => setToast(message);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const clearMovement = () => {
    movementRef.current = { ...EMPTY_MOVEMENT };
  };

  const openDispatchBoard = () => {
    clearMovement();
    setPreviewCallIndex(callIndex);
    setMapOpen(false);
    setPaused(false);
    setDispatchBoardOpen(true);
  };

  const acceptDispatch = (index: number) => {
    if (phase === "assessment") return;
    clearMovement();
    setCallIndex(index);
    setPhase("locate");
    setStepIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setAnswerCorrect(false);
    setMistakes(0);
    setDispatchBoardOpen(false);
    const call = getSickCityCall(index);
    showToast(`${call.code} accepted. Respond to ${call.district}.`);
  };

  const selectPatient = () => {
    if (phase !== "locate" || paused || mapOpen || dispatchBoardOpen) return;
    if (inAmbulance) { showToast("Park and exit the ambulance before beginning patient care."); return; }
    if (planarDistance(playerPosition, activeCall.position) > 4.2) {
      showToast("You have located the patient. Move closer before beginning care.");
      return;
    }
    clearMovement();
    setPhase("assessment");
    setSelectedOption(null);
    setFeedback(activeCall.initialPatientLine);
    setAnswerCorrect(false);
  };

  const enterAmbulance = () => {
    if (phase !== "locate" || paused || mapOpen || dispatchBoardOpen || inAmbulance) return;
    if (planarDistance(playerPosition, vehiclePoseRef.current.position) > 5) {
      showToast("Move closer to the ambulance to enter Unit 07."); return;
    }
    clearMovement();
    setInAmbulance(true);
    showToast("Unit 07 ready. W/S accelerate or reverse, A/D steer, Space brakes.");
  };
  const exitAmbulance = () => {
    if (!inAmbulance || paused || mapOpen || dispatchBoardOpen) return;
    const pose = vehiclePoseRef.current;
    if (Math.abs(pose.speed) > 1) { showToast("Stop the ambulance before getting out. Hold Space to brake."); return; }
    const position = ambulanceExitPosition(pose);
    if (!position) { showToast("Move to a wider part of the road before getting out."); return; }
    clearMovement();
    setPlayerFacing(Math.atan2(pose.position[0] - position[0], -(pose.position[2] - position[2])));
    setPlayerSpawn(position);
    setPlayerPosition(position);
    setPlayerResetToken(token => token + 1);
    setInAmbulance(false);
    showToast("Ambulance parked. Approach the patient to begin care.");
  };
  const reportAmbulance = (pose: VehiclePose) => {
    vehiclePoseRef.current = pose;
    setVehiclePose(pose);
  };
  const interact = () => {
    if (phase !== "locate" || paused || mapOpen || dispatchBoardOpen) return;
    if (inAmbulance) exitAmbulance();
    else if (waypointDistance <= 4.2) selectPatient();
    else enterAmbulance();
  };

  useEffect(() => {
    interactRef.current = interact;
  });

  useEffect(() => {
    const keyDirection: Record<string, keyof SickCityMovement> = {
      ArrowUp: "forward", w: "forward", W: "forward",
      ArrowDown: "backward", s: "backward", S: "backward",
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      " ": "brake",
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!canMoveRef.current) return;
      const direction = keyDirection[event.key];
      if (direction) {
        if ((event.target as HTMLElement)?.matches("input, textarea, select")) return;
        event.preventDefault();
        movementRef.current[direction] = true;
      }
      if (!event.repeat && (event.key === "e" || event.key === "E") && !(event.target as HTMLElement)?.matches("input, textarea")) {
        interactRef.current();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const direction = keyDirection[event.key];
      if (direction) movementRef.current[direction] = false;
    };
    const clearKeys = () => clearMovement();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
  }, []);

  const chooseOption = (optionId: string) => {
    const option = activeStep.options.find((candidate) => candidate.id === optionId);
    if (!option || answerCorrect) return;
    if (!option.correct) setMistakes((count) => count + 1);
    setSelectedOption(option.id);
    setFeedback(option.correct ? `${option.feedback} ${activeStep.patientReply}` : option.feedback);
    setAnswerCorrect(option.correct);
    if (option.correct) {
      setShiftXp((xp) => xp + 10);
      awardProgress({
        id: `sickcity:${activeCall.id}:${activeStep.id}:v2`,
        xp: 10,
        eventType: "scenario_objective",
        metadata: { scenarioId: activeCall.id, objectiveId: activeStep.id },
      });
    }
  };

  const continueAssessment = () => {
    if (!answerCorrect) return;
    if (stepIndex < activeCall.steps.length - 1) {
      setStepIndex((current) => current + 1);
      setSelectedOption(null);
      setFeedback(null);
      setAnswerCorrect(false);
      return;
    }
    setPhase("complete");
    setSelectedOption(null);
    setFeedback(null);
    setAnswerCorrect(false);
    setShiftXp((xp) => xp + activeCall.rewardXp);
    setCallsCompleted((count) => count + 1);
    setCompletedCallIds(ids => ids.includes(activeCall.id) ? ids : [...ids, activeCall.id]);
    awardProgress({
      id: `sickcity:${activeCall.id}:complete:v2`,
      xp: activeCall.rewardXp,
      eventType: "scenario_complete",
      metadata: { scenarioId: activeCall.id, objectiveId: "complete" },
    });
  };

  const prepareNextCall = (nextIndex: number) => {
    clearMovement();
    setInAmbulance(false);
    setVehicleResetToken(token => token + 1);
    setCallIndex(nextIndex);
    setPhase("dispatch");
    setPlayerFacing(Math.PI / 2);
    setPlayerSpawn(SICK_CITY_START_POSITION);
    setPlayerPosition(SICK_CITY_START_POSITION);
    setPlayerResetToken((token) => token + 1);
    setStepIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setAnswerCorrect(false);
    setPreviewCallIndex(nextIndex);
    setDispatchBoardOpen(false);
    setMapOpen(false);
    setMistakes(0);
  };

  return (
    <div className={styles.game}>
      <div className={styles.world}>
        <SickCityScene activeCall={activeCall} movementRef={movementRef} movementEnabled={canMove}
          inAmbulance={inAmbulance} ambulancePose={vehiclePose} vehicleResetToken={vehicleResetToken}
          onAmbulanceEnter={enterAmbulance} onAmbulanceMove={reportAmbulance}
          playerSpawn={playerSpawn} playerFacing={playerFacing} playerResetToken={playerResetToken}
          showDestinationMarker={phase === "locate" && waypointDistance > 10}
          showPatientMarker={patientMarkerVisible} patientMarkerInteractive={phase === "locate" && !paused && !mapOpen && !dispatchBoardOpen && !inAmbulance}
          onPlayerMove={setPlayerPosition} onPatientSelect={selectPatient} />
      </div>
      <div className={styles.vignette} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="PathoLogix home"><span className={styles.brandIcon}><Activity size={24} /></span><span>SICK<span className={styles.accent}>CITY</span><small>PATHOLOGIX · FIELD OPERATIONS</small></span></Link>
        <div className={styles.shiftStatus}><span className={styles.liveDot} /> UNIT 07 <span className={styles.divider}>/</span> {phase === "assessment" ? "ON SCENE" : phase === "locate" ? "RESPONDING" : "AVAILABLE"}</div>
        <div className={styles.headerActions}><span className={styles.level}>LVL {level.level} <span> · {shiftXp} XP</span></span><button onClick={openDispatchBoard} aria-label="Open patient dispatch board" aria-expanded={dispatchBoardOpen || phase === "dispatch"}><Radio size={19} /></button><button onClick={() => { clearMovement(); setDispatchBoardOpen(false); setMapOpen(!mapOpen); }} aria-label="Toggle city map" aria-expanded={mapOpen}><Map size={19} /></button><button onClick={() => { clearMovement(); setDispatchBoardOpen(false); setPaused(!paused); }} aria-label="Shift menu" aria-expanded={paused}><span>•••</span></button></div>
      </header>

      {(phase === "dispatch" || dispatchBoardOpen) && !paused && !mapOpen && <div className={styles.dispatchHub}>
        {phase === "dispatch" && <p className={styles.dispatchWelcome}>Select a patient call to begin your shift.</p>}
        <SickCityDispatch selectedIndex={previewCallIndex} activeIndex={phase === "locate" || phase === "assessment" ? callIndex : null}
          completed={completedCallIds} providingCare={phase === "assessment"} onSelect={setPreviewCallIndex} onAccept={acceptDispatch}
          onClose={phase === "dispatch" ? undefined : () => setDispatchBoardOpen(false)} />
      </div>}

      {phase === "locate" && !paused && !mapOpen && !dispatchBoardOpen && <>
        <section className={styles.objective}><div className={styles.eyebrow}><Navigation size={14} /> RESPOND TO CALL <span>{activeCall.code}</span></div><h2>{activeCall.district}</h2><p>{activeCall.location}</p><div className={styles.distance}><strong>{Math.round(waypointDistance * 12)}<small> m</small></strong><span>HEAD {waypointDirection.toUpperCase()}</span></div><button className={styles.textButton} onClick={openDispatchBoard}><Radio size={14} /> Dispatch details & patient calls</button></section>
        <div className={styles.miniMap}><div className={styles.eyebrow}><Map size={13} /> DISPATCH GRID</div><CityMap playerPosition={navigationPosition} callPosition={activeCall.position} vehicleHeading={inAmbulance ? vehiclePose.yaw : undefined} /></div>
        <div className={styles.interact}>
          <span>{inAmbulance ? `${Math.round(Math.abs(vehiclePose.speed) * 3.6)} KM/H · ${vehiclePose.speed < -.1 ? "REVERSE" : "UNIT 07"}` : waypointDistance <= 4.2 ? "PATIENT WITHIN REACH" : ambulanceDistance <= 5 ? "UNIT 07 · READY TO BOARD" : "WALK TO YOUR AMBULANCE"}</span>
          <button className={styles.primary} onClick={interact}><Ambulance size={19} />{inAmbulance ? "Park & exit ambulance" : waypointDistance <= 4.2 ? "Begin patient care" : "Enter ambulance"}<kbd>E</kbd></button>
          {!inAmbulance && ambulanceDistance <= 5 && waypointDistance <= 4.2 && <button className={styles.secondary} onClick={enterAmbulance}>Re-enter ambulance</button>}
          {inAmbulance && <div className={styles.brakeControl}><ControlButton label="Brake" direction="brake" movementRef={movementRef} icon={<span className="text-xs font-bold">Brake</span>} /></div>}
        </div>
        <div className={styles.controls}>{inAmbulance ? <><kbd>W S</kbd> Drive / reverse <kbd>A D</kbd> Steer <kbd>Space</kbd> Brake</> : <><kbd>W A S D</kbd> Walk <span>·</span> Drag to look</>} <span>·</span> <kbd>E</kbd> {inAmbulance ? "Exit" : "Interact"}</div>
        <div className={styles.touchControls}><span /><ControlButton label={inAmbulance ? "Accelerate" : "Move forward"} direction="forward" movementRef={movementRef} icon={<ArrowUp size={20} />} /><span /><ControlButton label={inAmbulance ? "Steer left" : "Move left"} direction="left" movementRef={movementRef} icon={<ArrowLeft size={20} />} /><ControlButton label={inAmbulance ? "Reverse" : "Move backward"} direction="backward" movementRef={movementRef} icon={<ArrowDown size={20} />} /><ControlButton label={inAmbulance ? "Steer right" : "Move right"} direction="right" movementRef={movementRef} icon={<ArrowRight size={20} />} /></div>
      </>}

      {phase === "assessment" && activeStep && !paused && !mapOpen && !dispatchBoardOpen && <section className={styles.careLayout}>
        <aside className={styles.patientCard}><p className={styles.eyebrow}><Activity size={15} /> PATIENT CONTACT</p><h2>{activeCall.title}</h2><p>{activeCall.location}</p><blockquote>“{activeCall.initialPatientLine}”</blockquote><ol className={styles.stepList}>{activeCall.steps.map((step, index) => <li key={step.id} data-current={index === stepIndex} data-done={index < stepIndex}><span>{index < stepIndex ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span>{index < stepIndex ? "Assessment complete" : index === stepIndex ? "Current decision" : "Upcoming assessment"}</li>)}</ol></aside>
        <div className={styles.careCard}><div className={styles.cardTop}><span>ASSESSMENT & CARE</span><span>{String(stepIndex + 1).padStart(2, "0")} / {String(activeCall.steps.length).padStart(2, "0")}</span></div><div className={styles.cardBody}><div className={styles.progressTrack}><div style={{ width: `${progressPercent}%` }} /></div><h2>{activeStep.prompt}</h2><p className={styles.note}>Choose the best next action.</p><div className={styles.options}>{activeStep.options.map((option, index) => <button key={option.id} onClick={() => chooseOption(option.id)} disabled={answerCorrect} data-result={selectedOption === option.id ? option.correct ? "correct" : "incorrect" : ""}><span>{String.fromCharCode(65 + index)}</span><strong>{option.label}</strong>{selectedOption === option.id && (option.correct ? <Check size={18} /> : <X size={18} />)}</button>)}</div>{feedback && <div role="status" className={styles.feedback} data-correct={answerCorrect}><p className={styles.eyebrow}>{answerCorrect ? "CLINICAL REASONING" : selectedOption ? "RECONSIDER YOUR APPROACH" : "PATIENT REPORT"}</p><p>{feedback}</p></div>}{answerCorrect && <button className={styles.primary} onClick={continueAssessment}>{stepIndex === activeCall.steps.length - 1 ? "Complete call & debrief" : "Continue assessment"}<ArrowRight size={18} /></button>}</div></div>
      </section>}

      {phase === "complete" && !paused && !mapOpen && !dispatchBoardOpen && <section className={styles.debrief}><span className={styles.debriefIcon}><Check size={32} /></span><p className={styles.eyebrow}>UNIT 07 · CALL CLOSED</p><h1>{activeCall.completionTitle}</h1><p>{activeCall.completionCopy}</p><div className={styles.debriefStats}><div><strong>{activeCall.steps.length}</strong><span>DECISIONS COMPLETED</span></div><div><strong>{mistakes}</strong><span>ANSWERS REVISITED</span></div><div><strong>+{activeCall.rewardXp}</strong><span>COMPLETION XP</span></div></div><div className={styles.pearl}><GraduationCap size={23} /><div><p className={styles.eyebrow}>TAKE THIS INTO YOUR NEXT CALL</p><p>{activeCall.learningPearl}</p></div></div><button className={styles.primary} onClick={() => prepareNextCall((callIndex + 1) % SICK_CITY_CALLS.length)}>Return to dispatch <ArrowRight size={18} /></button><button className={styles.textButton} onClick={() => prepareNextCall(callIndex)}><RotateCcw size={14} /> Replay this call</button></section>}

      {mapOpen && <section className={styles.modal}><div className={styles.cardTop}><span><Map size={16} /> CITY OPERATIONS MAP</span><button onClick={() => setMapOpen(false)} aria-label="Close map"><X size={20} /></button></div><div className={styles.cardBody}><h2>{activeCall.district}</h2><p>{activeCall.location}</p><CityMap playerPosition={navigationPosition} callPosition={activeCall.position} vehicleHeading={inAmbulance ? vehiclePose.yaw : undefined} /><button className={styles.primary} onClick={() => setMapOpen(false)}>Return to shift <ArrowRight size={18} /></button></div></section>}
      {paused && !mapOpen && <section className={styles.modal}><div className={styles.cardBody}><p className={styles.eyebrow}>SHIFT MENU</p><h2>Take a breath.</h2><p>{callsCompleted} calls completed · {shiftXp} XP earned this shift.</p><button className={styles.primary} onClick={() => setPaused(false)}>Resume shift <ArrowRight size={18} /></button><button className={styles.secondary} onClick={() => { prepareNextCall(callIndex); setPaused(false); }}>Restart current call</button><Link className={styles.textButton} href="/">Return to PathoLogix</Link></div></section>}
      {toast && <div role="status" className={styles.toast}><Radio size={16} /> {toast}</div>}
      <div className={styles.trainingLabel}>SIMULATED CITY · EMT TRAINING</div>
    </div>
  );
}
