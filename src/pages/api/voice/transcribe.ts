import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "node:fs";
import { OpenAI } from "openai";

export const config = { api: { bodyParser: false } };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });
    const file = files.audio as formidable.File;
    if (!file) return res.status(400).json({ error: "Missing audio" });

    try {
      const stream = fs.createReadStream(file.filepath);
      const transcript = await client.audio.transcriptions.create({
        model: "whisper-1",
        file: stream as any,
      });
      res.json({ text: transcript.text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
