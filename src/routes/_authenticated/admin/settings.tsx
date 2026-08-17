import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const [form, setForm] = useState({
    platform_name: "Pulsegrid",
    auto_approve: false,
    show_rankings_to_customers: false,
    weight_growth: 40,
    weight_engagement: 30,
    weight_reach: 20,
    weight_activity: 10,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        platform_name: settings.platform_name,
        auto_approve: settings.auto_approve,
        show_rankings_to_customers: settings.show_rankings_to_customers,
        weight_growth: settings.weight_growth,
        weight_engagement: settings.weight_engagement,
        weight_reach: settings.weight_reach,
        weight_activity: settings.weight_activity,
      });
    }
  }, [settings]);

  const total =
    form.weight_growth + form.weight_engagement + form.weight_reach + form.weight_activity;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved.");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  if (isLoading) return <LoadingBlock rows={3} />;

  return (
    <div>
      <PageHeader
        title="Platform settings"
        description="Control approvals, visibility and how performance scores are calculated."
      />
      <form onSubmit={save} className="grid max-w-3xl gap-4">
        <section className="panel space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="pn">Platform name</Label>
            <Input
              id="pn"
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Auto-approve new registrations</p>
              <p className="text-sm text-muted-foreground">
                Skip the approval queue and activate accounts immediately.
              </p>
            </div>
            <Switch
              checked={form.auto_approve}
              onCheckedChange={(v) => setForm({ ...form, auto_approve: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Show rankings to customers</p>
              <p className="text-sm text-muted-foreground">
                Let clients see how they compare with other accounts.
              </p>
            </div>
            <Switch
              checked={form.show_rankings_to_customers}
              onCheckedChange={(v) => setForm({ ...form, show_rankings_to_customers: v })}
            />
          </div>
        </section>

        <section className="panel space-y-4 p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Performance score weights</h2>
            <p className="text-sm text-muted-foreground">
              Current total: {total} (values are normalised to 100)
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {(
              [
                ["weight_growth", "Growth"],
                ["weight_engagement", "Engagement"],
                ["weight_reach", "Reach"],
                ["weight_activity", "Activity"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </section>

        <div>
          <Button type="submit" disabled={busy}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
