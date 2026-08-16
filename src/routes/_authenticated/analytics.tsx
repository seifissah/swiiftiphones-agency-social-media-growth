import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import { useAccounts, useMetrics } from "@/lib/data";
import {
  PLATFORM_LABEL,
  RANGES,
  buildSeries,
  compact,
  filterByRange,
  growth,
  nf,
} from "@/lib/platform";
import { EngagementChart, GrowthChart } from "@/components/app/GrowthChart";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
});

function Analytics() {
  const { profile } = useApp();
  const [platform, setPlatform] = useState("all");
  const [range, setRange] = useState("6m");

  const { data: accounts, isLoading } = useAccounts(profile?.id);
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);

  const days = RANGES.find((r) => r.key === range)?.days ?? 183;
  const scoped = useMemo(() => {
    const rows = metrics ?? [];
    if (platform === "all") return rows;
    const set = new Set((accounts ?? []).filter((a) => a.platform === platform).map((a) => a.id));
    return rows.filter((m) => set.has(m.social_account_id));
  }, [metrics, accounts, platform]);

  const ranged = useMemo(() => filterByRange(scoped, days), [scoped, days]);
  const series = useMemo(() => buildSeries(ranged), [ranged]);

  const history = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; followers: number; reach: number; impressions: number; eng: number; n: number }
    >();
    for (const m of ranged) {
      const e = byDate.get(m.recorded_on) ?? {
        date: m.recorded_on,
        followers: 0,
        reach: 0,
        impressions: 0,
        eng: 0,
        n: 0,
      };
      e.followers += m.followers;
      e.reach += m.reach;
      e.impressions += m.impressions;
      e.eng += Number(m.engagement_rate);
      e.n += 1;
      byDate.set(m.recorded_on, e);
    }
    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [ranged]);

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!accounts?.length) {
    return (
      <EmptyState
        title="Nothing to analyse yet"
        description="Once your social accounts are connected, growth analytics appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth analytics"
        description="Compare follower growth and engagement across platforms and time ranges."
      />

      <div className="flex flex-wrap items-center gap-2">
        {["all", ...new Set(accounts.map((a) => a.platform))].map((p) => (
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

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Followers</h2>
        <div className="mt-4">
          <GrowthChart data={series} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Engagement rate</h2>
        <div className="mt-4">
          <EngagementChart data={series} />
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold">Historical snapshots</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated across {platform === "all" ? "all platforms" : PLATFORM_LABEL[platform]}
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Followers</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row, i) => {
                const prev = history[i + 1];
                const g = prev ? growth(row.followers, prev.followers) : 0;
                return (
                  <TableRow key={row.date}>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {nf.format(row.followers)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        g >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {prev ? `${g >= 0 ? "+" : ""}${g.toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{compact(row.reach)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {compact(row.impressions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(row.eng / Math.max(row.n, 1)).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
