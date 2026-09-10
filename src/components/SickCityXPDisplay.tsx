import { useEffect, useState } from 'react';
/** Cosmetic count-up only; the progression ledger remains the source of truth. */
export default function SickCityXPDisplay({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return; }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - start) / 450);
      setDisplay(Math.round(value * fraction));
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span aria-label={`+${value} XP`}><span aria-hidden="true">+{display}</span></span>;
}
