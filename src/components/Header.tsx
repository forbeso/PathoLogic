import React, { useEffect, useState } from "react";
import { Ambulance, ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";

const navItems = [
  { href: "/emtrainer", label: "Scenarios" },
  { href: "/exam/nremt", label: "Exam Mode" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/learn", label: "Learn" },
  { href: "/progress", label: "Progress" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
  >(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[#c8dcd6] bg-white/88 px-4 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 shadow-sm">
              <Ambulance size={20} />
            </span>
            <span className="text-xl font-black text-slate-950">PathoLogix</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Link
            href="/emtrainer"
            className="hidden items-center gap-2 rounded-md bg-teal-600 px-3 py-2 font-semibold text-white shadow-sm transition hover:bg-teal-500 sm:inline-flex"
          >
            Practice
            <ArrowRight size={15} />
          </Link>
          {!session ? (
            <Link
              href="/login"
              className="inline-flex rounded-md border border-[#b7ccc5] bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50"
            >
              Sign in
            </Link>
          ) : (
            <UserMenu email={session.user.email} />
          )}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-md border border-[#b7ccc5] bg-white text-slate-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50 md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="mx-auto grid max-w-6xl grid-cols-2 gap-2 border-t border-[#d8e7e2] py-3 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md border border-[#c8dcd6] bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-400 hover:bg-teal-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
