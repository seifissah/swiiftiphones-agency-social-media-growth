import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compact } from "@/lib/platform";

type Point = { label: string; followers: number; engagement?: number };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-popover-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function GrowthChart({ data, height = 300 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          tickFormatter={(v: number) => compact(v)}
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="followers"
          name="Followers"
          stroke="var(--color-chart-1)"
          strokeWidth={2.5}
          fill="url(#followersFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EngagementChart({ data, height = 240 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="engagement"
          name="Engagement %"
          stroke="var(--color-chart-2)"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
