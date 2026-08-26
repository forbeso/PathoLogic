import Link from "next/link";
import { Bone, Brain, Hand, PersonStanding } from "lucide-react";

export type FocusedLabId = "ankle" | "knee" | "wrist-hand" | "neuro";

const focusedLabs = [
  { id: "ankle" as const, label: "Ankle & foot", href: "/focused-exams/ankle", icon: Bone },
  { id: "knee" as const, label: "Knee", href: "/focused-exams/knee", icon: PersonStanding },
  { id: "wrist-hand" as const, label: "Wrist & hand", href: "/focused-exams/wrist-hand", icon: Hand },
  { id: "neuro" as const, label: "Focused neuro", href: "/focused-exams/neuro", icon: Brain },
];

export default function FocusedLabSwitcher({ activeLab }: { activeLab: FocusedLabId }) {
  return (
    <nav aria-label="Switch focused exam lab" className="mt-3 overflow-x-auto pb-0.5">
      <div className="flex min-w-max gap-1.5" role="list">
        {focusedLabs.map((lab) => {
          const Icon = lab.icon;
          const active = lab.id === activeLab;
          return (
            <Link
              key={lab.id}
              href={lab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                active
                  ? "border-teal-300 bg-teal-300 text-slate-950 shadow-sm"
                  : "border-white/12 bg-white/[0.045] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {lab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
