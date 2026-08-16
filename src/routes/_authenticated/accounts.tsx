import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "@/lib/app-context";
import { useAccounts, useMetrics } from "@/lib/data";
import { PLATFORM_LABEL, compact, growth, nf } from "@/lib/platform";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/accounts")({
  component: MyAccounts,
});

function MyAccounts() {
  const { profile } = useApp();
  const { data: accounts, isLoading } = useAccounts(profile?.id);
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);

  if (isLoading) return <LoadingBlock rows={3} />;

  return (
    <div>
      <PageHeader
        title="My social accounts"
        description="Every profile your account manager is tracking, with its latest recorded snapshot."
      />
      {!accounts?.length ? (
        <EmptyState
          title="No accounts connected"
          description="Ask your account manager to add your social profiles."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((a) => {
            const rows = (metrics ?? [])
              .filter((m) => m.social_account_id === a.id)
              .sort((x, y) => x.recorded_on.localeCompare(y.recorded_on));
            const last = rows[rows.length - 1];
            const prev = rows[rows.length - 2] ?? last;
            const g = last ? growth(last.followers, prev?.followers ?? last.followers) : 0;
            return (
              <article key={a.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {PLATFORM_LABEL[a.platform] ?? a.platform}
                    </h2>
                    <p className="text-sm text-muted-foreground">{a.handle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={a.connection_status === "connected" ? "default" : "secondary"}>
                      {a.connection_status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {a.data_source === "api" ? "API sync" : "Manual entry"}
                    </span>
                  </div>
                </div>

                {last ? (
                  <>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-semibold tabular-nums">
                        {nf.format(last.followers)}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          g >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {g >= 0 ? "+" : ""}
                        {g.toFixed(1)}%
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      {[
                        ["Engagement", `${Number(last.engagement_rate).toFixed(1)}%`],
                        ["Reach", compact(last.reach)],
                        ["Impressions", compact(last.impressions)],
                        ["Posts", nf.format(last.posts)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-muted/60 p-2.5">
                          <dt className="text-xs text-muted-foreground">{k}</dt>
                          <dd className="font-semibold tabular-nums">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Last updated {new Date(last.recorded_on).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No metrics recorded yet.</p>
                )}

                {a.profile_url ? (
                  <a
                    href={a.profile_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Open profile <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
