"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

import {
  Brain,
  Shuffle,
  Filter,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Header from "./Header";
import {
  AppShell,
  PageContainer,
  PageIntro,
  cardClass,
  inputClass,
  secondaryButtonClass,
  StatusPill,
} from "@/components/AppShell";

/** Types **/
type Flashcard = {
  id: string;
  domain: string;      // e.g. "Airway", "Trauma", "Cardiology"
  topic: string;       // more specific: "COPD", "Tension pneumo"
  front: string;       // prompt / question / stem
  back: string;        // answer / key points
  tags?: string[];     // ["NREMT", "Medical"]
  difficulty?: "Easy" | "Moderate" | "Hard";
};

/** Helpers **/
const domainsFromCards = (cards: Flashcard[]) => {
  const set = new Set<string>();
  cards.forEach((c) => set.add(c.domain));
  return Array.from(set).sort();
};

function difficultyChip(diff?: Flashcard["difficulty"]) {
  switch (diff) {
    case "Easy":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Moderate":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Hard":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function FlashcardTrainer() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domainFilter, setDomainFilter] = useState<string | "All">("All");
  const [shuffleMode, setShuffleMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Load flashcards from Supabase
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("flashcards")
        .select("id, domain, topic, front, back, tags, difficulty")
        .order("domain", { ascending: true });

      if (error) {
        console.error("Failed to load flashcards", error);
        setError("Failed to load flashcards.");
        setCards([]);
      } else {
        const normalized: Flashcard[] = (data ?? []).map((row: any) => ({
          id: row.id,
          domain: row.domain,
          topic: row.topic,
          front: row.front,
          back: row.back,
          tags: row.tags ?? [],
          difficulty:
            row.difficulty === "Easy" ||
            row.difficulty === "Moderate" ||
            row.difficulty === "Hard"
              ? row.difficulty
              : "Moderate",
        }));
        setCards(normalized);
      }

      setLoading(false);
    };

    loadCards();
  }, []);

  const domains = useMemo(() => domainsFromCards(cards), [cards]);

  const filtered = useMemo(() => {
    const base =
      domainFilter === "All"
        ? cards
        : cards.filter((c) => c.domain === domainFilter);

    if (!shuffleMode) return base;
    return [...base].sort(() => Math.random() - 0.5);
  }, [cards, domainFilter, shuffleMode]);

  const total = filtered.length;
  const current = filtered[index] ?? null;

  const goPrev = () => {
    if (!total) return;
    setFlipped(false);
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    if (!total) return;
    setFlipped(false);
    setIndex((prev) => (prev + 1) % total);
  };

  // Loading / empty states
  if (loading) {
    return (
      <AppShell>
        <div className="grid min-h-screen place-items-center">
        <div className={`${cardClass} px-4 py-2 text-sm text-slate-700`}>
          Loading flashcards...
        </div>
      </div>
      </AppShell>
    );
  }

  if (!cards.length) {
    return (
      <AppShell>
        <div className="grid min-h-screen place-items-center px-4">
        <div className={`${cardClass} px-4 py-3 text-sm text-slate-700`}>
          {error
            ? error
            : "No flashcards found yet. Add some in Supabase or build an admin to create decks."}
        </div>
      </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
        <Header/>
      <PageContainer size="normal" className="space-y-5">
        <PageIntro
          eyebrow="Flashcard Lab"
          title="EMT flashcards"
          description="Choose a deck, move at your own pace, and flip each card when you are ready to check the answer."
          icon={Brain}
        />

        <section
          className={`${cardClass} mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between`}
          aria-label="Flashcard deck controls"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value as any);
                  setIndex(0);
                  setFlipped(false);
                }}
                className={`${inputClass} pl-8 text-xs`}
              >
                <option value="All">All domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShuffleMode((s) => !s)}
              className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold ${
                shuffleMode
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <Shuffle size={14} />
              {shuffleMode ? "Shuffled" : "Shuffle"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <BookOpen size={14} className="text-teal-700" />
            {total} {total === 1 ? "card" : "cards"}
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="font-semibold">
              Card {total === 0 ? 0 : index + 1} of {total}
            </span>
            {current?.difficulty && (
              <span
                className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${difficultyChip(
                  current.difficulty
                )}`}
              >
                {current.difficulty}
              </span>
            )}
          </div>

          <div className="grid min-h-[360px] w-full sm:min-h-[430px]">
            <AnimatePresence mode="wait" initial={false}>
              {current ? (
                <motion.button
                  key={`${current.id}-${flipped ? "back" : "front"}`}
                  type="button"
                  initial={{ rotateY: 78, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -78, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onClick={() => setFlipped((value) => !value)}
                  aria-pressed={flipped}
                  aria-label={flipped ? "Show the question" : "Reveal the answer"}
                  className={`col-start-1 row-start-1 min-h-[360px] w-full select-none rounded-lg border p-6 text-left shadow-[0_18px_50px_rgba(15,23,42,0.14)] transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-4 sm:min-h-[430px] sm:p-10 ${
                    flipped
                      ? "border-teal-300 bg-[#edf8f5]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="teal">{current.domain}</StatusPill>
                      <StatusPill>{current.topic}</StatusPill>
                      {current.tags?.slice(0, 2).map((tag) => (
                        <StatusPill key={tag}>{tag}</StatusPill>
                      ))}
                    </div>

                    <div className="flex flex-1 flex-col justify-center py-8 sm:px-6">
                      <div className="text-xs font-bold uppercase text-teal-700">
                        {flipped ? "Answer" : "Question"}
                      </div>
                      <p className="mt-4 whitespace-pre-line text-xl font-semibold leading-relaxed text-slate-950 sm:text-2xl">
                        {flipped ? current.back : current.front}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 border-t border-slate-200/80 pt-4 text-sm font-semibold text-slate-600">
                      <RotateCcw size={16} />
                      {flipped ? "Click to see the question" : "Click to reveal the answer"}
                    </div>
                  </div>
                </motion.button>
              ) : (
                <div className="col-start-1 row-start-1 grid min-h-[360px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500 sm:min-h-[430px]">
                  No cards in this deck yet.
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!total}
              className={`${secondaryButtonClass} min-h-11 disabled:opacity-40`}
              aria-label="Previous flashcard"
            >
              <ChevronLeft size={17} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
                style={{ width: total ? `${((index + 1) / total) * 100}%` : "0%" }}
              />
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={!total}
              className={`${secondaryButtonClass} min-h-11 disabled:opacity-40`}
              aria-label="Next flashcard"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <footer className="mx-auto w-full max-w-4xl pt-1 text-center text-[11px] text-slate-500">
          Built for EMT / med students. Use alongside your textbook, protocols, and formal training - this is a supplement, not a replacement.
        </footer>
      </PageContainer>
    </AppShell>
  );
}
