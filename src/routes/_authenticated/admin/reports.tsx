import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { profile: admin } = useApp();
  const qc = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: accounts } = useAccounts();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const { data: reports, isLoading } = useReports();

  const now = new Date();
  const [customerId, setCustomerId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const nameById = useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers],
  );

  function statsFor(id: string) {
    const accIds = new Set((accounts ?? []).filter((a) => a.customer_id === id).map((a) => a.id));
    return computeStats((metrics ?? []).filter((m) => accIds.has(m.social_account_id)));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Choose a customer.");
      return;
    }
    const s = statsFor(customerId);
    const name = nameById.get(customerId) ?? "Client";
    const period = `${MONTHS[Number(month) - 1]} ${year}`;
    const summary = buildSummary(name, period, s);
    const recommendations = buildRecommendations(s);

    setBusy(true);
    const { error } = await supabase.from("monthly_reports").insert({
      customer_id: customerId,
      month: Number(month),
      year: Number(year),
      summary,
      recommendations,
      admin_notes: notes || null,
      performance_score: s.score,
      status: "draft",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      adminName: admin?.full_name ?? "Admin",
      action: "generated monthly report",
      customerId,
      customerName: name,
      details: `${MONTHS[Number(month) - 1]} ${year}`,
    });
    setNotes("");
    toast.success("Report generated as draft.");
    qc.invalidateQueries({ queryKey: ["reports"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
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
          <Button type="submit" className="w-full" disabled={busy}>
            Generate report
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
    </div>
  );
}
