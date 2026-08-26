import { TRIAGE_CATEGORY_META } from "../engine";
import type { TriageCategory } from "../types";

export function TriageCategoryTag({
  category,
  selected = false,
  compact = false,
  shortcut,
  disabled = false,
  onClick,
}: {
  category: TriageCategory;
  selected?: boolean;
  compact?: boolean;
  shortcut?: number;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const meta = TRIAGE_CATEGORY_META[category];
  const isYellow = category === "delayed";
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-sm border font-black ${
          compact ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"
        }`}
        style={{ borderColor: "currentColor" }}
      >
        {meta.icon}
      </span>
      <span className="min-w-0 text-left">
        <span className={`block font-black ${compact ? "text-xs" : "text-sm"}`}>
          {meta.shortLabel}
        </span>
        <span className={`block font-semibold ${compact ? "text-[10px]" : "text-xs"}`}>
          {meta.name}
        </span>
      </span>
      {shortcut && !compact ? (
        <kbd className="ml-auto hidden rounded border border-current/35 px-1.5 py-0.5 text-[10px] font-bold sm:inline">
          {shortcut}
        </kbd>
      ) : null}
    </>
  );
  const className = `relative flex w-full items-center gap-2 overflow-hidden border-2 shadow-md transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${
    compact ? "min-h-10 px-2.5 py-1.5" : "min-h-14 px-3 py-2"
  } ${selected ? "ring-2 ring-white" : "hover:shadow-lg"}`;
  const style = {
    backgroundColor: meta.color,
    borderColor: isYellow ? "#713f12" : "rgba(255,255,255,0.72)",
    color: isYellow ? "#1c1917" : "#ffffff",
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
  };
  const ariaLabel = `${meta.name}, ${meta.colorName} triage category${shortcut ? `, keyboard shortcut ${shortcut}` : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        data-testid={`triage-tag-${category}`}
        disabled={disabled}
        onClick={onClick}
        className={className}
        style={style}
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-label={ariaLabel} className={className} style={style}>
      {content}
    </div>
  );
}
