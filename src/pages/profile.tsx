import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { reportClientIssue } from "@/lib/telemetry";
import Header from "@/components/Header";
import { Camera, Loader2, UserRound, Archive, ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import Link from "next/link";
import {
  AppShell,
  ErrorState,
  LoadingState,
  PageContainer,
  PageIntro,
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cohort: string | null;
  bio: string | null;
  // role is server-managed; show it but do not edit here
  role?: "student" | "instructor" | "admin";
};

type ProfileNotice = {
  tone: "success" | "error";
  text: string;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<ProfileNotice | null>(null);

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        localStorage.setItem("pathologix:redirect_after_login", "/profile");
        void router.replace("/login");
        return;
      }

      setEmail(sessionData.session.user.email ?? "");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not signed in");

      const appRole = user.app_metadata?.role;
      const role: Profile["role"] =
        appRole === "instructor" || appRole === "admin"
          ? appRole
          : "student";

      setProfile({
        id: user.id,
        full_name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        avatar_url:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
        cohort:
          typeof user.user_metadata?.cohort === "string"
            ? user.user_metadata.cohort
            : null,
        bio:
          typeof user.user_metadata?.bio === "string"
            ? user.user_metadata.bio
            : null,
        role,
      });
    } catch (error) {
      reportClientIssue(error, {
        context: "route_navigation",
        code: "PROFILE_LOAD_FAILED",
        recoverable: true,
      });
      setProfile(null);
      setLoadError(
        "We could not load your learner profile. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // --- Auth gate + load profile
  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          cohort: profile.cohort,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        },
      });
      if (error) throw error;
      setNotice({ tone: "success", text: "Profile saved." });
    } catch {
      setNotice({
        tone: "error",
        text: "We could not save your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    const extension = AVATAR_EXTENSIONS[file.type];
    if (!extension) {
      setNotice({
        tone: "error",
        text: "Choose a JPG, PNG, or WebP image.",
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setNotice({
        tone: "error",
        text: "Choose an image smaller than 5 MB.",
      });
      return;
    }

    try {
      setUploading(true);
      setNotice(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const body = new FormData();
      body.append("avatar", file);
      const uploadResponse = await authenticatedFetch("/api/profile/avatar", {
        method: "POST",
        body,
      });
      const uploadResult = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok || typeof uploadResult?.publicUrl !== "string") {
        throw new Error("Avatar upload failed");
      }
      const avatarUrl = uploadResult.publicUrl;

      const { error: updErr } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
      if (updErr) throw updErr;

      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
      setNotice({ tone: "success", text: "Avatar updated." });
    } catch {
      setNotice({
        tone: "error",
        text: "We could not update your avatar. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Seo
          title="Profile"
          description="Manage your private PathoLogix learner profile."
          path="/profile"
          noIndex
        />
        <Header />
        <PageContainer size="normal" className="space-y-6">
          <PageIntro
            eyebrow="Learner profile"
            title="Profile"
            description="Keep your EMT training context current so your saved work and progress feel personal."
            icon={UserRound}
          />
          <LoadingState
            title="Loading your profile"
            description="Retrieving your learner details and account preferences."
          />
        </PageContainer>
      </AppShell>
    );
  }

  if (loadError || !profile) {
    return (
      <AppShell>
        <Seo
          title="Profile"
          description="Manage your private PathoLogix learner profile."
          path="/profile"
          noIndex
        />
        <Header />
        <PageContainer size="normal" className="space-y-6">
          <PageIntro
            eyebrow="Learner profile"
            title="Profile"
            description="Keep your EMT training context current so your saved work and progress feel personal."
            icon={UserRound}
          />
          <ErrorState
            title="Profile did not load"
            description={
              loadError ??
              "Your learner profile is unavailable right now. Please try again."
            }
            onRetry={() => void loadAccount()}
          />
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Seo
        title="Profile"
        description="Manage your private PathoLogix learner profile."
        path="/profile"
        noIndex
      />
      <Header />

      <PageContainer size="normal" className="space-y-6">
        <PageIntro
          eyebrow="Learner profile"
          title="Profile"
          description="Keep your EMT training context current so your saved work and progress feel personal."
          icon={UserRound}
        />

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6">
          {/* Card */}
          <div className={`${cardClass} p-5`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt="Profile avatar"
                      className="h-24 w-24 rounded-md object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="grid h-24 w-24 place-items-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 text-2xl font-bold">
                      {email ? (email[0] || "U").toUpperCase() : "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs shadow ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    {uploading ? "Uploading" : "Change"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                  />
                </div>

                <div className="max-w-40 text-center text-xs leading-5 text-slate-500">
                  JPG, PNG, or WebP up to 5 MB.
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <input
                    id="profile-email"
                    value={email}
                    disabled
                    className={`${inputClass} mt-1 w-full`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-full-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id="profile-full-name"
                    value={profile?.full_name ?? ""}
                    onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
                    placeholder="Your name"
                    className={`${inputClass} mt-1 w-full`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-cohort"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Cohort
                    </label>
                    <input
                      id="profile-cohort"
                      value={profile?.cohort ?? ""}
                      onChange={(e) => setProfile((p) => (p ? { ...p, cohort: e.target.value } : p))}
                      placeholder="e.g., 68W Fall 2025"
                      className={`${inputClass} mt-1 w-full`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-role"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Role
                    </label>
                    <input
                      id="profile-role"
                      value={profile?.role ?? "student"}
                      disabled
                      className={`${inputClass} mt-1 w-full`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-bio"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    value={profile?.bio ?? ""}
                    onChange={(e) => setProfile((p) => (p ? { ...p, bio: e.target.value } : p))}
                    placeholder="Tell us about your training goals..."
                    rows={4}
                    className={`${inputClass} mt-1 w-full`}
                  />
                </div>

                <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryButtonClass}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </button>
                  {notice ? (
                    <p
                      role={notice.tone === "error" ? "alert" : "status"}
                      className={`rounded-md border px-3 py-2 text-sm font-medium ${
                        notice.tone === "error"
                          ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-400/10 dark:text-rose-200"
                          : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-400/10 dark:text-teal-200"
                      }`}
                    >
                      {notice.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Helpful links */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <Link href="/my-scenarios" className={secondaryButtonClass}>
              <Archive size={16} />
              My Scenarios
            </Link>
            <Link href="/emtrainer" className={secondaryButtonClass}>
              <ArrowLeft size={16} />
              Back to Trainer
            </Link>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
