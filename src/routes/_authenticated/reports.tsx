import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadReportPdf } from "@/lib/report-pdf";
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
  head: () => ({ meta: [{ title: "Your Monthly Reports | Swiiftiphones Agency" }, { name: "description", content: "Read and download your published monthly social media growth reports." }, { property: "og:title", content: "Your Monthly Reports | Swiiftiphones Agency" }, { property: "og:description", content: "Your account manager’s monthly performance reports." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: MyReports,
});

function MyReports() {
  const { profile } = useApp();
  const { data: reports, isLoading } = useReports(profile?.id);
  const { data: accounts } = useAccounts(profile?.id);
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <LoadingBlock rows={3} />;

  const published = (reports ?? []).filter((r) => r.status === "published");

  async function download(r: Report) {
    try { await downloadReportPdf(profile?.full_name ?? "Client", r.month, r.year, r.performance_score, metrics ?? [], { ...unpackSummary(r.summary), recommendations: r.recommendations ?? unpackSummary(r.summary).recommendations }); }
    catch { toast.error("The PDF could not be created. Please try again."); }
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
                      <Download className="mr-1.5 h-4 w-4" /> PDF
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
                      draft={{ ...unpackSummary(r.summary), recommendations: r.recommendations ?? unpackSummary(r.summary).recommendations }}
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
