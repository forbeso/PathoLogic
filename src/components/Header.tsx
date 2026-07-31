import React, { useEffect, useState } from "react";
import { Ambulance, ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/emtrainer", label: "Scenarios" },
  { href: "/exam/nremt", label: "Exam Mode" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/learn", label: "Learn" },
  { href: "/progress", label: "Progress" },
];

export default function Header() {
  const router = useRouter();
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      window.requestAnimationFrame(() => {
        document.getElementById("mobile-navigation-toggle")?.focus();
      });
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const isCurrentPage = (href: string) =>
    href === "/"
      ? router.pathname === "/"
      : router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-[#c8dcd6] bg-white/88 px-4 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-[#0b1c22]/95 dark:text-slate-50 dark:shadow-black/30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 shadow-sm">
              <Ambulance size={20} />
            </span>
            <span className="text-xl font-black text-slate-950 dark:text-slate-50">PathoLogix</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentPage(item.href) ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium transition ${
                  isCurrentPage(item.href)
                    ? "bg-teal-50 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200"
                    : "text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ThemeToggle />
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
              className="inline-flex rounded-md border border-[#b7ccc5] bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-[#16333a]"
            >
              Sign in
            </Link>
          ) : (
            <UserMenu
              email={session.user.email}
              isAdmin={session.user.app_metadata?.role === "admin"}
              fullName={
                typeof session.user.user_metadata?.full_name === "string"
                  ? session.user.user_metadata.full_name
                  : null
              }
              avatarUrl={
                typeof session.user.user_metadata?.avatar_url === "string"
                  ? session.user.user_metadata.avatar_url
                  : null
              }
            />
          )}
          <button
            id="mobile-navigation-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-md border border-[#b7ccc5] bg-white text-slate-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-[#16333a] md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="mx-auto grid max-w-6xl grid-cols-2 gap-2 border-t border-[#d8e7e2] py-3 dark:border-slate-700 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrentPage(item.href) ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-11 items-center rounded-md border px-3 py-2.5 text-sm font-semibold shadow-sm transition ${
                isCurrentPage(item.href)
                  ? "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200"
                  : "border-[#c8dcd6] bg-white/80 text-slate-700 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-300 dark:hover:border-teal-500 dark:hover:bg-[#16333a]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
