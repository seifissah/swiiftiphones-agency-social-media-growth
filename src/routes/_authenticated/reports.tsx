import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAccounts, useMetrics, useReports, type Report } from "@/lib/data";
import { ReportPreview, unpackSummary } from "@/components/app/ReportPreview";
import { MONTHS, scoreBand } from "@/lib/platform";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  component: MyReports,
});

function reportText(r: Report, name: string) {
  const s = unpackSummary(r.summary);
  return [
    `${name} — Monthly performance report`,
    `${MONTHS[r.month - 1]} ${r.year}`,
    ``,
    `Performance score: ${r.performance_score}/100`,
    ``,
    `Acknowledgement`,
    s.acknowledgement || "—",
    ``,
    `What we achieved`,
    s.achievements || "—",
    ``,
    `Summary`,
    s.summary || "—",
    ``,
    `Recommendations for next month`,
    r.recommendations ?? "—",
  ].join("\n");
}

function MyReports() {
  const { profile } = useApp();
  const { data: reports, isLoading } = useReports(profile?.id);
  const { data: accounts } = useAccounts(profile?.id);
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <LoadingBlock rows={3} />;

  const published = (reports ?? []).filter((r) => r.status === "published");

  function download(r: Report) {
    const blob = new Blob([reportText(r, profile?.full_name ?? "Client")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${r.year}-${String(r.month).padStart(2, "0")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Monthly reports"
        description="Published performance summaries prepared by your account manager."
      />
      {!published.length ? (
        <EmptyState
          title="No reports published yet"
          description="Your first monthly report will appear here once it's published."
        />
      ) : (
        <div className="space-y-3">
          {published.map((r) => {
            const band = scoreBand(r.performance_score);
            const open = openId === r.id;
            return (
              <article key={r.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("h-2.5 w-2.5 rounded-full", band.dot)} />
                    <div>
                      <h2 className="font-display text-lg font-semibold">
                        {MONTHS[r.month - 1]} {r.year}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Score {r.performance_score}/100 · {band.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Published</Badge>
                    <Button variant="outline" size="sm" onClick={() => download(r)}>
                      <Download className="mr-1.5 h-4 w-4" /> Export
                    </Button>
                    <Button size="sm" onClick={() => setOpenId(open ? null : r.id)}>
                      {open ? "Hide" : "Read"}
                    </Button>
                  </div>
                </div>
                {open ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <ReportPreview
                      clientName={profile?.full_name ?? "Client"}
                      month={r.month}
                      year={r.year}
                      score={r.performance_score}
                      metrics={metrics ?? []}
                      draft={{ ...unpackSummary(r.summary), recommendations: r.recommendations ?? "" }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
