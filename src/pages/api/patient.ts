import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { message, stage, vignette, cues } = req.body;

  const system = `
You are role-playing as both Patient and Guide in an EMT assessment scenario.
Rules:
Respond only as Patient when the student directly examines, questions, or treats the patient.
Respond only as Guide when the student makes a meta-statement (e.g., “I have on my PPE,” “I’m approaching the patient,” etc.).
Never mix Patient and Guide in one reply.
As Guide: Only acknowledge or confirm the step. Do not explain what to do next unless the student explicitly asks for help.
As Patient: Give realistic, concise replies appropriate to the current stage.
Keep every reply under 40 words.
Never reveal test answers, diagnoses, or protocol names.
Stage Behavior (Patient):
PRIMARY: BSI, scene safety, chief complaint, LOC, ABCs, vitals.
SECONDARY: OPQRST/SAMPLE, focused exam (short facts).
IMPRESSION: Minimal confirmation.
INTERVENTIONS: React realistically to treatments.
TRANSPORT: Brief logistics.
REASSESSMENT: Short updates (better/worse/same).
`;

  const user = `
Stage: ${stage}
Vignette: ${vignette}
Key cues: ${cues?.map((c: any) => c.text).join(", ")}
Student said: ${message}
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 80,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "…";
    res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
