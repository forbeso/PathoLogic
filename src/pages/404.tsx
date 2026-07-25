import Link from "next/link";
import { ArrowRight, BookOpen, Home, SearchX } from "lucide-react";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import {
  AppShell,
  PageContainer,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";

export default function NotFoundPage() {
  return (
    <AppShell>
      <Seo
        title="Page Not Found"
        description="The requested PathoLogix page could not be found."
        path="/404"
        noIndex
      />
      <Header />
      <PageContainer
        size="normal"
        className="grid min-h-[calc(100svh-90px)] place-items-center"
      >
        <section className={`${cardClass} w-full max-w-xl p-7 text-center sm:p-10`}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <SearchX size={26} />
          </span>
          <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Error 404
          </div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            We could not find that page.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            The link may be outdated, or the page may have moved. Head back to
            PathoLogix or continue with a training activity.
          </p>
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Link href="/" className={`${primaryButtonClass} min-h-11`}>
              <Home size={17} />
              Return home
            </Link>
            <Link href="/emtrainer" className={`${secondaryButtonClass} min-h-11`}>
              <BookOpen size={17} />
              Practice scenarios
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
