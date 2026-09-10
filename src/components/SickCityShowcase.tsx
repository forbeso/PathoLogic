import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ambulance, ArrowRight, Radio, Stethoscope } from "lucide-react";

const previews = [
  {
    id: "dispatch", label: "Take the call", icon: Radio,
    description: "Review the caller’s report, priority, and location. Choose full clinical calls or quick practice dispatches and accept your assignment.",
    image: "/previews/sickcity/dispatch.jpg",
    alt: "SickCity’s compact dispatch panel beside the medic and ambulance in the hospital garage.",
    caption: "Your shift begins at SickCity Medical’s rear ambulance garage.",
  },
  {
    id: "ambulance", label: "Drive Unit 07", icon: Ambulance,
    description: "Board your ambulance, leave the hospital garage, and follow the street map through connected city neighborhoods.",
    image: "/previews/sickcity/ambulance.jpg",
    alt: "Third-person view of Unit 07 leaving its garage, with the dispatch waypoint, street map, and driving controls visible.",
    caption: "Drive, steer, brake, and park before approaching your patient.",
  },
  {
    id: "patient-care", label: "Make the care decisions", icon: Stethoscope,
    description: "Step out at the scene, assess your patient, and work through care decisions with feedback that explains each priority.",
    image: "/previews/sickcity/patient-care.jpg",
    alt: "SickCity patient assessment showing an altered person’s report and choices for the first care priority.",
    caption: "Patient contact leads into guided assessment and clinical reasoning.",
  },
];

export default function SickCityShowcase() {
  const [selected, setSelected] = useState(0);
  const preview = previews[selected];
  return <section id="sickcity" aria-labelledby="sickcity-heading" className="border-y border-white/10 bg-[#101c25] py-14 text-white sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#b6f582]"><Ambulance size={18} /> Inside SickCity</p>
          <h2 id="sickcity-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">A city to explore. A patient to care for.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Take your EMT practice into the field—from the first dispatch to the decisions you make at the patient’s side.</p>
        </div>
        <Link href="/sickcity" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 self-start rounded-lg bg-[#b6f582] px-5 py-3 text-sm font-bold text-[#17271c] transition hover:bg-[#d0ffa8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b6f582] sm:self-auto">
          Start a SickCity shift <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="SickCity game previews">
          {previews.map((item, index) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" aria-pressed={selected === index} aria-controls="sickcity-preview"
              onClick={() => setSelected(index)}
              className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b6f582] ${selected === index ? "border-[#b6f582]/60 bg-[#b6f582]/10" : "border-white/10 bg-white/[.02] hover:border-white/30 hover:bg-white/5"}`}>
              <span className="flex items-center gap-3"><Icon size={19} className={selected === index ? "text-[#b6f582]" : "text-slate-400"} /><span className="text-sm font-bold">{item.label}</span><span className="ml-auto font-mono text-xs text-slate-500">0{index + 1}</span></span>
              <span className="mt-2 block text-xs leading-5 text-slate-300">{item.description}</span>
            </button>;
          })}
        </div>
        <figure id="sickcity-preview" className="order-first min-w-0 lg:order-none overflow-hidden rounded-xl border border-white/15 bg-[#0b141b] shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400"><span>SickCity · EMT field operations</span><span className="text-[#b6f582]">In-game preview</span></div>
          <Image key={preview.id} src={preview.image} alt={preview.alt} width={1280} height={720} sizes="(min-width: 1152px) 796px, (min-width: 1024px) 70vw, 100vw" className="aspect-video h-auto w-full" />
          <figcaption className="border-t border-white/10 px-4 py-4 text-xs leading-5 text-slate-300" aria-live="polite">{preview.caption}</figcaption>
        </figure>
      </div>
      <p className="mt-5 text-xs text-slate-400">5 full clinical calls + 5 quick practice calls <span className="px-2 text-slate-600">/</span> Drivable ambulance <span className="px-2 text-slate-600">/</span> Guided patient care</p>
    </div>
  </section>;
}
