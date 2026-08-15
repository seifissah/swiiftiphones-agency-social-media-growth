import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn("panel p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="rounded-lg bg-secondary p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {`${positive ? "+" : ""}${delta.toFixed(1)}%`}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
