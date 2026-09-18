import { ArrowRight, MapPin, Radio, X } from 'lucide-react';
import { SICK_CITY_CALLS } from '@/lib/sickCity';
import { CAREER_CALLS } from '@/lib/sickCityShift';
import styles from './SickCityGame.module.css';

type Props = {
  selectedIndex: number; activeIndex: number | null;
  onAccept: (index: number) => void; onClose?: () => void;
};
export default function SickCityDispatch({ selectedIndex, activeIndex, onAccept, onClose }: Props) {
  const call = SICK_CITY_CALLS[selectedIndex];
  const assignment = CAREER_CALLS[selectedIndex];
  return <section className={styles.dispatchBoard} aria-label="Patient dispatch board">
    <div className={styles.cardTop}><span><Radio size={17}/> {activeIndex !== null ? 'DISPATCH NOTES' : 'INCOMING DISPATCH'}</span>{onClose && <button onClick={onClose} aria-label="Close dispatch board"><X size={20}/></button>}</div>
    <div className={styles.dispatchColumns}>
      <article className={styles.callBriefing} aria-label={`Dispatch details ${call.code}`}>
        <div className={styles.caseMeta}><span>{call.code} · UNIT 07</span><span data-priority={call.priority}>PRIORITY {assignment.priority}</span></div>
        <h2>{assignment.dispatchReport.title}</h2>
        {assignment.dispatchReport.lines.map(line => <p key={line} className={styles.callerReport}>{line}</p>)}
        <div className={styles.location}><MapPin size={20}/><div><strong>{call.district}</strong><span>{call.location}</span></div></div>
        <details className={styles.dispatchMore}><summary>DISPATCH NOTES</summary><p className={styles.callerReport}>Unit 07, respond priority {assignment.priority}. {assignment.dispatchReport.reliability === 'limited' ? 'Information limited to caller report. Confirm findings on arrival.' : 'Confirm scene conditions and patient status on arrival.'}</p></details>
        <button className={styles.primary} onClick={() => activeIndex !== null ? onClose?.() : onAccept(selectedIndex)}>{activeIndex !== null ? 'RETURN TO CALL' : `ACCEPT CALL · ${call.code}`}<ArrowRight size={18}/></button>
      </article>
    </div>
  </section>;
}
