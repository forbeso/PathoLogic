"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Send, CheckCircle2, ChevronRight, Volume2 } from "lucide-react";

type Cue = { text: string; rationale: string };
type Choice = { id: string; text: string; correct: boolean; why_right?: string; why_wrong?: string };
type Step = { label: string; detail: string };
type Item = {
  domain: string; topic: string; vignette: string; cues: Cue[];
  question: string; choices: Choice[]; reasoning_steps: Step[]; tags: string[];
};

type Props = {
  item: Item;
  open: boolean;
  onClose: () => void;
};

const STEP_GROUPS = [
  {
    key: "primary",
    title: "Primary Assessment",
    tasks: [
      "Scene safety & BSI",
      "General impression",
      "AVPU / responsiveness",
      "Airway: patent / adjuncts",
      "Breathing: rate, quality, O₂/ventilate",
      "Circulation: pulse, skin, major bleed control",
      "Priority/Transport decision",
    ],
  },
  {
    key: "secondary",
    title: "Secondary Assessment",
    tasks: [
      "OPQRST for chief complaint",
      "SAMPLE history",
      "Head-to-toe focused exam",
      "Vital signs (repeatable)",
      "Glucose (if indicated)",
    ],
  },
  {
    key: "impression",
    title: "Field Impression",
    tasks: [
      "Synthesize cues",
      "Most likely problem",
      "Rule-in vs rule-out",
    ],
  },
  {
    key: "interventions",
    title: "Interventions",
    tasks: [
      "Immediate life threats addressed",
      "Medications per protocol",
      "Splint/bleeding/O₂/ventilation",
      "Monitor/ECG as indicated",
    ],
  },
  {
    key: "transport",
    title: "Transport",
    tasks: [
      "Destination choice",
      "Urgency & mode",
      "Notify/medical control",
    ],
  },
  {
    key: "reassessment",
    title: "Reassessment",
    tasks: [
        "Initial Assessment",
      "Vitals every 5 (unstable) / 15 (stable)",
      "Exam: Rapid trauma / focused",
      "Interventions",
    ],
  },
] as const;

const KEYWORDS: Record<string, string[]> = {
  "Scene safety & BSI": ["scene safe", "bsi", "ppe", "body substance isolation"],
  "General impression": ["general impression", "look of patient", "sick vs not sick"],
  "AVPU / responsiveness": ["avpu", "alert", "verbal", "pain", "unresponsive"],
  "Airway: patent / adjuncts": ["airway", "opa", "npa", "patent", "suction"],
  "Breathing: rate, quality, O₂/ventilate": ["breathing", "respirations", "oxygen", "o2", "bvm", "ventilate"],
  "Circulation: pulse, skin, major bleed control": ["pulse", "skin", "bleeding", "hemorrhage", "control"],
  "Priority/Transport decision": ["priority", "load and go", "transport decision"],
  "OPQRST for chief complaint": ["opqrst", "onset", "provocation", "quality", "radiation", "severity", "time"],
  "SAMPLE history": ["sample", "signs", "allergies", "medications", "past history", "last oral", "events"],
  "Head-to-toe focused exam": ["head to toe", "focused exam", "palpate", "inspect"],
  "Vital signs (repeatable)": ["vitals", "blood pressure", "pulse", "respirations", "spo2", "temperature"],
  "Glucose (if indicated)": ["glucose", "cbg", "dexi"],
  "Synthesize cues": ["cues", "findings", "pattern"],
  "Most likely problem": ["impression", "most likely", "diagnosis"],
  "Rule-in vs rule-out": ["rule in", "rule out", "differential"],
  "Immediate life threats addressed": ["life threats", "airway", "bleeding control"],
  "Medications per protocol": ["epi", "nitro", "aspirin", "albuterol", "glucose"],
  "Splint/bleeding/O₂/ventilation": ["splint", "pressure", "tourniquet", "oxygen", "ventilation"],
  "Monitor/ECG as indicated": ["monitor", "ecg", "leads"],
  "Destination choice": ["destination", "trauma center", "stroke center"],
  "Urgency & mode": ["urgent", "transport", "lights", "sirens", "priority"],
  "Notify/medical control": ["notify", "radio", "medical control"],
  "Vitals every 5 (unstable) / 15 (stable)": ["reassess", "every 5", "every 15"],
  "Response to interventions": ["response", "improved", "worsened", "unchanged"],
  "Trend changes": ["trend", "trend changes"],
};

