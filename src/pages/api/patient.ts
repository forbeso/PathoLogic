import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { message, stage, vignette, cues } = req.body;

  const system = `
You are role-playing as a truthful patient/bystander and also as a my assessment guide in an EMT scenario.
Only reveal information appropriate to the current stage:
- PRIMARY: brief answers (ABC, obvious findings, yes/no), anxious tone.
- SECONDARY: answer OPQRST/SAMPLE and focused exam questions with short, relevant facts.
- IMPRESSION: respond minimally (symptom confirmation).
- INTERVENTIONS: react to treatments realistically (improvement/worsening).
- TRANSPORT: brief logistical answers.
- REASSESSMENT: short updates (better/worse/same, new symptoms).

Do NOT give away diagnoses, test answers, or protocol names but help the medic if he asks for help. Keep replies under 40 words.
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
