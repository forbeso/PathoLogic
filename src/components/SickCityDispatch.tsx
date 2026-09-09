import { ArrowRight, Check, MapPin, Radio, X } from "lucide-react";
import { SICK_CITY_CALLS, type SickCityCallId } from "@/lib/sickCity";
import styles from "./SickCityGame.module.css";

type Props = {
  selectedIndex: number;
  activeIndex: number | null;
  completed: SickCityCallId[];
  providingCare: boolean;
  onSelect: (index: number) => void;
  onAccept: (index: number) => void;
  onClose?: () => void;
};

export default function SickCityDispatch({ selectedIndex, activeIndex, completed, providingCare, onSelect, onAccept, onClose }: Props) {
  const call = SICK_CITY_CALLS[selectedIndex];
  const isActive = selectedIndex === activeIndex;
  const switching = activeIndex !== null && !isActive;
  return <section className={styles.dispatchBoard} aria-label="Patient dispatch board">
    <div className={styles.cardTop}>
      <span><Radio size={17} /> DISPATCH · {SICK_CITY_CALLS.length} CALLS</span>
      {onClose && <button onClick={onClose} aria-label="Close dispatch board"><X size={20} /></button>}
    </div>
    <div className={styles.dispatchColumns}>
      <div className={styles.dispatchPicker}>
        <label htmlFor="patient-dispatch-select">Patient call</label>
        <select id="patient-dispatch-select" value={selectedIndex} onChange={event => onSelect(Number(event.target.value))}>
          {SICK_CITY_CALLS.map((item, index) => <option key={item.id} value={index}>
            {item.code} · {item.title}{index === activeIndex ? " · Active" : completed.includes(item.id) ? " · Completed" : ""}
          </option>)}
        </select>
      </div>
      <article className={styles.callBriefing} aria-label={`Dispatch details ${call.code}`}>
        <div className={styles.caseMeta}><span>{call.code}</span><span data-priority={call.priority}>{call.priority}</span></div>
        <h2>{call.title}</h2>
        <p className={styles.eyebrow}>CALLER REPORT</p>
        <p className={styles.callerReport}>{call.summary}</p>
        <div className={styles.location}><MapPin size={20} /><div><strong>{call.district}</strong><span>{call.location}</span></div></div>
        <details className={styles.dispatchMore}>
          <summary>Patient & training details</summary>
          <dl className={styles.dispatchPatient}><dt>Patient to locate</dt><dd>{call.patientLabel}</dd></dl>
          <div className={styles.dispatchStats}><span><strong>{call.steps.length}</strong> care decisions</span><span><strong>+{call.rewardXp}</strong> completion XP</span></div>
        </details>
        {isActive ? <button className={styles.primary} onClick={onClose}><Check size={18} /> Return to active call</button>
          : <button className={styles.primary} disabled={providingCare} onClick={() => onAccept(selectedIndex)}>
            {switching ? "Switch to call" : completed.includes(call.id) ? "Accept call again" : "Accept call"} · {call.code}<ArrowRight size={18} />
          </button>}
        <p className={styles.note}>{providingCare && !isActive ? "Finish your current patient’s care before accepting another call."
          : switching ? "Accepting this call replaces your current assignment. Unit 07 stays where you parked it."
          : isActive ? "Assigned to Unit 07. These dispatch details remain available throughout the call."
          : "Review the report, accept this patient’s call, then follow the dispatch waypoint."}</p>
      </article>
    </div>
  </section>;
}
