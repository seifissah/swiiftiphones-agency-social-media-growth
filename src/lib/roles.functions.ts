import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Provisions the caller: makes sure a profile row exists (so admins can see and
 * approve the request) and assigns the role server-side. Users can never write
 * to user_roles themselves: the first ever account becomes admin, everyone else
 * customer.
 */
export const claimRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const user = authUser?.user;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const str = (k: string) => {
      const v = meta[k];
      return typeof v === "string" && v.trim() ? v.trim() : null;
    };

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    let isAdmin = (existingRoles ?? []).some((r) => r.role === "admin");

    if (!existingRoles || !existingRoles.length) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      isAdmin = (count ?? 0) === 0;

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: isAdmin ? "admin" : "customer" });
    }

    // Ensure a profile exists. Email-confirmation signups and Google OAuth
    // never had a client session at signup time, so the row is created here.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const email = user?.email ?? "";
      const base =
        str("username") ?? (email ? email.split("@")[0]! : `user-${userId.slice(0, 8)}`);
      let username = base.toLowerCase().replace(/[^a-z0-9._-]/g, "");
      const { data: taken } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (taken) username = `${username}-${userId.slice(0, 4)}`;

      const { data: settings } = await supabaseAdmin
        .from("platform_settings")
        .select("auto_approve")
        .eq("id", 1)
        .maybeSingle();

      const status = isAdmin || settings?.auto_approve ? "active" : "pending";

      const { data: created } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: str("full_name") ?? str("name") ?? email || "New user",
          username,
          email,
          phone: str("phone"),
          company_name: str("company_name"),
          avatar_url: str("avatar_url") ?? str("picture"),
          status,
        })
        .select("id")
        .maybeSingle();

      const handles = meta["handles"];
      if (created && handles && typeof handles === "object") {
        const rows = Object.entries(handles as Record<string, string>)
          .filter(([, v]) => typeof v === "string" && v.trim())
          .map(([platform, handle]) => ({
            customer_id: created.id,
            platform: platform as never,
            handle: handle.trim(),
            data_source: "manual",
          }));
        if (rows.length) await supabaseAdmin.from("social_accounts").insert(rows);
      }
    } else if (isAdmin) {
      await supabaseAdmin.from("profiles").update({ status: "active" }).eq("user_id", userId);
    }

    return { isAdmin };
  });
