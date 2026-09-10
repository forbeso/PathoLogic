import { useCallback, useEffect, useRef, useState } from 'react';
export function useDispatchRadio() {
  const [muted, setMuted] = useState(true);
  const context = useRef<AudioContext | null>(null);
  useEffect(() => () => { void context.current?.close(); }, []);
  const play = useCallback((kind: 'dispatch' | 'acknowledge' | 'complete') => {
    if (muted || !context.current) return;
    const audio = context.current;
    void audio.resume().then(() => {
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      tone.type = 'sine'; tone.frequency.value = kind === 'dispatch' ? 740 : kind === 'complete' ? 880 : 520;
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
      tone.connect(gain); gain.connect(audio.destination); tone.start(); tone.stop(audio.currentTime + 0.24);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    }).catch(() => undefined);
  }, [muted]);
  const toggle = () => {
    if (muted) {
      try { context.current ??= new AudioContext(); void context.current.resume(); } catch { return; }
    }
    setMuted(value => !value);
  };
  return { muted, toggle, play };
}
