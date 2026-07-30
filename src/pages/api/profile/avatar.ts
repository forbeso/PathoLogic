import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import { readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function parseAvatar(req: NextApiRequest) {
  return new Promise<File>((resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: MAX_AVATAR_BYTES,
      allowEmptyFiles: false,
      filter: ({ mimetype }) =>
        typeof mimetype === "string" && mimetype in AVATAR_EXTENSIONS,
    });

    form.parse(req, (error, _fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      const upload = Array.isArray(files.avatar)
        ? files.avatar[0]
        : files.avatar;
      if (!upload) {
        reject(new Error("A JPG, PNG, or WebP image is required."));
        return;
      }
      resolve(upload);
    });
  });
}

async function ensureAvatarBucket() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data } = await admin.storage.getBucket(AVATAR_BUCKET);
  if (data) return admin;

  const { error } = await admin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: Object.keys(AVATAR_EXTENSIONS),
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    return null;
  }

  return admin;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  if (
    !enforceRateLimit(req, res, {
      name: "profile-avatar",
      limit: 10,
      windowMs: 60 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  let avatar: File | null = null;
  try {
    avatar = await parseAvatar(req);
    const contentType = avatar.mimetype ?? "";
    const extension = AVATAR_EXTENSIONS[contentType];
    if (!extension || avatar.size > MAX_AVATAR_BYTES) {
      res.status(400).json({
        error: "Choose a JPG, PNG, or WebP image smaller than 5 MB.",
      });
      return;
    }

    const admin = await ensureAvatarBucket();
    if (!admin) {
      res.status(503).json({
        error: "Profile photo uploads are temporarily unavailable.",
      });
      return;
    }

    const objectPath = `${user.id}/avatar-${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = await readFile(avatar.filepath);
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(objectPath, buffer, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });
    if (uploadError) {
      res.status(503).json({
        error: "Profile photo uploads are temporarily unavailable.",
      });
      return;
    }

    const { data } = admin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(objectPath);
    res.status(200).json({ publicUrl: data.publicUrl });
  } catch {
    res.status(400).json({
      error: "Choose a JPG, PNG, or WebP image smaller than 5 MB.",
    });
  } finally {
    if (avatar?.filepath) {
      await unlink(avatar.filepath).catch(() => undefined);
    }
  }
}
