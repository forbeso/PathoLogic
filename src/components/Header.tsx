import React from "react";
import {
  Check,
  X,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Highlighter,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Ambulance
} from "lucide-react";
import Link from "next/link";


export default function Header() {
    return (
        
    <header className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" passHref>
        <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-sm">
            <Ambulance size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            PathoLogix
            </h1>
            {/* <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Beta
            </span> */}
        </div>
         </Link>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            {/* <span className="rounded-full bg-slate-100 px-3 py-1">
            {item.domain}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
            {item.topic}
            </span> */}
            
        </div>
        </div>
                    
    </header>
   
    )
}
