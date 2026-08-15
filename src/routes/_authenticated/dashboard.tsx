import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, FileText, Heart, Radio, TrendingUp, Users } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAccounts, useGoals, useMetrics, useReports } from "@/lib/data";
import {
  avgEngagement,
  buildSeries,
  compact,
  filterByRange,
  growth,
  latestPerAccount,
  MONTHS,
  nf,
  PLATFORM_LABEL,
  performanceScore,
  previousPerAccount,
  RANGES,
  scoreBand,
  sumField,
} from "@/lib/platform";
import { GrowthChart } from "@/components/app/GrowthChart";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState, LoadingBlock } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { profile, isAdmin } = useApp();
  const [platform, setPlatform] = useState("all");
  const [range, setRange] = useState("12m");

  const { data: accounts, isLoading: loadingAccounts } = useAccounts(profile?.id);
  const accountIds = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics, isLoading: loadingMetrics } = useMetrics(accountIds);
  const { data: goals } = useGoals(profile?.id);
  const { data: reports } = useReports(profile?.id);

  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? 366;

  const scoped = useMemo(() => {
    const rows = metrics ?? [];
    if (platform === "all") return rows;
    const ids = new Set((accounts ?? []).filter((a) => a.platform === platform).map((a) => a.id));
    return rows.filter((m) => ids.has(m.social_account_id));
  }, [metrics, accounts, platform]);

  const ranged = useMemo(() => filterByRange(scoped, rangeDays), [scoped, rangeDays]);
  const series = useMemo(() => buildSeries(ranged), [ranged]);

  const latest = latestPerAccount(scoped);
  const previous = previousPerAccount(scoped);
  const followers = sumField(latest, "followers");
  const prevFollowers = sumField(previous, "followers");
  const gained = followers - prevFollowers;
  const growthPct = growth(followers, prevFollowers);
  const engagement = avgEngagement(latest);
  const reach = sumField(latest, "reach");
  const impressions = sumField(latest, "impressions");
  const posts = sumField(latest, "posts");
  const views = sumField(latest, "views");

  const score = performanceScore({ growthPct, engagement, reach, posts });
  const band = scoreBand(score);
  const latestReport = (reports ?? [])[0];

  if (isAdmin) {
    return (
      <EmptyState
        title="You're signed in as an administrator"
        description="Head to the admin portal to manage clients, approvals, analytics and reports."
        action={
          <Button asChild className="mt-3">
            <Link to="/admin/dashboard">Open admin dashboard</Link>
          </Button>
        }
      />
    );
  }

  if (loadingAccounts || loadingMetrics) return <LoadingBlock rows={4} />;

  if (!accounts?.length) {
    return (
      <EmptyState
        title="No social accounts connected yet"
        description="Your account manager hasn't added any social profiles to your account. They'll appear here as soon as they do."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Welcome back, {profile?.full_name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's how your social media is performing right now.
          </p>
        </div>
        <div className={cn("panel flex items-center gap-3 px-4 py-3", "sm:min-w-56")}>
          <span className={cn("h-2.5 w-2.5 rounded-full", band.dot)} />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Performance score
            </p>
            <p className="font-display text-lg font-semibold">
              {score}/100 <span className={cn("text-sm font-medium", band.tone)}>{band.label}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total followers"
          value={nf.format(followers)}
          delta={growthPct}
          hint="vs previous period"
          icon={Users}
        />
        <StatCard
          label="Followers gained"
          value={`${gained >= 0 ? "+" : ""}${nf.format(gained)}`}
          hint="latest period"
          icon={TrendingUp}
        />
        <StatCard
          label="Engagement rate"
          value={`${engagement.toFixed(2)}%`}
          hint="average across accounts"
          icon={Heart}
        />
        <StatCard label="Total reach" value={compact(reach)} hint="latest period" icon={Radio} />
        <StatCard label="Impressions" value={compact(impressions)} icon={Eye} />
        <StatCard label="Total posts" value={nf.format(posts)} />
        <StatCard label="Total views" value={compact(views)} />
        <StatCard label="Connected accounts" value={accounts.length} />
      </div>

      <section className="panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Growth overview</h2>
            <p className="text-sm text-muted-foreground">Follower growth over time</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
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
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
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
        </div>
        <div className="mt-5">
          <GrowthChart data={series} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Platform performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const rows = (metrics ?? [])
              .filter((m) => m.social_account_id === account.id)
              .sort((a, b) => a.recorded_on.localeCompare(b.recorded_on));
            const last = rows[rows.length - 1];
            const prev = rows[rows.length - 2] ?? last;
            if (!last) return null;
            const g = growth(last.followers, prev?.followers ?? last.followers);
            return (
              <article key={account.id} className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-base font-semibold">
                      {PLATFORM_LABEL[account.platform] ?? account.platform}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.handle}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      g >= 0 ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {g >= 0 ? "Growing" : "Declining"}
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl font-semibold tabular-nums">
                  {nf.format(last.followers)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {`${last.followers - (prev?.followers ?? last.followers) >= 0 ? "+" : ""}${nf.format(
                    last.followers - (prev?.followers ?? last.followers),
                  )} this period · ${g >= 0 ? "+" : ""}${g.toFixed(1)}%`}
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/60 p-2">
                    <dt className="text-muted-foreground">Engagement</dt>
                    <dd className="font-semibold">{Number(last.engagement_rate).toFixed(1)}%</dd>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <dt className="text-muted-foreground">Posts</dt>
                    <dd className="font-semibold">{last.posts}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <dt className="text-muted-foreground">Views</dt>
                    <dd className="font-semibold">{compact(last.views)}</dd>
                  </div>
                </dl>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link to="/analytics">View analytics</Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Current goals</h2>
          {(goals ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No goals have been set for your account yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {(goals ?? []).slice(0, 3).map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.current_value / Math.max(goal.target_value, 1)) * 100),
                );
                return (
                  <li key={goal.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {PLATFORM_LABEL[goal.platform] ?? goal.platform} {goal.metric}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {nf.format(goal.current_value)} / {nf.format(goal.target_value)}
                      </span>
                    </div>
                    <Progress value={progress} className="mt-2 h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {progress}% complete
                      {goal.deadline ? ` · due ${new Date(goal.deadline).toLocaleDateString()}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Latest monthly report</h2>
          {latestReport ? (
            <div className="mt-3 space-y-3">
              <p className="font-medium">
                {MONTHS[latestReport.month - 1]} {latestReport.year}
              </p>
              <p className="text-sm text-muted-foreground">{latestReport.summary}</p>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Score {latestReport.performance_score}/100 · {latestReport.status}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/reports">View reports</Link>
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No report has been published for your account yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
