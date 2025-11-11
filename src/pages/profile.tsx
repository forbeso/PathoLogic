import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Camera, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cohort: string | null;
  bio: string | null;
  // role is server-managed; we’ll show but not edit here
  role?: "student" | "instructor" | "admin";
};

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth gate + load profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (!s) {
        window.location.href = "/login";
        return;
      }
      setSession(s);
      setEmail(s.user.email ?? "");
      await loadProfile();
      setLoading(false);
    });
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, cohort, bio, role")
      .eq("id", user.id)
      .single();
    if (!error && data) setProfile(data as Profile);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          cohort: profile.cohort,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);
      if (error) throw error;
      setMsg("Saved!");
    } catch (err: any) {
      setMsg(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    try {
      setUploading(true);
      setMsg(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Ensure bucket exists in Supabase as 'avatars' with RLS policies you created.
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = pub.publicUrl;

      // Update profile with new avatar URL
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;

      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
      setMsg("Avatar updated.");
    } catch (err: any) {
      setMsg(err.message || "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-10 text-slate-600">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.08),transparent),radial-gradient(900px_500px_at_100%_0,rgba(14,165,233,0.08),transparent)]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

        <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-6">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="h-24 w-24 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-2xl font-bold">
                      {email ? (email[0] || "U").toUpperCase() : "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs shadow ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    {uploading ? "Uploading" : "Change"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                  />
                </div>

                <div className="text-xs text-slate-500">
                  JPG/PNG, square works best.
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={email}
                    disabled
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    value={profile?.full_name ?? ""}
                    onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
                    placeholder="Your name"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cohort</label>
                    <input
                      value={profile?.cohort ?? ""}
                      onChange={(e) => setProfile((p) => (p ? { ...p, cohort: e.target.value } : p))}
                      placeholder="e.g., 68W Fall 2025"
                      className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Role</label>
                    <input
                      value={profile?.role ?? "student"}
                      disabled
                      className="mt-1 w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Bio</label>
                  <textarea
                    value={profile?.bio ?? ""}
                    onChange={(e) => setProfile((p) => (p ? { ...p, bio: e.target.value } : p))}
                    placeholder="Tell us about your training goals…"
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-70"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </button>
                  {msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Helpful links */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <a href="/my-scenarios" className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm hover:bg-slate-50">
              My Scenarios
            </a>
            <a href="/emtrainer" className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm hover:bg-slate-50">
              Back to Trainer
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
