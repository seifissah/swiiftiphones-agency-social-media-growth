import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { logAudit, notify, useCustomers } from "@/lib/data";
import { initials } from "@/lib/platform";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: Approvals,
});

function Approvals() {
  const { profile } = useApp();
  const qc = useQueryClient();
  const { data: customers, isLoading } = useCustomers();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const pending = (customers ?? []).filter((c) => c.status === "pending");

  async function decide(id: string, name: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase
      .from("profiles")
      .update({ status: approve ? "active" : "rejected" })
      .eq("id", id);
    if (notes[id]) {
      await supabase
        .from("profile_admin_notes")
        .upsert({ profile_id: id, notes: notes[id], updated_at: new Date().toISOString() });
    }

    if (error) {
      setBusy(null);
      toast.error(error.message);
      return;
    }
    await notify(
      id,
      approve ? "Account approved" : "Account request declined",
      approve
        ? "Your account has been approved. You now have full access to your dashboard."
        : (notes[id] ?? "Your access request was declined. Contact your account manager for details."),
      approve ? "success" : "warning",
    );
    await logAudit({
      adminName: profile?.full_name ?? "Admin",
      action: approve ? "approved customer" : "rejected customer",
      customerId: id,
      customerName: name,
      details: notes[id] ?? "",
    });
    setBusy(null);
    toast.success(approve ? `${name} approved.` : `${name} rejected.`);
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
  }

  if (isLoading) return <LoadingBlock rows={3} />;

  return (
    <div>
      <PageHeader
        title="Pending approvals"
        description="Review access requests before customers can see their dashboard."
      />
      {!pending.length ? (
        <EmptyState title="Nothing to review" description="Every access request has a decision." />
      ) : (
        <div className="space-y-4">
          {pending.map((c) => (
            <article key={c.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-sm font-semibold">
                    {initials(c.full_name)}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold">{c.full_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {c.email} · @{c.username}
                    </p>
                    {c.company_name ? (
                      <p className="text-sm text-muted-foreground">{c.company_name}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busy === c.id}
                    onClick={() => decide(c.id, c.full_name, false)}
                  >
                    Reject
                  </Button>
                  <Button disabled={busy === c.id} onClick={() => decide(c.id, c.full_name, true)}>
                    Approve
                  </Button>
                </div>
              </div>
              {c.bio ? <p className="mt-4 text-sm text-muted-foreground">{c.bio}</p> : null}
              <Textarea
                className="mt-4"
                rows={2}
                placeholder="Optional note shared with the customer on rejection…"
                value={notes[c.id] ?? ""}
                onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
