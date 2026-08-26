import React, { useEffect, useState } from "react";
import { Ambulance, ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/emtrainer", label: "Scenarios" },
  { href: "/focused-exams", label: "Exam Labs" },
  { href: "/exam/nremt", label: "Exam Mode" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/learn", label: "Learn" },
  { href: "/progress", label: "Progress" },
];

export default function Header({
  compactOnLandscape = false,
  darkSurface = false,
}: {
  compactOnLandscape?: boolean;
  darkSurface?: boolean;
}) {
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
    <header className={`${compactOnLandscape ? "compact-landscape-header" : ""} sticky top-0 z-30 border-b px-4 backdrop-blur-xl ${
      darkSurface
        ? "border-slate-700 bg-[#0b1c22]/95 text-slate-50 shadow-[0_10px_28px_rgba(0,0,0,0.3)]"
        : "border-[#c8dcd6] bg-white/88 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[#0b1c22]/95 dark:text-slate-50 dark:shadow-black/30"
    }`}>
      <div className="site-header-inner mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2">
            <span className="site-header-logo grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 shadow-sm">
              <Ambulance size={20} />
            </span>
            <span className={`site-header-name text-xl font-black ${darkSurface ? "text-slate-50" : "text-slate-950 dark:text-slate-50"}`}>PathoLogix</span>
          </Link>

          <nav className="site-header-nav hidden items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentPage(item.href) ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium transition ${
                  isCurrentPage(item.href)
                    ? darkSurface
                      ? "bg-teal-400/15 text-teal-200"
                      : "bg-teal-50 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200"
                    : darkSurface
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-200"
                      : "text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={`site-header-actions flex items-center gap-2 text-sm ${darkSurface ? "text-slate-300" : "text-slate-700"}`}>
          <ThemeToggle />
          <Link
            href="/emtrainer"
            className="site-header-practice hidden items-center gap-2 rounded-md bg-teal-600 px-3 py-2 font-semibold text-white shadow-sm transition hover:bg-teal-500 sm:inline-flex"
          >
            Practice
            <ArrowRight size={15} />
          </Link>
          {!session ? (
            <Link
              href="/login"
              className={`inline-flex rounded-md border px-3 py-2 font-semibold shadow-sm transition ${
                darkSurface
                  ? "border-slate-700 bg-[#102329] text-slate-200 hover:border-teal-500 hover:bg-[#16333a]"
                  : "border-[#b7ccc5] bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-[#16333a]"
              }`}
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
            className={`site-header-menu grid h-11 w-11 place-items-center rounded-md border shadow-sm transition md:hidden ${
              darkSurface
                ? "border-slate-700 bg-[#102329] text-slate-200 hover:border-teal-500 hover:bg-[#16333a]"
                : "border-[#b7ccc5] bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-[#16333a]"
            }`}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          className={`site-header-mobile-nav mx-auto grid max-w-6xl grid-cols-2 gap-2 border-t py-3 md:hidden ${darkSurface ? "border-slate-700" : "border-[#d8e7e2] dark:border-slate-700"}`}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrentPage(item.href) ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-11 items-center rounded-md border px-3 py-2.5 text-sm font-semibold shadow-sm transition ${
                isCurrentPage(item.href)
                  ? darkSurface
                    ? "border-teal-500 bg-teal-400/15 text-teal-200"
                    : "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200"
                  : darkSurface
                    ? "border-slate-700 bg-[#102329] text-slate-300 hover:border-teal-500 hover:bg-[#16333a]"
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
