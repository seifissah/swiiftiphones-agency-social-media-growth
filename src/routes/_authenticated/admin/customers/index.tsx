import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { logAudit, useAccounts, useCustomers, useMetrics } from "@/lib/data";
import {
  STATUS_LABEL,
  STATUS_TONE,
  growth,
  initials,
  latestPerAccount,
  nf,
  previousPerAccount,
  sumField,
} from "@/lib/platform";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/customers/")({
  component: AdminCustomers,
});

const STATUSES = ["all", "pending", "active", "rejected", "suspended"];

function AdminCustomers() {
  const { profile } = useApp();
  const qc = useQueryClient();
  const { data: customers, isLoading } = useCustomers();
  const { data: accounts } = useAccounts();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    return (customers ?? [])
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) =>
        q.trim()
          ? [c.full_name, c.email, c.username, c.company_name ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q.trim().toLowerCase())
          : true,
      )
      .map((c) => {
        const accIds = new Set(
          (accounts ?? []).filter((a) => a.customer_id === c.id).map((a) => a.id),
        );
        const scoped = (metrics ?? []).filter((m) => accIds.has(m.social_account_id));
        const f = sumField(latestPerAccount(scoped), "followers");
        const pf = sumField(previousPerAccount(scoped), "followers");
        return { c, accounts: accIds.size, followers: f, growthPct: growth(f, pf) };
      });
  }, [customers, accounts, metrics, q, status]);

  async function setStatusFor(id: string, name: string, next: string) {
    const { error } = await supabase.from("profiles").update({ status: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      adminName: profile?.full_name ?? "Admin",
      action: `set status to ${next}`,
      customerId: id,
      customerName: name,
    });
    toast.success(`${name} is now ${next}.`);
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
  }

  if (isLoading) return <LoadingBlock rows={4} />;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search, filter and manage every client account on the platform."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, username or company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                status === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Accounts</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ c, accounts: n, followers, growthPct }) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                      {initials(c.full_name)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to="/admin/customers/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:underline"
                      >
                        {c.full_name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      STATUS_TONE[c.status],
                    )}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{n}</TableCell>
                <TableCell className="text-right tabular-nums">{nf.format(followers)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    growthPct >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {growthPct >= 0 ? "+" : ""}
                  {growthPct.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {c.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatusFor(c.id, c.full_name, "suspended")}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatusFor(c.id, c.full_name, "active")}
                      >
                        Activate
                      </Button>
                    )}
                    <Button asChild size="sm">
                      <Link to="/admin/customers/$id" params={{ id: c.id }}>
                        View
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No customers match this filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
