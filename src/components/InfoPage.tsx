import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import Header from "@/components/Header";
import Seo from "@/components/Seo";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  updated?: string;
  children: React.ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  path,
  updated,
  children,
}: InfoPageProps) {
  return (
    <AppShell>
      <Seo title={title} description={description} path={path} />
      <Header />

      <main>
        <section className="border-b border-slate-800 bg-slate-950 text-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <p className="text-sm font-bold text-teal-300">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {description}
            </p>
            {updated ? (
              <p className="mt-5 text-sm text-slate-400">Last updated {updated}</p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_220px] lg:px-8">
          <article className="space-y-9 text-slate-700">{children}</article>

          <aside className="h-fit rounded-lg border border-[#c8dcd6] bg-white/90 p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              PathoLogix
            </p>
            <nav className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              <Link className="rounded-md px-2 py-2 hover:bg-teal-50" href="/privacy">
                Privacy
              </Link>
              <Link className="rounded-md px-2 py-2 hover:bg-teal-50" href="/terms">
                Terms
              </Link>
              <Link className="rounded-md px-2 py-2 hover:bg-teal-50" href="/contact">
                Contact
              </Link>
            </nav>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-600"
            >
              <ArrowLeft size={15} />
              Back to home
            </Link>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 sm:text-base">{children}</div>
    </section>
  );
}

export function InfoList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

export function ContactLink() {
  return (
    <a
      className="inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-600"
      href="mailto:support@pathologix.io"
    >
      <Mail size={16} />
      support@pathologix.io
    </a>
  );
}
