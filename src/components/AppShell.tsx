import React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export const pageBg =
  "relative min-h-screen w-full overflow-hidden app-background text-slate-950";

export const cardClass =
  "rounded-lg border border-[#c8dcd6] bg-white/90 shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur";

export const mutedCardClass =
  "rounded-lg border border-[#c8dcd6] bg-[#eef7f4]/90 shadow-sm backdrop-blur";

export const inputClass =
  "rounded-md border border-[#b7ccc5] bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 disabled:bg-[#edf3f0] disabled:text-slate-500";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:cursor-not-allowed disabled:opacity-60";

export const darkButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#b7ccc5] bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60";

export const iconButtonClass =
  "grid h-9 w-9 place-items-center rounded-md border border-[#b7ccc5] bg-white/95 text-slate-700 shadow-sm transition hover:border-teal-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200";

export function AppShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${pageBg} ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PageContainer({
  children,
  className = "",
  size = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "normal" | "wide";
}) {
  const maxWidth = size === "wide" ? "max-w-6xl" : "max-w-4xl";

  return (
    <main className={`mx-auto w-full ${maxWidth} px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </main>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#b7d7d0] bg-white/86 p-6 text-slate-950 shadow-[0_18px_38px_rgba(45,86,89,0.12)] backdrop-blur md:flex md:items-end md:justify-between md:gap-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-sky-400 to-emerald-300" />
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-teal-100/50 blur-3xl" />
      <div className="relative max-w-2xl">
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            {Icon ? <Icon size={14} /> : null}
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="relative mt-5 flex flex-wrap gap-2 md:mt-0">{actions}</div> : null}
    </section>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "slate",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "slate" | "teal" | "amber" | "rose";
}) {
  const toneClass = {
    slate: "bg-slate-200 text-slate-800",
    teal: "bg-teal-100 text-teal-800",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-800",
  }[tone];

  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
        </div>
      </div>
      {detail ? <div className="mt-3 text-xs text-slate-500">{detail}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className={`${cardClass} p-8 text-center`}>
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-teal-50 text-teal-700">
        <Icon size={22} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {href && actionLabel ? (
        <Link href={href} className={`${primaryButtonClass} mt-5`}>
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "teal" | "amber" | "rose";
}) {
  const toneClass = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}
