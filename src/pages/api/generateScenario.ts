import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

// OPTIONAL: server-side supabase client to cache generated scenarios
// Only constructed if you provide SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Cue = { text: string; rationale: string };
type Choice = {
  id: "A" | "B" | "C" | "D";
  text: string;
  correct: boolean;
  why_right?: string;
  why_wrong?: string;
};
type Step = { label: string; detail: string };

type Item = {
  id: string;
  domain: string;
  topic: string;
  vignette: string;
  cues: Cue[];
  question: string;
  choices: Choice[];
  reasoning_steps: Step[];
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
};

function mapTopicToDomain(topic: string): string {
  const t = topic.toLowerCase();
  if (/(airway|respiratory|cardio|endocrine|neuro|sepsis|obstetric|toxic)/.test(t)) return "Medical";
  if (/(trauma|burn|spine|ortho|head|chest|abdominal)/.test(t)) return "Trauma";
  return "Medical";
}

// --- tiny validator to enforce your DB constraints
function validateScenario(s: any) {
  const fail = (msg: string) => {
    throw new Error(`Scenario validation failed: ${msg}`);
  };

  // shape check
  ["vignette", "cues", "question", "choices", "reasoning_steps"].forEach((k) => {
    if (!(k in s)) fail(`missing '${k}'`);
  });
  if (typeof s.vignette !== "string" || s.vignette.length < 40) {
    fail("vignette too short or not a string");
  }
  if (!Array.isArray(s.cues) || s.cues.length < 3) fail("need >= 3 cues");
  s.cues.forEach((c: any, i: number) => {
    if (!c?.text || !c?.rationale) fail(`cue[${i}] missing text/rationale`);
  });

  if (typeof s.question !== "string" || !s.question.trim()) fail("question missing");

  if (!Array.isArray(s.choices) || s.choices.length !== 4) fail("must have exactly 4 choices");
  const ids = s.choices.map((c: any) => c.id);
  if (!["A", "B", "C", "D"].every((id) => ids.includes(id))) {
    fail("choices must have ids A, B, C, D");
  }
  const correctCount = s.choices.filter((c: any) => !!c.correct).length;
  if (correctCount !== 1) fail("exactly one correct choice required");
  s.choices.forEach((c: any) => {
    if (c.correct && !c.why_right) fail("correct answer missing why_right");
    if (!c.correct && !c.why_wrong) fail(`wrong answer ${c.id} missing why_wrong`);
  });

  if (!Array.isArray(s.reasoning_steps) || s.reasoning_steps.length < 3) {
    fail("need >= 3 reasoning_steps");
  }
  s.reasoning_steps.forEach((r: any, i: number) => {
    if (!r?.label || !r?.detail) fail(`reasoning_steps[${i}] missing label/detail`);
  });

  // **hard rule:** every cue.text must appear verbatim in vignette
  const lowerV = s.vignette.toLowerCase();
  for (const c of s.cues) {
    if (!lowerV.includes(String(c.text).toLowerCase())) {
      fail(`cue.text '${c.text}' does not appear verbatim in vignette`);
    }
  }
}

function buildPrompt(topic: string) {
  // Hard instruction: cue.text MUST be verbatim substrings from the vignette.
  return `
You are generating an EMT training MCQ in strict NREMT style for the topic: "${topic}".

Requirements:
- Write ONE realistic vignette (1 concise paragraph, 75–140 words).
- Then produce:
  • 3–5 cues: each { "text": "...", "rationale": "..." }  
    >> IMPORTANT: Each cue.text must appear VERBATIM in the vignette. Choose exact phrases from your vignette.
  • One question string ("What is the MOST appropriate..."/"What is the MOST likely...").
  • EXACTLY 4 choices with ids "A","B","C","D". Exactly one "correct": true; the others "correct": false.
    - For the correct choice, include "why_right".
    - For each incorrect choice, include "why_wrong".
  • 3 reasoning_steps: each { "label": "...", "detail": "..." }.
- Keep exam tone (no protocols by brand name), focus on assessment/priority decisions.
- Difficulty: hard. Two answers should be close to force critical thinking.
- Return JSON ONLY in this shape:

{
  "vignette": "string",
  "cues": [{"text":"string from vignette","rationale":"string"}, ...],
  "question": "string",
  "choices": [
    {"id":"A","text":"string","correct":false,"why_wrong":"string"},
    {"id":"B","text":"string","correct":true,"why_right":"string"},
    {"id":"C","text":"string","correct":false,"why_wrong":"string"},
    {"id":"D","text":"string","correct":false,"why_wrong":"string"}
  ],
  "reasoning_steps": [{"label":"string","detail":"string"}, {"label":"string","detail":"string"}, {"label":"string","detail":"string"}],
  "tags": ["Topic","NREMT"],
  "difficulty": "hard"
}
`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { topic: rawTopic } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const topic = (rawTopic || "Trauma").toString();
    const domain = mapTopicToDomain(topic);

    // 1) Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are an EMT exam item writer following NREMT style." },
        { role: "user", content: buildPrompt(topic) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "";
    // 2) Parse and validate
    let raw: any;
    try {
      raw = JSON.parse(content);
    } catch {
      // Some models may wrap JSON in code fences. Try to extract.
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI did not return valid JSON");
      raw = JSON.parse(match[0]);
    }

    validateScenario(raw);

    // 3) Normalize to your Item shape
    const scenario: Item = {
      id: `gen-${Date.now()}`, // temp id for UI; DB will have its own id if you insert
      domain,
      topic,
      vignette: raw.vignette,
      cues: raw.cues,
      question: raw.question,
      choices: raw.choices,
      reasoning_steps: raw.reasoning_steps,
      tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags.slice(0, 4) : [domain, topic, "NREMT"],
      difficulty: "hard",
    };

    // 4) OPTIONAL: cache it into generated_scenarios with service role
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      // get user from auth header cookie? (client can pass current user id if you want)
      // Safer: do not trust arbitrary user ids from client; cache without user_id or require Auth (advanced).
      // Here we skip user binding unless you pass it explicitly.
      const { userId } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (userId) {
        await supabase.from("generated_scenarios").insert({
          user_id: userId,
          topic: scenario.topic,
          vignette: scenario.vignette,
          cues: scenario.cues,
          question: scenario.question,
          choices: scenario.choices,
          reasoning_steps: scenario.reasoning_steps,
        });
      }
    }

    return res.status(200).json(scenario);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message ?? "Failed to generate scenario" });
  }
}
