"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

import {
  Brain,
  Shuffle,
  Filter,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Header from "./Header";

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

  // tracking mastery in-session
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());

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

  const masteredCount = masteredIds.size;
  const seenCount = seenIds.size;
  const reviewCount = reviewIds.size;

  const handleMark = (type: "got-it" | "again") => {
    if (!current) return;

    setSeenIds((prev) => new Set(prev).add(current.id));
    setFlipped(false);

    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (type === "got-it") next.add(current.id);
      if (type === "again") next.delete(current.id);
      return next;
    });

    setReviewIds((prev) => {
      const next = new Set(prev);
      if (type === "again") next.add(current.id);
      if (type === "got-it") next.delete(current.id);
      return next;
    });

    const nextIndex = index + 1;
    if (nextIndex < total) {
      setIndex(nextIndex);
    }
  };

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

  const resetSession = () => {
    setSeenIds(new Set());
    setMasteredIds(new Set());
    setReviewIds(new Set());
    setIndex(0);
    setFlipped(false);
  };

  const masteryPercent =
    total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  let masteryLabel = "Just getting started";
  let masteryDetail =
    "Keep flipping cards. Aim for mastery on high-yield airway, breathing, circulation, and trauma content.";
  if (masteryPercent >= 85) {
    masteryLabel = "Exam-ready in this deck";
    masteryDetail =
      "You’re retaining most of this content. Now mix in timed NREMT exam mode and scenario work.";
  } else if (masteryPercent >= 65) {
    masteryLabel = "Solid progress";
    masteryDetail =
      "You’ve got a handle on a lot of this. Target cards marked “Again” and trauma/airway weak spots.";
  } else if (masteryPercent >= 40) {
    masteryLabel = "Foundation building";
    masteryDetail =
      "Reps matter. Use these cards alongside scenarios and pathophys breakdowns for deeper retention.";
  }

  // Loading / empty states
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 text-sm shadow-sm">
          Loading flashcards…
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
        
        <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-700 text-sm shadow-sm">
          {error
            ? error
            : "No flashcards found yet. Add some in Supabase or build an admin to create decks."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4">
        <Header/>
      <div className="mx-auto max-w-4xl space-y-6 mt-5">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Brain size={14} />
              NREMT Flashcard Lab
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              High-yield EMT flashcards
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Rapid-fire cards based on core EMS concepts so you can prep for{" "}
              <span className="font-semibold text-emerald-700">NREMT</span> and{" "}
              <span className="font-semibold text-emerald-700">other exams</span>{" "}
              without drowning in the textbook.
            </p>
          </div>

          <div className="space-y-2 text-right">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Deck mastery
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  style={{ width: `${masteryPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {masteryPercent}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {masteredCount} mastered • {reviewCount} to review
            </div>
          </div>
        </header>

        {/* Controls */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value as any);
                  setIndex(0);
                  setFlipped(false);
                }}
                className="bg-transparent text-xs text-slate-800 focus:outline-none"
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
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                shuffleMode
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <Shuffle size={14} />
              {shuffleMode ? "Shuffling" : "Order by deck"}
            </button>

            <button
              type="button"
              onClick={resetSession}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={14} />
              Reset session
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:justify-end">
            <div className="flex flex-col text-right">
              <span>
                Seen:{" "}
                <span className="font-semibold text-slate-900">{seenCount}</span>
              </span>
              <span>
                Total in deck:{" "}
                <span className="font-semibold text-slate-900">{total}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Card + actions */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Flashcard */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border border-slate-200">
                <BookOpen size={12} />
                <span>
                  Card {total === 0 ? 0 : index + 1} / {total || 0}
                </span>
              </div>

              {current && current.difficulty && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${difficultyChip(
                    current.difficulty
                  )}`}
                >
                  Difficulty: {current.difficulty}
                </span>
              )}
            </div>

            <div className="relative h-64 w-full cursor-pointer select-none">
              <AnimatePresence mode="wait" initial={false}>
                {current ? (
                  <motion.div
                    key={current.id + String(flipped)}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setFlipped((f) => !f)}
                    className="absolute inset-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-md"
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                            {current.domain}
                          </span>
                          <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                            {current.topic}
                          </span>
                          {current.tags?.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                          {flipped ? "Answer / Key points" : "Prompt"}
                        </h2>
                        <p className="mt-1 text-base leading-relaxed text-slate-900 whitespace-pre-line">
                          {flipped ? current.back : current.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Tap to flip card</span>
                        <span className="font-medium text-emerald-700">
                        Built for NREMT participants
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                    No cards in this deck yet.
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Know / Don't know buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!total}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!total}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMark("again")}
                  disabled={!current}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                >
                  <X size={14} />
                  Again / Not yet
                </button>
                <button
                  type="button"
                  onClick={() => handleMark("got-it")}
                  disabled={!current}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                >
                  <CheckCircle2 size={14} />
                  Got it
                </button>
              </div>
            </div>
          </div>

          {/* Right side: feedback + tips */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Session snapshot
              </div>
              <div className="mt-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Mastered this deck</span>
                  <span className="font-semibold text-emerald-600">
                    {masteryPercent}%
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Seen cards</span>
                  <span>{seenCount}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Marked &quot;Again&quot;</span>
                  <span>{reviewCount}</span>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {masteryLabel}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {masteryDetail}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                How to use this for NREMT
              </div>
              <ul className="list-disc space-y-1 pl-4">
                <li>Warm up with 10–15 cards, then jump into timed NREMT exam mode.</li>
                <li>Notice patterns: airway, shock, and chest pain show up a lot.</li>
              </ul>
            </div>
          </aside>
        </section>

        <footer className="pt-2 text-[11px] text-slate-500">
          Built for EMT / med students. Use alongside your textbook, protocols, and formal training — this is a supplement, not a replacement.
        </footer>
      </div>
    </div>
  );
}
