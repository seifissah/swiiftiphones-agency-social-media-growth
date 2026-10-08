import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Readable one-time code, e.g. SWF-7K4M-Q9TX (no confusing 0/O/1/I). */
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const s = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `SWF-${s.slice(0, 4)}-${s.slice(4)}`;
}

/**
 * Admin-only: issues a temporary access code that becomes the client's
 * password. The client must choose a new password right after signing in.
 */
export const issueAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { profileId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .eq("id", data.profileId)
      .maybeSingle();
    if (!profile?.user_id) throw new Error("This client has no login account yet.");

    const code = makeCode();
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      password: code,
      email_confirm: true,
      user_metadata: { ...(u?.user?.user_metadata ?? {}), must_change_password: true },
    });
    if (error) throw new Error(error.message);
    return { code, email: profile.email };
  });

/** Clears the "must change password" flag after the user sets a new one. */
export const clearPasswordFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      user_metadata: { ...(u?.user?.user_metadata ?? {}), must_change_password: false },
    });
    return { ok: true };
  });
