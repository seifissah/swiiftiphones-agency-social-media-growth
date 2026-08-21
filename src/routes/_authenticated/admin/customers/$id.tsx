import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import {
  logAudit,
  notify,
  useAccounts,
  useCustomer,
  useGoals,
  useMetrics,
  useReports,
} from "@/lib/data";
import {
  MONTHS,
  PLATFORMS,
  PLATFORM_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  avgEngagement,
  buildSeries,
  compact,
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
import { EmptyState, LoadingBlock } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  component: CustomerDetail,
});

const today = () => new Date().toISOString().slice(0, 10);

function CustomerDetail() {
  const { id } = Route.useParams();
  const { profile: admin } = useApp();
  const qc = useQueryClient();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: accounts } = useAccounts(id);
  const accIds = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(accIds);
  const { data: reports } = useReports(id);
  const { data: goals } = useGoals(id);

  const [newAccount, setNewAccount] = useState({ platform: "instagram", handle: "", url: "" });
  const [metricForm, setMetricForm] = useState({
    accountId: "",
    recorded_on: today(),
    followers: "",
    posts: "",
    likes: "",
    comments: "",
    reach: "",
    impressions: "",
    views: "",
    engagement_rate: "",
  });
  const [goalForm, setGoalForm] = useState({
    platform: "instagram",
    metric: "followers",
    target_value: "",
    deadline: "",
  });
  const { data: adminNote } = useQuery({
    queryKey: ["admin-note", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_admin_notes")
        .select("notes")
        .eq("profile_id", id)
        .maybeSingle();
      return data?.notes ?? "";
    },
  });
  const { data: changeLog } = useQuery({
    queryKey: ["profile-changes", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_change_log")
        .select("id, field, old_value, new_value, changed_at")
        .eq("profile_id", id)
        .order("changed_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (adminNote !== undefined) setNotes(adminNote);
  }, [adminNote]);

  const latest = latestPerAccount(metrics ?? []);
  const prev = previousPerAccount(metrics ?? []);
  const followers = sumField(latest, "followers");
  const growthPct = growth(followers, sumField(prev, "followers"));
  const engagement = avgEngagement(latest);
  const reach = sumField(latest, "reach");
  const posts = sumField(latest, "posts");
  const score = performanceScore({ growthPct, engagement, reach, posts });
  const band = scoreBand(score);
  const series = useMemo(() => buildSeries(metrics ?? []), [metrics]);

  if (isLoading) return <LoadingBlock rows={4} />;
  if (!customer) return <EmptyState title="Customer not found" />;

  async function addAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccount.handle.trim()) return;
    const { error } = await supabase.from("social_accounts").insert({
      customer_id: id,
      platform: newAccount.platform,
      handle: newAccount.handle.trim(),
      profile_url: newAccount.url.trim() || null,
      data_source: "manual",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewAccount({ platform: "instagram", handle: "", url: "" });
    toast.success("Social account added.");
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function removeAccount(accountId: string) {
    const { error } = await supabase.from("social_accounts").delete().eq("id", accountId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account removed.");
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["metrics"] });
  }

  async function addMetric(e: React.FormEvent) {
    e.preventDefault();
    if (!metricForm.accountId) {
      toast.error("Choose an account first.");
      return;
    }
    const num = (v: string) => (v.trim() ? Number(v) : 0);
    const { error } = await supabase.from("social_metrics").insert({
      social_account_id: metricForm.accountId,
      recorded_on: metricForm.recorded_on,
      followers: num(metricForm.followers),
      posts: num(metricForm.posts),
      likes: num(metricForm.likes),
      comments: num(metricForm.comments),
      reach: num(metricForm.reach),
      impressions: num(metricForm.impressions),
      views: num(metricForm.views),
      engagement_rate: num(metricForm.engagement_rate),
      source: "manual",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      adminName: admin?.full_name ?? "Admin",
      action: "recorded metrics",
      customerId: id,
      customerName: customer!.full_name,
    });
    toast.success("Metrics recorded.");
    setMetricForm({ ...metricForm, followers: "", posts: "", likes: "", comments: "" });
    qc.invalidateQueries({ queryKey: ["metrics"] });
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalForm.target_value) return;
    const { error } = await supabase.from("goals").insert({
      customer_id: id,
      platform: goalForm.platform,
      metric: goalForm.metric,
      starting_value: followers,
      current_value: followers,
      target_value: Number(goalForm.target_value),
      deadline: goalForm.deadline || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await notify(
      id,
      "New goal set",
      `A new ${PLATFORM_LABEL[goalForm.platform]} ${goalForm.metric} goal was added to your account.`,
    );
    setGoalForm({ ...goalForm, target_value: "", deadline: "" });
    toast.success("Goal created.");
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  async function saveNotes() {
    const { error } = await supabase
      .from("profile_admin_notes")
      .upsert({ profile_id: id, notes, updated_at: new Date().toISOString() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notes saved.");
    qc.invalidateQueries({ queryKey: ["admin-note", id] });
  }

  async function changeStatus(next: "active" | "suspended" | "rejected") {
    const { error } = await supabase.from("profiles").update({ status: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      adminName: admin?.full_name ?? "Admin",
      action: `set status to ${next}`,
      customerId: id,
      customerName: customer!.full_name,
    });
    toast.success(`Status updated to ${next}.`);
    qc.invalidateQueries({ queryKey: ["customer", id] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/customers">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to customers
        </Link>
      </Button>

      <header className="panel flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary font-semibold">
            {initials(customer.full_name)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold">{customer.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.email} · @{customer.username}
              {customer.company_name ? ` · ${customer.company_name}` : ""}
            </p>
            <span
              className={cn(
                "mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium",
                STATUS_TONE[customer.status],
              )}
            >
              {STATUS_LABEL[customer.status] ?? customer.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="panel flex items-center gap-2 px-3 py-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", band.dot)} />
            <span className="text-sm font-semibold">{score}/100</span>
          </div>
          {customer.status === "active" ? (
            <Button variant="outline" onClick={() => changeStatus("suspended")}>
              Suspend
            </Button>
          ) : (
            <Button variant="outline" onClick={() => changeStatus("active")}>
              Activate
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Followers" value={nf.format(followers)} delta={growthPct} />
        <StatCard label="Engagement" value={`${engagement.toFixed(2)}%`} />
        <StatCard label="Reach" value={compact(reach)} />
        <StatCard label="Accounts" value={accounts?.length ?? 0} />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="metrics">Add metrics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <section className="panel p-5">
            <h2 className="font-display text-lg font-semibold">Account details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Full name", customer.full_name],
                ["Username", `@${customer.username}`],
                ["Email", customer.email],
                ["Phone", customer.phone || "—"],
                ["Company", customer.company_name || "—"],
                ["Status", STATUS_LABEL[customer.status] ?? customer.status],
                ["Signed up", new Date(customer.created_at).toLocaleString()],
                [
                  "Last login",
                  customer.last_login ? new Date(customer.last_login).toLocaleString() : "Never",
                ],
                ["Last updated", new Date(customer.updated_at).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {customer.bio ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{customer.bio}</p>
              </div>
            ) : null}
          </section>

          <section className="panel p-5">
            <h2 className="font-display text-lg font-semibold">Edit history</h2>
            <p className="text-sm text-muted-foreground">
              Every change this client makes to their profile is recorded here, including the
              original value.
            </p>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Was</TableHead>
                    <TableHead>Changed to</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(changeLog ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(c.changed_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">{c.field.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-muted-foreground line-through">
                        {c.old_value || "—"}
                      </TableCell>
                      <TableCell className="font-medium">{c.new_value || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!(changeLog ?? []).length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No profile edits recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </section>
        </TabsContent>


        <TabsContent value="growth" className="mt-4">
          <section className="panel p-5">
            <h2 className="font-display text-lg font-semibold">Follower history</h2>
            <div className="mt-4">
              <GrowthChart data={series} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(accounts ?? []).map((a) => (
              <article key={a.id} className="panel flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{PLATFORM_LABEL[a.platform] ?? a.platform}</p>
                  <p className="text-sm text-muted-foreground">{a.handle}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => removeAccount(a.id)}>
                  Remove
                </Button>
              </article>
            ))}
          </div>
          <form onSubmit={addAccount} className="panel grid gap-3 p-5 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={newAccount.platform}
                onValueChange={(v) => setNewAccount({ ...newAccount, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Handle</Label>
              <Input
                value={newAccount.handle}
                onChange={(e) => setNewAccount({ ...newAccount, handle: e.target.value })}
                placeholder="@brand"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile URL</Label>
              <Input
                value={newAccount.url}
                onChange={(e) => setNewAccount({ ...newAccount, url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add account
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <form onSubmit={addMetric} className="panel grid gap-3 p-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={metricForm.accountId}
                onValueChange={(v) => setMetricForm({ ...metricForm, accountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {PLATFORM_LABEL[a.platform]} · {a.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={metricForm.recorded_on}
                onChange={(e) => setMetricForm({ ...metricForm, recorded_on: e.target.value })}
              />
            </div>
            {(
              [
                ["followers", "Followers"],
                ["posts", "Posts"],
                ["likes", "Likes"],
                ["comments", "Comments"],
                ["reach", "Reach"],
                ["impressions", "Impressions"],
                ["views", "Views"],
                ["engagement_rate", "Engagement %"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="any"
                  value={metricForm[key]}
                  onChange={(e) => setMetricForm({ ...metricForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex items-end sm:col-span-3">
              <Button type="submit">Record snapshot</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="goals" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(goals ?? []).map((g) => (
              <article key={g.id} className="panel p-4">
                <p className="font-medium">
                  {PLATFORM_LABEL[g.platform]} · {g.metric}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nf.format(g.current_value)} / {nf.format(g.target_value)}
                  {g.deadline ? ` · due ${new Date(g.deadline).toLocaleDateString()}` : ""}
                </p>
              </article>
            ))}
          </div>
          <form onSubmit={addGoal} className="panel grid gap-3 p-5 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={goalForm.platform}
                onValueChange={(v) => setGoalForm({ ...goalForm, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Metric</Label>
              <Input
                value={goalForm.metric}
                onChange={(e) => setGoalForm({ ...goalForm, metric: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input
                type="number"
                value={goalForm.target_value}
                onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
              />
            </div>
            <div className="sm:col-span-4">
              <Button type="submit">Create goal</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {(reports ?? []).length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Generate monthly reports from the Reports section."
              action={
                <Button asChild className="mt-3">
                  <Link to="/admin/reports">Go to reports</Link>
                </Button>
              }
            />
          ) : (
            (reports ?? []).map((r) => (
              <article key={r.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {MONTHS[r.month - 1]} {r.year}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {r.performance_score}/100 · {r.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="panel space-y-3 p-5">
            <Label htmlFor="notes">Internal notes (never shown to the customer)</Label>
            <Textarea
              id="notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={saveNotes}>Save notes</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
