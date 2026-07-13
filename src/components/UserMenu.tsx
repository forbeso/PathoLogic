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

  // useEffect(() => {
  //   function onDocClick(e: MouseEvent) {
  //     if (!menuRef.current) return;
  //     if (!menuRef.current.contains(e.target as Node)) setOpen(false);
  //   }
  //   function onEsc(e: KeyboardEvent) {
  //     if (e.key === "Escape") setOpen(false);
  //   }
  //   document.addEventListener("mousedown", onDocClick);
  //   document.addEventListener("keydown", onEsc);
  //   return () => {
  //     document.removeEventListener("mousedown", onDocClick);
  //     document.removeEventListener("keydown", onEsc);
  //   };
  // }, []);

  const initials = useMemo(() => {
    if (!email) return "U";
    const namePart = email.split("@")[0] || "U";
    const letters = namePart.replace(/[^a-zA-Z]/g, "");
    return letters.slice(0, 2).toUpperCase() || "U";
  }, [email]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-md border border-[#b7ccc5] bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm transition hover:border-teal-500 hover:bg-teal-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="avatar"
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
