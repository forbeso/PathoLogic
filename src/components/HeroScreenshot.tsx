/* eslint-disable @next/next/no-img-element */

export default function HeroScreenshot() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-white shadow-2xl shadow-black/30">
      <img
        src="/mock_screen-highlighted.png"
        alt="PathoLogix scenario trainer with key patient details highlighted in yellow to demonstrate clinical cue recognition"
        className="h-auto w-full"
      />
    </div>
  );
}