export default function AssessmentSidebar({ item, open, onClose }: Props) {
  const [activeKey, setActiveKey] = useState<typeof STEP_GROUPS[number]["key"]>("primary");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [input, setInput] = useState("");
  const [log, setLog] = useState<{ who: "you" | "patient"; text: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);

  // when item changes or open toggles, reset
  useEffect(() => {
    if (open) {
      setLog([
        { who: "patient", text: "The scene is safe. I'm here—ask me anything about what's going on." },
      ]);
    }
  }, [open, item?.vignette]);

  const tasks = useMemo(() => {
    const group = STEP_GROUPS.find((g) => g.key === activeKey)!;
    return group.tasks;
  }, [activeKey]);

  // simple auto-check by keyword match on inbound/outbound text
  const autoCheckFromText = (txt: string) => {
    const t = txt.toLowerCase();
    const upd: Record<string, boolean> = { ...checked };
    Object.entries(KEYWORDS).forEach(([task, words]) => {
      if (upd[task]) return;
      if (words.some((w) => t.includes(w))) {
        upd[task] = true;
      }
    });
    setChecked(upd);
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const sendText = async (message: string) => {
    if (!message.trim()) return;
    setLog((l) => [...l, { who: "you", text: message }]);
    autoCheckFromText(message);

    // call patient API
    const res = await fetch("/api/patient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stage: activeKey,
        vignette: item.vignette,
        cues: item.cues,
      }),
    });
    const data = await res.json();
    const reply = data.reply ?? "…";
    setLog((l) => [...l, { who: "patient", text: reply }]);
    autoCheckFromText(reply);
    speak(reply);
  };

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    mediaRecorderRef.current = rec;
    audioChunksRef.current = [];
    rec.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    rec.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "input.webm");
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      const { text } = await res.json();
      if (text) {
        await sendText(text);
      }
    };
    rec.start();
    setRecording(true);
  };
  const stopRec = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-white/95 p-4 shadow-2xl backdrop-blur "
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">{item.domain} · {item.topic}</div>
              <h3 className="text-lg font-semibold">Assessment Mode</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border bg-white px-2 py-1 text-slate-600 shadow-sm hover:text-red-500 "
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step tabs */}
          <div className="mb-3 flex flex-wrap gap-2">
            {STEP_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveKey(g.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium border shadow-sm ${
                  activeKey === g.key
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="mb-3 h-56 overflow-y-auto rounded-xl border bg-white p-3 text-sm shadow-sm dark:bg-slate-900">
            {log.map((m, i) => (
              <div key={i} className={`mb-2 flex ${m.who === "you" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.who === "you" ? "bg-sky-100 text-slate-900" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input row */}
          <div className="mb-4 flex items-center gap-2">
            {/* <button
              onClick={recording ? stopRec : startRec}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm ${
                recording ? "bg-rose-600 text-white border-rose-600" : "bg-white hover:bg-slate-50"
              }`}
              title={recording ? "Stop recording" : "Hold a conversation (Whisper)"}
              disabled={true}
            >
              {recording ? <MicOff size={16}/> : <Mic size={16} />}
            </button> */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the patient or bystander…"
              className="flex-1 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const msg = input;
                  setInput("");
                  sendText(msg);
                }
              }}
            />
            <button
              onClick={() => { const msg = input; setInput(""); sendText(msg); }}
              className="rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
              title="Send"
            >
              <Send size={16} />
            </button>
            <button
              onClick={() => {
                // repeat last patient line as speech
                const last = [...log].reverse().find((m) => m.who === "patient");
                if (last) speak(last.text);
              }}
              className="rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
              title="Play last response"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl border bg-white p-3 shadow-sm dark:bg-slate-900">
            <div className="mb-2 text-xs font-semibold text-white">{STEP_GROUPS.find(g => g.key === activeKey)?.title} Checklist</div>
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t} className="flex items-center justify-between gap-2 text-white">
                  <span className="text-sm">{t}</span>
                  <button
                    onClick={() => setChecked((c) => ({ ...c, [t]: !c[t] }))}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                      checked[t]
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    title={checked[t] ? "Completed" : "Mark complete"}
                  >
                    {checked[t] && <CheckCircle2 size={14} />}
                    {checked[t] ? "Done" : "Mark"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer hint */}
          <div className="mt-3 text-[11px] text-slate-500">
            Tip: speak naturally (“I’m checking AVPU” or “Do you have allergies?”). Keywords are recognized and checklist auto-updates.
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
