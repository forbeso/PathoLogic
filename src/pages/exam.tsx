import { useEffect, useState } from "react";
import ExamModeDialog from "@/components/ExamModeDialog";

export default function ExamPage() {
  const [item, setItem] = useState<any | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pathologix:exam:handoff");
      if (raw) {
        const parsed = JSON.parse(raw);
        setItem(parsed.item ?? null);
      }
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  if (!item) {
    return (
      <div className="grid min-h-screen place-items-center px-4 bg-slate-50">
        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-6 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-900">No exam loaded</div>
          <p className="mt-1 text-sm text-slate-600">
            Open NREMT-style Exam Mode from a scenario to launch this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Use the same component but forced open & full-screen container */}
      <ExamModeDialog open={true} onClose={() => window.close()} item={item} />
    </div>
  );
}
