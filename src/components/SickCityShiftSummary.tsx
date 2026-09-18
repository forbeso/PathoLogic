import SickCityXPDisplay from './SickCityXPDisplay';
import { SKILL_LABELS, summarizeShift, type ShiftCallResult, type SkillScores, type PerformanceCategory } from '@/lib/sickCityShift';
import styles from './SickCityGame.module.css';
export function SkillPerformance({ scores }: { scores: SkillScores }) {
  return <dl className={styles.skillPerformance}>{(Object.entries(scores) as [PerformanceCategory, number][]).map(([key, value]) => <div key={key}><dt>{SKILL_LABELS[key] ?? key}</dt><dd><strong>{value}%</strong><span className={styles.skillTrack}><span style={{width: `${value}%`}} /></span></dd></div>)}</dl>;
}
export default function SickCityShiftSummary({ calls, xp, number, onStart }: { calls: ShiftCallResult[]; xp: number; number: number; onStart: () => void }) {
  const { scores, weakest } = summarizeShift(calls);
  return <section className={styles.debrief} aria-label="Shift review"><p className={styles.eyebrow}>UNIT 07 · SHIFT {String(number).padStart(2,'0')}</p><h1>SHIFT COMPLETE</h1><p>Your unit is clear. Take a moment to review the shift.</p><div className={styles.debriefStats}><div><strong>{calls.length}</strong><span>PATIENTS TREATED</span></div><div><strong><SickCityXPDisplay value={xp}/></strong><span>XP EARNED</span></div><div><strong>07</strong><span>UNIT</span></div></div><SkillPerformance scores={scores}/><p className={styles.note}>Measured categories only. Each score averages the calls that recorded that skill.</p><div className={styles.shiftCoaching}><p className={styles.eyebrow}>SHIFT REVIEW</p><p>{weakest && scores[weakest]! < 100 ? `Your lowest recorded category was ${SKILL_LABELS[weakest].toLowerCase()} (${scores[weakest]}%). Revisit those decisions before your next shift.` : 'You met the measured objectives consistently. Continue your career with the next shift.'}</p></div><button className={styles.primary} onClick={onStart}>START NEXT SHIFT →</button></section>;
}
