import { authenticatedFetch } from "@/lib/authenticatedFetch";

export const PROGRESSION_STORAGE_KEY = "pathologix:learner-progress:v1";
export const PROGRESSION_UPDATED_EVENT = "pathologix:progression-updated";
export const XP_PER_LEVEL = 250;

export type LearnerProgress = {
  version: 1;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  awardedIds: string[];
};

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
};

export type ProgressAward = {
  id: string;
  xp: number;
  eventType: "scenario_objective" | "scenario_complete";
  metadata?: {
    scenarioId?: string;
    objectiveId?: string;
  };
};

export const EMPTY_LEARNER_PROGRESS: LearnerProgress = {
  version: 1,
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  awardedIds: [],
};

function sanitizeProgress(value: unknown): LearnerProgress {
  if (!value || typeof value !== "object") return { ...EMPTY_LEARNER_PROGRESS };

  const candidate = value as Partial<LearnerProgress>;
  const totalXp = Number.isFinite(candidate.totalXp) ? Math.max(0, Math.floor(candidate.totalXp ?? 0)) : 0;
  const currentStreak = Number.isFinite(candidate.currentStreak)
    ? Math.max(0, Math.floor(candidate.currentStreak ?? 0))
    : 0;
  const longestStreak = Number.isFinite(candidate.longestStreak)
    ? Math.max(currentStreak, Math.floor(candidate.longestStreak ?? 0))
    : currentStreak;

  return {
    version: 1,
    totalXp,
    currentStreak,
    longestStreak,
    lastActiveDate: typeof candidate.lastActiveDate === "string" ? candidate.lastActiveDate : null,
    awardedIds: Array.isArray(candidate.awardedIds)
      ? candidate.awardedIds.filter((id): id is string => typeof id === "string").slice(-300)
      : [],
  };
}

export function storeLearnerProgress(progress: LearnerProgress) {
  if (typeof window === "undefined") return;
  const safeProgress = sanitizeProgress(progress);
  window.localStorage.setItem(
    PROGRESSION_STORAGE_KEY,
    JSON.stringify(safeProgress)
  );
  window.dispatchEvent(
    new CustomEvent(PROGRESSION_UPDATED_EVENT, { detail: safeProgress })
  );
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPreviousCalendarDay(previousDateKey: string, currentDate: Date) {
  const [year, month, day] = previousDateKey.split("-").map(Number);
  if (!year || !month || !day) return false;

  const previousDay = new Date(year, month - 1, day, 12);
  previousDay.setDate(previousDay.getDate() + 1);
  return getLocalDateKey(previousDay) === getLocalDateKey(currentDate);
}

function withActivityStreak(progress: LearnerProgress, date: Date): LearnerProgress {
  const today = getLocalDateKey(date);
  if (progress.lastActiveDate === today) return progress;

  const currentStreak = progress.lastActiveDate && isPreviousCalendarDay(progress.lastActiveDate, date)
    ? progress.currentStreak + 1
    : 1;

  return {
    ...progress,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastActiveDate: today,
  };
}

export function getLearnerProgress(): LearnerProgress {
  if (typeof window === "undefined") return { ...EMPTY_LEARNER_PROGRESS };

  try {
    const stored = window.localStorage.getItem(PROGRESSION_STORAGE_KEY);
    return stored ? sanitizeProgress(JSON.parse(stored)) : { ...EMPTY_LEARNER_PROGRESS };
  } catch {
    return { ...EMPTY_LEARNER_PROGRESS };
  }
}

export function awardProgress(award: ProgressAward, date = new Date()) {
  const progress = getLearnerProgress();
  if (!award.id || award.xp <= 0) {
    return { awarded: false, progress };
  }

  const alreadyAwarded = progress.awardedIds.includes(award.id);
  let nextProgress = progress;

  if (!alreadyAwarded) {
    const activeProgress = withActivityStreak(progress, date);
    nextProgress = {
      ...activeProgress,
      totalXp: activeProgress.totalXp + Math.floor(award.xp),
      awardedIds: [...activeProgress.awardedIds, award.id].slice(-300),
    };

    storeLearnerProgress(nextProgress);
  }

  void persistProgressAward(award);

  return { awarded: !alreadyAwarded, progress: nextProgress };
}

async function persistProgressAward(award: ProgressAward) {
  try {
    const response = await authenticatedFetch("/api/progression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "award",
        awardId: award.id,
        eventType: award.eventType,
        metadata: award.metadata ?? {},
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.progress) return;

    const local = getLearnerProgress();
    storeLearnerProgress({
      ...local,
      totalXp: data.progress.totalXp,
      currentStreak: data.progress.currentStreak,
      longestStreak: data.progress.longestStreak,
      lastActiveDate: data.progress.lastActiveDate,
    });
  } catch {
    // Local progression remains available while signed out or temporarily offline.
  }
}

export async function syncLearnerProgress() {
  const local = getLearnerProgress();
  try {
    const response = await authenticatedFetch("/api/progression");
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.persistenceAvailable || !data?.progress) {
      return local;
    }

    let serverProgress = data.progress;
    if (!data.legacyImported) {
      const importResponse = await authenticatedFetch("/api/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import",
          totalXp: local.totalXp,
          currentStreak: local.currentStreak,
          longestStreak: local.longestStreak,
          lastActiveDate: local.lastActiveDate,
        }),
      });
      const imported = await importResponse.json().catch(() => null);
      if (importResponse.ok && imported?.progress) {
        serverProgress = imported.progress;
      }
    }

    const synced: LearnerProgress = {
      ...local,
      totalXp: serverProgress.totalXp,
      currentStreak: serverProgress.currentStreak,
      longestStreak: serverProgress.longestStreak,
      lastActiveDate: serverProgress.lastActiveDate,
    };
    storeLearnerProgress(synced);
    return synced;
  } catch {
    return local;
  }
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    percent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

export function createProgressionRunId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}
