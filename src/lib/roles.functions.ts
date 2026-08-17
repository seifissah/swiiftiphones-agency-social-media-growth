import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Assigns the caller's role server-side. Users can never write to user_roles
 * themselves: the first ever account becomes admin, everyone else customer.
 */
export const claimRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (existing && existing.length) {
      return { isAdmin: existing.some((r) => r.role === "admin") };
    }

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    const isAdmin = (count ?? 0) === 0;

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: isAdmin ? "admin" : "customer" });

    if (isAdmin) {
      await supabaseAdmin.from("profiles").update({ status: "active" }).eq("user_id", userId);
    }

    return { isAdmin };
  });
