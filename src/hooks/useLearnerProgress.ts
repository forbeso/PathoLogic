import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_LEARNER_PROGRESS,
  PROGRESSION_STORAGE_KEY,
  PROGRESSION_UPDATED_EVENT,
  getLearnerProgress,
  getLevelProgress,
  syncLearnerProgress,
  type LearnerProgress,
} from "@/lib/progression";

export function useLearnerProgress() {
  const [progress, setProgress] = useState<LearnerProgress>(EMPTY_LEARNER_PROGRESS);

  useEffect(() => {
    const refresh = () => setProgress(getLearnerProgress());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROGRESSION_STORAGE_KEY) refresh();
    };

    refresh();
    void syncLearnerProgress().then(setProgress);
    window.addEventListener(PROGRESSION_UPDATED_EVENT, refresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PROGRESSION_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const level = useMemo(() => getLevelProgress(progress.totalXp), [progress.totalXp]);

  return { progress, level };
}
