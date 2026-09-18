export type WorldCareTarget = {
  id: string; label: string; anchor: 'head' | 'chest' | 'hand' | 'bag' | 'patient';
  selected?: boolean; onSelect: () => void; onClose: () => void;
  choices: {id: string; label: string; testId?: string; disabled?: boolean; result?: 'correct'|'incorrect'}[];
  prompt?: string; next?: {label: string; onClick: () => void};
  onChoose: (id: string) => void; feedback?: string;
};
export function careAnchor(id: string): WorldCareTarget['anchor'] {
  if (/bag|equipment|bp|pulseox/.test(id)) return 'bag';
  if (/airway|history|impression/.test(id)) return 'head';
  if (/breathing|chest/.test(id)) return 'chest';
  if (/pulse|circulation/.test(id)) return 'hand';
  return 'patient';
}

/** Only successful clinical actions reveal equipment and readings in the city. */
export type WorldCareEquipment = {
  bagOpen: boolean;
  oxygenApplied: boolean;
  bloodPressure?: string;
  spo2?: number;
  pulse?: number;
  treated: boolean;
};
