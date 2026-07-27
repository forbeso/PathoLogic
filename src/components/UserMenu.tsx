import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ChevronDown, LogOut, User, BarChart2 } from "lucide-react";

type Props = {
  email?: string | null;
  avatarUrl?: string | null; // if you later store in profiles
};

export default function UserMenu({ email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeMenu({ restoreFocus = false } = {}) {
      setOpen(false);
      if (restoreFocus) {
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) closeMenu();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!menuRef.current) return;
      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
      );
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      } else if (event.key === "Tab") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = useMemo(() => {
    if (!email) return "U";
    const namePart = email.split("@")[0] || "U";
    const letters = namePart.replace(/[^a-zA-Z]/g, "");
    return letters.slice(0, 2).toUpperCase() || "U";
  }, [email]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setOpen(true);
          window.requestAnimationFrame(() => {
            menuRef.current
              ?.querySelector<HTMLElement>('[role="menuitem"]')
              ?.focus();
          });
        }}
        className="inline-flex items-center gap-2 rounded-md border border-[#b7ccc5] bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm transition hover:border-teal-500 hover:bg-teal-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-account-menu"
        aria-label="Open account menu"
      >
        {/* Avatar */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-50 text-xs font-semibold text-teal-800">
            {initials}
          </span>
        )}
        <span className="hidden sm:inline max-w-[160px] truncate text-slate-700">{email}</span>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id="user-account-menu"
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        >
          <div className="px-3 py-2 text-xs text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{email || "user"}</span>
          </div>
          <div className="h-px bg-slate-100" />
          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <User size={16} className="text-slate-600" />
            Profile
          </Link>
          <Link
            href="/progress"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <BarChart2 size={16} className="text-slate-600" />
            My progress
          </Link>

          <Link
            href="/my-scenarios"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <BarChart2 size={16} className="text-slate-600" />
            My Scenarios
          </Link>
          <div className="h-px bg-slate-100" />
          <button
            role="menuitem"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            <LogOut size={16} className="text-slate-600" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
