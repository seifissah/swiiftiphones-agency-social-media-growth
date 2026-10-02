import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a private avatars-bucket path to a short-lived signed URL.
 * Accepts either a storage path ("<userId>/file.png") or a full http(s) URL
 * (returned as-is). Returns null while loading or when empty.
 */
export function useAvatarUrl(avatarPath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!avatarPath) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//.test(avatarPath)) {
      setUrl(avatarPath);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 60 * 60)
      .then(({ data, error }) => {
        if (!cancelled) setUrl(error ? null : (data?.signedUrl ?? null));
      });
    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  return url;
}

/** Uploads an avatar image for a user and returns its storage path. */
export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}
