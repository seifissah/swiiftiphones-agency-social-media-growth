import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { uploadAvatar, useAvatarUrl } from "@/lib/avatar";
import { initials } from "@/lib/platform";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: 'Your Profile | Swiiftiphones Agency' }, { name: "description", content: 'Manage your profile on the Swiiftiphones Agency social media growth platform.' }, { property: "og:title", content: 'Your Profile | Swiiftiphones Agency' }, { property: "og:description", content: 'Manage your profile on the Swiiftiphones Agency social media growth platform.' }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh, userId } = useApp();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    company_name: profile?.company_name ?? "",
    bio: profile?.bio ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadAvatar(userId, file);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", profile.id);
      if (error) throw new Error(error.message);
      toast.success("Profile picture updated.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
    refresh();
  }

  return (
    <div>
      <PageHeader title="Profile" description="Keep your contact details up to date." />
      <form onSubmit={save} className="panel max-w-2xl space-y-4 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xl font-semibold text-muted-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
            ) : (
              initials(profile?.full_name ?? "?")
            )}
          </span>
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : "Change picture"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB.</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickAvatar}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={busy}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
