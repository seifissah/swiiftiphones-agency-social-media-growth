import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { ReportEditor } from "@/components/app/ReportEditor";
import { createReportDraft } from "@/lib/report-document";
import { downloadReportPdf } from "@/lib/report-pdf";
import { usePerformanceReviews, resolveScore } from "@/lib/reviews";
import { PLATFORM_LABEL } from "@/lib/platform";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { logAudit, notify, useAccounts, useCustomers, useMetrics, useReports } from "@/lib/data";
import {
  MONTHS,
  buildRecommendations,
  buildSummary,
  computeStats,
  scoreBand,
} from "@/lib/platform";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ReportPreview,
  buildAchievements,
  buildAcknowledgement,
  packSummary,
  unpackSummary,
  type ReportDraft,
} from "@/components/app/ReportPreview";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  validateSearch: (search: Record<string, unknown>) => ({ customer: typeof search.customer === "string" ? search.customer : undefined, report: typeof search.report === "string" ? search.report : undefined }),
  head: () => ({ meta: [{ title: "Report Studio | Swiiftiphones Agency" }, { name: "description", content: "Prepare, review and publish client-specific monthly growth reports." }, { property: "og:title", content: "Report Studio | Swiiftiphones Agency" }, { property: "og:description", content: "Monthly growth reports prepared for agency clients." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AdminReports,
});

function AdminReports() {
  const { profile: admin } = useApp();
  const qc = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: accounts } = useAccounts();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics, isFetching: loadingMetrics } = useMetrics(ids);
  const { data: reports, isLoading } = useReports();

  const now = new Date();
  const search = Route.useSearch();
  const [customerId, setCustomerId] = useState(search.customer ?? "");
  const { data: reviews } = usePerformanceReviews(customerId);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{
    reportId: string | null;
    customerId: string;
    month: number;
    year: number;
    score: number;
    status: string;
    draft: ReportDraft;
  } | null>(null);

  const nameById = useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers],
  );

  function statsFor(id: string) {
    const accIds = new Set((accounts ?? []).filter((a) => a.customer_id === id).map((a) => a.id));
    return computeStats((metrics ?? []).filter((m) => accIds.has(m.social_account_id)));
  }

  function metricsFor(id: string) {
    const accIds = new Set((accounts ?? []).filter((a) => a.customer_id === id).map((a) => a.id));
    return (metrics ?? []).filter((m) => accIds.has(m.social_account_id));
  }

  function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Choose a customer.");
      return;
    }
    const m = Number(month);
    const y = Number(year);
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const upto = metricsFor(customerId).filter((x) => x.recorded_on.slice(0, 7) <= key);
    const s = computeStats(upto);
    const reviewed = resolveScore(s.score, reviews?.find(r => r.social_account_id === null));
    const name = nameById.get(customerId) ?? "Client";
    const draft = createReportDraft(name, metricsFor(customerId), m, y, admin?.full_name || "Swiiftiphones Agency", (accounts ?? []).filter(a => a.customer_id === customerId).map(a => `${PLATFORM_LABEL[a.platform] ?? a.platform} @${a.handle.replace(/^@/, "")}`));
    draft.rating = reviewed.label;
    if (reviewed.comment) draft.improvements = reviewed.comment;
    setPreview({ reportId: null, customerId, month: m, year: y, score: reviewed.score, status: "draft", draft });
    setEditing(false);
  }

  function openExisting(r: NonNullable<typeof reports>[number]) {
    setPreview({
      reportId: r.id,
      customerId: r.customer_id,
      month: r.month,
      year: r.year,
      score: r.performance_score,
      status: r.status,
      draft: { ...unpackSummary(r.summary), recommendations: r.recommendations ?? unpackSummary(r.summary).recommendations },
    });
    setEditing(false);
  }

  useEffect(() => {
    if (!search.report || !reports) return;
    const report = reports.find(r => r.id === search.report);
    if (report) openExisting(report);
  }, [search.report, reports]);

  async function savePreview(publishNow: boolean) {
    if (!preview) return;
    if (publishNow && preview.draft.invoice && (!preview.draft.invoice.number.trim() || !preview.draft.invoice.service.trim() || !preview.draft.invoice.amount.trim() || !Number.isFinite(Number(preview.draft.invoice.amount)) || Number(preview.draft.invoice.amount) < 0 || !preview.draft.invoice.currency.trim() || !preview.draft.invoice.terms.trim())) {
      toast.error("Complete the invoice number, service, amount, currency and payment terms before publishing."); return;
    }
    const name = nameById.get(preview.customerId) ?? "Client";
    const label = `${MONTHS[preview.month - 1]} ${preview.year}`;
    const payload = {
      summary: packSummary(preview.draft),
      recommendations: preview.draft.recommendations,
      status: publishNow ? "published" : preview.status === "published" ? "published" : "draft",
    };
    setBusy(true);
    const { error } = preview.reportId
      ? await supabase.from("monthly_reports").update(payload).eq("id", preview.reportId)
      : await supabase.from("monthly_reports").insert({
          ...payload,
          customer_id: preview.customerId,
          month: preview.month,
          year: preview.year,
          admin_notes: notes || null,
          performance_score: preview.score,
        });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      adminName: admin?.full_name ?? "Admin",
      action: publishNow ? "published monthly report" : "saved monthly report",
      customerId: preview.customerId,
      customerName: name,
      details: label,
    });
    if (publishNow && preview.status !== "published")
      await notify(preview.customerId, "New monthly report available", `Your ${label} report has been published.`);
    setNotes("");
    setPreview(null);
    toast.success(publishNow ? "Report published to client." : "Report saved as draft.");
    qc.invalidateQueries({ queryKey: ["reports"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
  }

  function setField(k: keyof ReportDraft, v: string) {
    setPreview((p) => (p ? { ...p, draft: { ...p.draft, [k]: v } } : p));
  }

  async function publish(reportId: string, cid: string, label: string) {
    const { error } = await supabase
      .from("monthly_reports")
      .update({ status: "published" })
      .eq("id", reportId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await notify(cid, "New monthly report available", `Your ${label} report has been published.`);
    toast.success("Report published.");
    qc.invalidateQueries({ queryKey: ["reports"] });
  }

  async function remove(reportId: string) {
    const { error } = await supabase.from("monthly_reports").delete().eq("id", reportId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report deleted.");
    qc.invalidateQueries({ queryKey: ["reports"] });
  }

  if (isLoading) return <LoadingBlock rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate monthly performance reports and publish them to clients."
      />

      <form onSubmit={generate} className="panel grid gap-3 p-5 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {(customers ?? [])
                .filter((c) => c.status === "active")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={busy || loadingMetrics || !customers || !accounts}>
            Preview full report
          </Button>
        </div>
        <div className="space-y-2 sm:col-span-4">
          <Label>Internal notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </form>

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reports ?? []).map((r) => {
              const band = scoreBand(r.performance_score);
              const label = `${MONTHS[r.month - 1]} ${r.year}`;
              return (
                <TableRow key={r.id}>
                  <TableCell>{nameById.get(r.customer_id) ?? "Unknown"}</TableCell>
                  <TableCell>{label}</TableCell>
                  <TableCell className={cn("text-right font-semibold", band.tone)}>
                    {r.performance_score}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openExisting(r)}>
                        View
                      </Button>
                      {r.status !== "published" ? (
                        <Button size="sm" onClick={() => publish(r.id, r.customer_id, label)}>
                          Publish
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => remove(r.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!reports?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No reports generated yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report preview</DialogTitle>
            <DialogDescription>
              This is exactly what the client will see. Edit any section before publishing.
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            editing ? (
              <ReportEditor draft={preview.draft} onChange={draft => setPreview(p => p ? { ...p, draft } : p)} />
            ) : (
              <ReportPreview
                clientName={nameById.get(preview.customerId) ?? "Client"}
                month={preview.month}
                year={preview.year}
                score={preview.score}
                metrics={metricsFor(preview.customerId)}
                draft={preview.draft}
              />
            )
          ) : null}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" disabled={!preview || busy} onClick={async () => { if (!preview) return; try { await downloadReportPdf(nameById.get(preview.customerId) ?? "Client", preview.month, preview.year, preview.score, metricsFor(preview.customerId), preview.draft); } catch { toast.error("The PDF could not be created. Please try again."); } }}><Download className="mr-1.5 h-4 w-4" />Download PDF</Button>
            <Button variant="outline" onClick={() => setEditing((v) => !v)}>
              {editing ? "Back to preview" : "Edit sections"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => savePreview(false)}>
              {preview?.status === "published" ? "Save changes" : "Save as draft"}
            </Button>
            {preview?.status !== "published" ? (
              <Button disabled={busy} onClick={() => savePreview(true)}>
                Publish to client
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
