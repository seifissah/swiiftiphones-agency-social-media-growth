import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { useAccounts, useAuditLogs, useCustomers, useMetrics } from "@/lib/data";
import {
  PLATFORM_LABEL,
  buildSeries,
  compact,
  filterByRange,
  growth,
  initials,
  latestPerAccount,
  nf,
  performanceScore,
  previousPerAccount,
  scoreBand,
  sumField,
} from "@/lib/platform";
import { GrowthChart } from "@/components/app/GrowthChart";
import { StatCard } from "@/components/app/StatCard";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: customers, isLoading } = useCustomers();
  const { data: accounts } = useAccounts();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const { data: audit } = useAuditLogs();

  const pending = (customers ?? []).filter((c) => c.status === "pending");
  const active = (customers ?? []).filter((c) => c.status === "active");

  const latest = latestPerAccount(metrics ?? []);
  const previous = previousPerAccount(metrics ?? []);
  const followers = sumField(latest, "followers");
  const prevFollowers = sumField(previous, "followers");
  const overallGrowth = growth(followers, prevFollowers);

  const series = useMemo(() => buildSeries(filterByRange(metrics ?? [], 366)), [metrics]);

  const ranking = useMemo(() => {
    return (customers ?? [])
      .filter((c) => c.status === "active")
      .map((c) => {
        const accIds = new Set(
          (accounts ?? []).filter((a) => a.customer_id === c.id).map((a) => a.id),
        );
        const rows = (metrics ?? []).filter((m) => accIds.has(m.social_account_id));
        const last = latestPerAccount(rows);
        const prev = previousPerAccount(rows);
        const f = sumField(last, "followers");
        const pf = sumField(prev, "followers");
        const g = growth(f, pf);
        const score = performanceScore({
          growthPct: g,
          engagement: last.length
            ? sumField(last, "engagement_rate") / last.length
            : 0,
          reach: sumField(last, "reach"),
          posts: sumField(last, "posts"),
        });
        return { customer: c, followers: f, growthPct: g, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [customers, accounts, metrics]);

  const platformTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts ?? []) {
      const rows = latestPerAccount((metrics ?? []).filter((m) => m.social_account_id === a.id));
      map.set(a.platform, (map.get(a.platform) ?? 0) + sumField(rows, "followers"));
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [accounts, metrics]);

  if (isLoading) return <LoadingBlock rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin overview"
        description="Portfolio-wide performance across every client account."
        actions={
          pending.length ? (
            <Button asChild>
              <Link to="/admin/approvals">Review {pending.length} pending</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total customers" value={customers?.length ?? 0} icon={Users} />
        <StatCard label="Active customers" value={active.length} icon={Activity} />
        <StatCard label="Pending approvals" value={pending.length} icon={ShieldAlert} />
        <StatCard
          label="Followers tracked"
          value={compact(followers)}
          delta={overallGrowth}
          hint="vs previous period"
          icon={TrendingUp}
        />
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Portfolio follower growth</h2>
        <p className="text-sm text-muted-foreground">All clients, all platforms, last 12 months</p>
        <div className="mt-4">
          <GrowthChart data={series} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Top performers</h2>
          <ul className="mt-4 space-y-3">
            {ranking.slice(0, 6).map((r, i) => {
              const band = scoreBand(r.score);
              return (
                <li key={r.customer.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {initials(r.customer.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/admin/customers/$id"
                      params={{ id: r.customer.id }}
                      className="block truncate font-medium hover:underline"
                    >
                      {r.customer.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {nf.format(r.followers)} followers · {r.growthPct >= 0 ? "+" : ""}
                      {r.growthPct.toFixed(1)}%
                    </p>
                  </div>
                  <span className={cn("text-sm font-semibold", band.tone)}>{r.score}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Followers by platform</h2>
          <ul className="mt-4 space-y-3">
            {platformTotals.map(([platform, total]) => {
              const max = platformTotals[0]?.[1] || 1;
              return (
                <li key={platform}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{PLATFORM_LABEL[platform] ?? platform}</span>
                    <span className="tabular-nums text-muted-foreground">{compact(total)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((total / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent admin activity</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/audit">View all</Link>
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {(audit ?? []).slice(0, 8).map((a) => (
            <li key={a.id} className="flex justify-between gap-4 border-b border-border pb-2">
              <span>
                <span className="font-medium">{a.admin_name ?? "Admin"}</span> {a.action}
                {a.target_customer_name ? ` · ${a.target_customer_name}` : ""}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
          {!audit?.length ? <li className="text-muted-foreground">No activity yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
