import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAccounts, useCustomers, useMetrics } from "@/lib/data";
import {
  PLATFORM_LABEL,
  RANGES,
  buildSeries,
  compact,
  filterByRange,
  growth,
  latestPerAccount,
  nf,
  previousPerAccount,
  sumField,
} from "@/lib/platform";
import { EngagementChart, GrowthChart } from "@/components/app/GrowthChart";
import { StatCard } from "@/components/app/StatCard";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const { data: customers, isLoading } = useCustomers();
  const { data: accounts } = useAccounts();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const [platform, setPlatform] = useState("all");
  const [range, setRange] = useState("12m");

  const days = RANGES.find((r) => r.key === range)?.days ?? 366;

  const scoped = useMemo(() => {
    const rows = metrics ?? [];
    if (platform === "all") return rows;
    const set = new Set((accounts ?? []).filter((a) => a.platform === platform).map((a) => a.id));
    return rows.filter((m) => set.has(m.social_account_id));
  }, [metrics, accounts, platform]);

  const series = useMemo(() => buildSeries(filterByRange(scoped, days)), [scoped, days]);

  const latest = latestPerAccount(scoped);
  const prev = previousPerAccount(scoped);
  const followers = sumField(latest, "followers");
  const overall = growth(followers, sumField(prev, "followers"));

  const byPlatform = useMemo(() => {
    const map = new Map<string, { followers: number; prev: number; reach: number }>();
    for (const a of accounts ?? []) {
      const rows = (metrics ?? []).filter((m) => m.social_account_id === a.id);
      const l = latestPerAccount(rows);
      const p = previousPerAccount(rows);
      const e = map.get(a.platform) ?? { followers: 0, prev: 0, reach: 0 };
      e.followers += sumField(l, "followers");
      e.prev += sumField(p, "followers");
      e.reach += sumField(l, "reach");
      map.set(a.platform, e);
    }
    return [...map.entries()].sort((x, y) => y[1].followers - x[1].followers);
  }, [accounts, metrics]);

  if (isLoading) return <LoadingBlock rows={4} />;

  const platforms = ["all", ...new Set((accounts ?? []).map((a) => a.platform))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform analytics"
        description="Aggregate performance across the entire client portfolio."
      />

      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              platform === p
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {p === "all" ? "All platforms" : PLATFORM_LABEL[p]}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              range === r.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Followers" value={compact(followers)} delta={overall} />
        <StatCard label="Reach" value={compact(sumField(latest, "reach"))} />
        <StatCard label="Impressions" value={compact(sumField(latest, "impressions"))} />
        <StatCard label="Clients" value={customers?.length ?? 0} />
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Follower growth</h2>
        <div className="mt-4">
          <GrowthChart data={series} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Average engagement rate</h2>
        <div className="mt-4">
          <EngagementChart data={series} />
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <div className="border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold">Platform comparison</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-right">Reach</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byPlatform.map(([p, v]) => {
              const g = growth(v.followers, v.prev);
              return (
                <TableRow key={p}>
                  <TableCell>{PLATFORM_LABEL[p] ?? p}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {nf.format(v.followers)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      g >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {g >= 0 ? "+" : ""}
                    {g.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{compact(v.reach)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
