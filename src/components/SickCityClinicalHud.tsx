import type { ReactNode } from 'react';
import { Activity } from 'lucide-react';
import SickCityCareChoices, { type CareChoice } from './SickCityCareChoices';
import styles from './SickCityClinicalHud.module.css';

type Props = {
  worldInteraction?: boolean; title: string; location: string; report: string; goal: string; prompt: string;
  completed: number; total: number; phases: {label: string; complete: boolean}[];
  choices: CareChoice[]; onChoose: (id: string) => void;
  target?: string; onOpen: () => void; onClose?: () => void;
  pending: boolean; feedback?: string; vitals?: ReactNode; equipment?: ReactNode;
};
export default function SickCityClinicalHud(props: Props) {
  return <div className={`${styles.layout} ${props.worldInteraction ? styles.world : ""}`} data-testid="sickcity-clinical-hud">
    <aside className={styles.patient}>
      <p className={styles.eyebrow}><Activity size={18}/> Patient contact</p>
      <h2>{props.title}</h2><p className={styles.location}>{props.location}</p>
      <blockquote>{props.report}</blockquote>
      <ol className={styles.steps}>{props.phases.map((phase,index) => <li key={phase.label} data-done={phase.complete} data-current={!phase.complete && (index===0 || props.phases[index-1].complete)}><span>{String(index+1).padStart(2,'0')}</span>{phase.label}</li>)}</ol>
      {props.vitals}
    </aside>
    <section className={styles.care} aria-label="Assessment and care">
      <header><span>Assessment &amp; care</span><span>{String(Math.min(props.completed+1,props.total)).padStart(2,'0')} / {String(props.total).padStart(2,'0')}</span></header>
      <div className={styles.body}>
        <div className={styles.progress} role="progressbar" aria-label="Care objectives completed" aria-valuenow={props.completed} aria-valuemin={0} aria-valuemax={props.total}><div style={{width:`${props.completed/props.total*100}%`}}/></div>
        <h2>{props.goal}</h2><p className={styles.instruction}>{props.prompt}</p>
        {props.worldInteraction && <details className={styles.findings}><summary>Patient findings</summary><p>{props.report}</p>{props.feedback && <p role="status">{props.feedback.replace(/^(Coach|Patient):\s*/i,'')}</p>}{props.vitals}</details>}
        {!props.worldInteraction && <>
        {props.onClose ? <div className={styles.target}><span>{props.target}</span><button onClick={props.onClose} aria-label={`Close action choices for ${props.target}`}>Back</button></div> : null}
        {props.pending ? <p role="status" className={styles.report}>Requested resources are responding. Wait until the scene is secured.</p> : props.onClose ? <SickCityCareChoices choices={props.choices} onChoose={props.onChoose}/> : props.target ? <button className={styles.open} onClick={props.onOpen} aria-label={`Interact with ${props.target}`}>Assess {props.target}</button> : null}
        {props.equipment}
        {props.feedback ? <div className={styles.report} role="status" data-testid="scene-action-feedback"><p className={styles.eyebrow}>Patient report &amp; findings</p><p>{props.feedback.replace(/^(Coach|Patient):\s*/i,'')}</p></div> : null}
        </>}
      </div>
    </section>
  </div>;
}
