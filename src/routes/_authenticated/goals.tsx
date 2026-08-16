import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { useGoals } from "@/lib/data";
import { PLATFORM_LABEL, nf } from "@/lib/platform";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/goals")({
  component: MyGoals,
});

function MyGoals() {
  const { profile } = useApp();
  const { data: goals, isLoading } = useGoals(profile?.id);

  if (isLoading) return <LoadingBlock rows={3} />;

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Targets set with your account manager, and how close you are to hitting them."
      />
      {!goals?.length ? (
        <EmptyState
          title="No goals yet"
          description="Your account manager hasn't set any growth targets for you."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const pctDone = Math.min(
              100,
              Math.round((g.current_value / Math.max(g.target_value, 1)) * 100),
            );
            const remaining = Math.max(0, g.target_value - g.current_value);
            return (
              <article key={g.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {PLATFORM_LABEL[g.platform] ?? g.platform} · {g.metric}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {g.deadline
                        ? `Target date ${new Date(g.deadline).toLocaleDateString()}`
                        : "No deadline"}
                    </p>
                  </div>
                  <Badge variant={g.status === "achieved" ? "default" : "secondary"}>
                    {g.status}
                  </Badge>
                </div>
                <p className="mt-4 font-display text-2xl font-semibold tabular-nums">
                  {nf.format(g.current_value)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    / {nf.format(g.target_value)}
                  </span>
                </p>
                <Progress value={pctDone} className="mt-3 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {pctDone}% complete · {nf.format(remaining)} to go · started at{" "}
                  {nf.format(g.starting_value)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
