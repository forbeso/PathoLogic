import { Check, X } from 'lucide-react';
import styles from './SickCityCareChoices.module.css';
export type CareChoice = { id: string; label: string; disabled?: boolean; result?: 'correct' | 'incorrect'; testId?: string };
export default function SickCityCareChoices({ choices, onChoose, compact = false }: { compact?: boolean; choices: CareChoice[]; onChoose: (id: string) => void }) {
  return <div className={`${styles.options} ${compact ? styles.compact : ""}`} data-testid="sickcity-care-choices">{choices.map((choice, index) => <button key={choice.id} type="button" disabled={choice.disabled} data-testid={choice.testId} data-result={choice.result ?? ''} onClick={() => onChoose(choice.id)}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span><strong>{choice.label}</strong>{choice.result === 'correct' ? <Check size={18}/> : choice.result === 'incorrect' ? <X size={18}/> : null}</button>)}</div>;
}
