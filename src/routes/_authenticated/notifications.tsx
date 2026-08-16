import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { useNotifications } from "@/lib/data";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { profile } = useApp();
  const qc = useQueryClient();
  const { data: items, isLoading } = useNotifications(profile?.id);

  async function markAll() {
    if (!profile) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("customer_id", profile.id)
      .eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  if (isLoading) return <LoadingBlock rows={3} />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Approvals, published reports, goal milestones and account updates."
        actions={
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />
      {!items?.length ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "panel flex gap-3 p-4",
                !n.read && "border-primary/30 bg-primary/[0.04]",
              )}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">{n.title}</p>
                {n.message ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
